import { state } from './state.js';
import { showToast, render, promptForPin, promptToSetPin } from './ui.js';
import { upsertOne } from './data.js';

const LIBS = {
  jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  chart: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
};

export const loadLibrary = function(name) {
  return new Promise((resolve, reject) => {
    try {
      if (name === 'jspdf' && window.jspdf) return resolve(window.jspdf);
      if (name === 'xlsx' && window.XLSX) return resolve(window.XLSX);
      if (name === 'chart' && window.Chart) return resolve(window.Chart);
      if (window.__loadingLibs && window.__loadingLibs[name]) return window.__loadingLibs[name].then(resolve, reject);
      
      window.__loadingLibs = window.__loadingLibs || {};
      const src = LIBS[name];
      if (!src) return reject(new Error('Unknown library'));
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      const promise = new Promise((res, rej) => {
        script.onload = () => {
          if (name === 'jspdf') res(window.jspdf);
          else if (name === 'xlsx') res(window.XLSX);
          else if (name === 'chart') res(window.Chart);
          else res();
        };
        script.onerror = rej;
      });
      window.__loadingLibs[name] = promise;
      document.head.appendChild(script);
      try { showToast('Loading features...', 'info'); } catch {}
      promise.then(resolve).catch(reject);
    } catch (err) { reject(err); }
  });
};

export function getCurrencySymbol(){ return state.currencySymbol || 'Tsh'; }

export function setCurrency(code, symbol){ 
  state.currencyCode=String(code||'').toUpperCase()||'TZS'; 
  state.currencySymbol=symbol||'Tsh'; 
  try { window.saveData && window.saveData(); } catch {} 
  if (window.syncEnabled && window.currentUser) { 
    try { upsertOne('settings',{ currency_code: state.currencyCode, currency_symbol: state.currencySymbol }); } catch {} 
  } 
  try { render && render(); } catch {} 
}

export function applyCurrencySymbols(){ 
  const s=getCurrencySymbol(); 
  const root=document.getElementById('app'); 
  if (!root || !s) return; 
  const walker=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null); 
  const nodes=[]; 
  while (walker.nextNode()) nodes.push(walker.currentNode); 
  nodes.forEach(n=>{ 
    if (!n.nodeValue) return; 
    if (n.nodeValue.includes('Tsh')) n.nodeValue=n.nodeValue.replace(/Tsh/g,s); 
  }); 
}

export async function hashPin(pin){ 
  const enc=new TextEncoder(); 
  const uid=(window.currentUser && window.currentUser.id) || (window.getLocalOwnerUid && window.getLocalOwnerUid()) || ''; 
  const data=enc.encode(String(pin||'')+'|'+uid); 
  const digest=await crypto.subtle.digest('SHA-256', data); 
  const hex=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join(''); 
  return hex; 
}

export async function setSecurityPin(pin){
  if (!pin || !/^\d{4}$/.test(String(pin||''))) { try { showToast && showToast('Enter 4 digits','error'); } catch {} return false; }
  const h=await hashPin(pin);
  try { await upsertOne('settings',{ pin_hash:h }); } catch {}
  try { state.securityPinHash=h; state.securityPinUpdatedAt=new Date().toISOString(); window.saveData && window.saveData(); } catch {}
  try { showToast && showToast('PIN saved','success'); } catch {}
  return true;
}

export async function requirePinForDestructive(reason){
  if (window.__suppressPinForImport) {
    return true;
  }
  if (window.__pinVerificationInProgress) {
    return false;
  }
  const suppressToasts = reason === 'delete';
  const suppressInvalid = reason === 'edit';
  const isEditDelete = reason === 'delete' || reason === 'edit';
  try { window.__pinLastFailure = null; } catch {}
  window.__pinVerificationInProgress = true;
  try {
    const existing=state.securityPinHash||null;
    try {
      const lockRaw = localStorage.getItem('tuba-pin-lock-until');
      const lockUntil = lockRaw ? parseInt(lockRaw, 10) : 0;
      if (lockUntil && Date.now() < lockUntil){
        const mins = Math.ceil((lockUntil - Date.now())/60000);
        if (!isEditDelete && !suppressToasts) { showToast && showToast(`PIN locked for ${mins} min`, 'error'); }
        try { window.__pinLastFailure = 'locked'; } catch {}
        return false;
      }
    } catch {}
    if (!existing){
      const chosen=await promptToSetPin();
      if (!chosen || chosen.length!==4) { try { if (!isEditDelete && !suppressToasts) { showToast && showToast('PIN setup cancelled','error'); } } catch {} try { window.__pinLastFailure = 'cancel'; } catch {} return false; }
      const ok=await setSecurityPin(chosen);
      if (ok){ try { localStorage.removeItem('tuba-pin-fail-count'); localStorage.removeItem('tuba-pin-lock-until'); } catch {} }
      return !!ok;
    }
    const entered=await promptForPin();
    if (!entered){ try { window.__pinLastFailure = 'cancel'; } catch {} return false; }
    if (!/^\d{4}$/.test(String(entered||''))){ try { window.__pinLastFailure = 'invalid'; } catch {} try { if (isEditDelete) { showToast && showToast('Invalid PIN','error'); } else if (!suppressToasts && !suppressInvalid) { showToast && showToast('Invalid PIN','error'); } } catch {} return false; }
    const hashed=await hashPin(entered);
    const match = String(hashed||'')===String(existing||'');
    if (!match){
      try {
        const fcRaw = localStorage.getItem('tuba-pin-fail-count');
        const count = fcRaw ? parseInt(fcRaw, 10) : 0;
        const next = count + 1;
        localStorage.setItem('tuba-pin-fail-count', String(next));
        if (next >= 5){
          localStorage.setItem('tuba-pin-lock-until', String(Date.now() + 10*60*1000));
          localStorage.removeItem('tuba-pin-fail-count');
          if (!isEditDelete && !suppressToasts) { showToast && showToast('Too many attempts. PIN locked for 10 min', 'error'); }
        } else {
          if (!isEditDelete && !suppressToasts) { showToast && showToast('Wrong PIN', 'error'); }
        }
      } catch {}
      try { window.__pinLastFailure = 'invalid'; } catch {}
      try { if (isEditDelete) { showToast && showToast('Invalid PIN','error'); } } catch {}
      return false;
    }
    try { localStorage.removeItem('tuba-pin-fail-count'); localStorage.removeItem('tuba-pin-lock-until'); } catch {}
    return true;
  } finally {
    window.__pinVerificationInProgress = false;
  }
}

export function urlBase64ToUint8Array(base64String){
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
  return outputArray;
}
