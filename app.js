(function(){
  try {
    var raw = localStorage.getItem('financeManagerData');
    if (raw) {
      var parsed = JSON.parse(raw || '{}');
      var theme = parsed && parsed.theme;
      if (theme) {
        document.body.classList.toggle('theme-dark', theme === 'dark');
        document.body.classList.toggle('theme-blue', theme === 'blue' || theme === 'paywall');
      }
    }
  } catch (e) {}
  try {
    var isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone === true);
    if (isStandalone) { document.documentElement.classList.add('standalone'); }
  } catch {}
  try {
    function __updateModalOverflow() {
      try {
        var modals = Array.from(document.querySelectorAll('.modal'));
        var anyOpen = modals.some(function(m){ var shown = m.classList && m.classList.contains('show'); if (shown) return true; var ds = (m.style && m.style.display) ? m.style.display : ''; if (ds && ds !== 'none') return true; var cs = window.getComputedStyle(m); return (cs && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || '1') > 0); });
        try {
          var sideNav = document.getElementById('sideNav');
          if (sideNav && sideNav.classList && sideNav.classList.contains('open')) anyOpen = true;
        } catch {}
        document.body.style.overflow = anyOpen ? 'hidden' : '';
      } catch {}
    }
    window.__updateModalOverflow = __updateModalOverflow;
  } catch {}

  async function initPWA(){
    try {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
        navigator.serviceWorker.addEventListener('message', function (event) {
          if (!event || !event.data || !event.data.type) return;
          if (event.data.type === 'sync-queues') {
            try { upsertQueue.process(); } catch {}
            try { deleteQueue.process(); } catch {}
          }
          if (event.data.type === 'sw-updated') {
            try { console.log('New version available. Reload manually when ready.'); } catch {}
            try { showToast('Update available. Click refresh icon to apply.', 'info'); } catch {}
          }
          if (event.data.type === 'force-reload') {
            try { console.log('Update applied in background. Reload when convenient.'); } catch {}
          }
          if (event.data.type === 'badge-update') {
            try {
              var n = Number(event.data.count || 1);
              try { localStorage.setItem('tuba-badge-count', String(n)); } catch {}
              if ('setAppBadge' in navigator) { try { navigator.setAppBadge(n).catch(()=>{}); } catch {} }
            } catch {}
          }
        });
      }
    } catch {}
  }
  const LIBS = {
    jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    chart: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
  };
  window.__loadingLibs = window.__loadingLibs || {};
  window.loadLibrary = function(name) {
    return new Promise((resolve, reject) => {
      try {
        if (name === 'jspdf' && window.jspdf) return resolve(window.jspdf);
        if (name === 'xlsx' && window.XLSX) return resolve(window.XLSX);
        if (name === 'chart' && window.Chart) return resolve(window.Chart);
        if (window.__loadingLibs[name]) return window.__loadingLibs[name].then(resolve, reject);
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
  function requestBackgroundSync(){ try { navigator.serviceWorker.ready.then(function (reg) { reg.sync.register('sync-queues'); }); } catch {} }
  window.requestBackgroundSync = requestBackgroundSync;
  window.scrollToSalesHistory = function(){
    try {
      var btnList = document.querySelectorAll('button[onclick="scrollToSalesHistory()"]');
      var btn = btnList && btnList[0] ? btnList[0] : null;
      var beforeTop = btn ? btn.getBoundingClientRect().top : window.scrollY;
      try { state.showSalesHistory = true; } catch {}
      try { if (typeof showAllList === 'function') { showAllList('sales'); } } catch {}
      try {
        requestAnimationFrame(function(){
          try {
            var afterTop = btn ? btn.getBoundingClientRect().top : beforeTop;
            var delta = beforeTop - afterTop;
            if (Math.abs(delta) > 1) window.scrollBy(0, delta);
          } catch {}
        });
      } catch {}
    } catch {}
  };
  window.API_URL = 'https://tuba-finances.vercel.app';

  window.SUPABASE_URL = window.SUPABASE_URL || 'https://ipatajqjrbwaicwdzpnp.supabase.co';
  window.APP_BASE_URL = window.APP_BASE_URL || (function(){
    try {
      return new URL('.', window.location.href).href;
    } catch (e) {
      return 'https://tuba-finances.vercel.app/';
    }
  })();
  window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwYXRhanFqcmJ3YWljd2R6cG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODkxMzksImV4cCI6MjA4NTE2NTEzOX0.CeM1UQZpyWmoDWw8Yv-1eiRd6cNzT4yODRKqtyZ2pSs';
  var supabase;
  window.currentUser = window.currentUser || null;
  window.syncEnabled = window.syncEnabled || false;
  window.autoCloudPullDone = window.autoCloudPullDone || false;
  window.isPaid = window.isPaid || false;
  window.paidChannel = window.paidChannel || null;
  window.paidPoll = window.paidPoll || null;
  window.__paywallInitialized = window.__paywallInitialized || false;

  const OWNER_UID_KEY='tuba-owner-uid';
  function getLocalOwnerUid(){ try { return localStorage.getItem(OWNER_UID_KEY) || ''; } catch { return ''; } }
  function setLocalOwnerUid(uid){ try { if (uid) localStorage.setItem(OWNER_UID_KEY, uid); } catch {} }
  function clearLocalAppData(){ try { localStorage.removeItem('financeManagerData'); } catch {} try { localStorage.removeItem('tuba-upsert-queue-v1'); } catch {} try { localStorage.removeItem('tuba-delete-queue-v1'); } catch {} try { localStorage.removeItem('tuba-upsert-queue-v2'); } catch {} try { localStorage.removeItem('tuba-delete-queue-v2'); } catch {} }
  function handleOwnerMismatch(uid){ try { clearLocalAppData(); setLocalOwnerUid(uid); } catch {} try { window.location.reload(); } catch {} }
  function ensureOwnershipOnSignIn(uid){ try { const prev=getLocalOwnerUid(); if (prev && prev!==uid){ handleOwnerMismatch(uid); return false; } setLocalOwnerUid(uid); return true; } catch { return true; } }
  window.ensureOwnershipOnSignIn = ensureOwnershipOnSignIn;

  function initSupabase(){
    try {
      if (!window.supabase || typeof window.supabase.createClient !== 'function') { window.syncEnabled = false; return; }
      supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, multiTab: true, storageKey: 'tuba-auth-token', storage: window.localStorage }
      });
      window.supabaseClient = supabase;
      window.supabase = supabase;
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session && window.currentUser && window.currentUser.id === session.user.id) {
          console.log('Session confirmed (background focus), skipping re-init.');
          return;
        }
        if (event === 'SIGNED_IN' && session) {
          window.currentUser = session.user; window.syncEnabled = true; if (ensureOwnershipOnSignIn(session.user.id)===false) return; window.autoCloudPullDone = false; try { updateSyncIndicator && updateSyncIndicator('synced'); } catch {} try { await maybeAutoPullCloudData(); } catch {} try { sendAuthToSW(session); } catch {} try { setupPaidRealtime(); startPaidPolling(); } catch {} try { if (typeof switchTab === 'function') { switchTab('sales'); } } catch {}
        } else if (event === 'SIGNED_OUT') {
          window.currentUser = null; window.syncEnabled = false; window.autoCloudPullDone = false; try { updateSyncIndicator && updateSyncIndicator('offline'); } catch {} try { render && render(); } catch {}
        } else if (event === 'TOKEN_REFRESHED' && session) {
          window.currentUser = session.user; window.syncEnabled = true; if (ensureOwnershipOnSignIn(session.user.id)===false) return; window.autoCloudPullDone = false; try { await maybeAutoPullCloudData(); } catch {} try { sendAuthToSW(session); } catch {} try { setupPaidRealtime(); startPaidPolling(); } catch {}
        }
      });
    } catch (error) { console.error('Supabase init error:', error); window.syncEnabled = false; }
  }
  window.initSupabase = initSupabase;

  async function restoreSession(){ try { if (!window.supabase || !supabase || !supabase.auth) return false; if (state && state.autoAuthDisabled) return false; const { data: { session } } = await supabase.auth.getSession(); if (session) { window.currentUser = session.user; window.syncEnabled = true; if (ensureOwnershipOnSignIn(session.user.id)===false) return false; try { updateSyncIndicator && updateSyncIndicator('synced'); } catch {} try { window.updateAuthBanner && window.updateAuthBanner(); } catch {} try { sendAuthToSW(session); } catch {} try { if (navigator.onLine) { await loadUserProfile(); } } catch {} try { await loadPrefetchedDataFromSW(); } catch {} if (navigator.onLine) { try { Promise.resolve().then(() => pullDataFromSupabase()).catch((e) => { console.warn('Cloud pull after restore failed:', e); }); } catch (e) { console.warn('Cloud pull after restore failed:', e); } } try { if (typeof switchTab === 'function') { switchTab('sales'); } } catch {} return true; } return false; } catch (error) { console.error('Restore session error:', error); try { if (String((error && error.message) || '').toLowerCase().includes('invalid refresh token')) { await supabase.auth.signOut(); window.currentUser=null; window.syncEnabled=false; try { updateSyncIndicator && updateSyncIndicator('offline'); } catch {} } } catch {} return false; } }
  window.restoreSession = restoreSession;

  function hasAnyLocalData(){ try { const nonEmpty = [state.products, state.sales, state.expenses, state.customers, state.invoices, state.receipts, state.notes, state.transactions, state.unpaidEntries, state.categories].some(arr => Array.isArray(arr) && arr.length > 0); const hasInv = state.inventory && Object.keys(state.inventory).length > 0; return nonEmpty || hasInv; } catch (e) { return false; } }
  window.hasAnyLocalData = hasAnyLocalData;

  function hardenPaywall(){
    const overlayId = 'paywall-overlay';
    const overlay = document.getElementById(overlayId);
    if (!overlay || window.isPaid) return;
    if (window.__paywallObserver) { try { window.__paywallObserver.disconnect(); } catch {} }
    const triggerSecurityLockout = () => {
      if (window.__paywallLockoutTriggered) return;
      window.__paywallLockoutTriggered = true;
      try { if (window.__paywallObserver) window.__paywallObserver.disconnect(); } catch {}
      document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#fff;color:#000;font-family:sans-serif;">
        <h1 style="font-size:3rem;margin-bottom:1rem;">404 Not Found</h1>
        <p>The requested resource could not be found.</p>
      </div>
    `;
      document.title = '404 Not Found';
    };
    const observer = new MutationObserver(() => {
      if (window.isPaid) {
        observer.disconnect();
        return;
      }
      const currentOverlay = document.getElementById(overlayId);
      if (!currentOverlay) {
        triggerSecurityLockout();
        return;
      }
      const style = window.getComputedStyle(currentOverlay);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        triggerSecurityLockout();
      }
    });
    const parent = overlay.parentNode || document.body;
    observer.observe(parent, { childList: true });
    observer.observe(overlay, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
    window.__paywallObserver = observer;
    try {
      Object.defineProperty(overlay, 'remove', {
        value: () => { triggerSecurityLockout(); }
      });
    } catch(e) {}
  }

  async function maybeAutoPullCloudData(){ if (!window.syncEnabled || !window.currentUser) return; if (window.autoCloudPullDone) return; const hasLocal = hasAnyLocalData(); if (!hasLocal) { try { await pullDataFromSupabase(); } finally { window.autoCloudPullDone = true; } } }
  window.maybeAutoPullCloudData = maybeAutoPullCloudData;

  async function loadUserProfile(){
    const localProfile = state.userProfile;
    const hasLocalProfile = localProfile && localProfile.businessName && localProfile.phone && localProfile.address;
    if (!window.syncEnabled || !window.currentUser) {
      if (!hasLocalProfile) { state.profileEditMode = true; state.profileLoaded = false; }
      else { state.profileEditMode = false; state.profileLoaded = true; }
      return;
    }
    try {
      const { data } = await supabase.from('user_profiles').select('*').eq('user_id', window.currentUser.id).single();
      if (data && typeof data.is_paid !== 'undefined') { window.isPaid = data.is_paid === true; }
      if (!data) {
        window.isPaid = false;
        const overlay = document.getElementById('paywall-overlay');
        const idSpan = document.getElementById('paywall-user-id');
        if (overlay) {
          overlay.style.display = 'flex';
          if (idSpan && window.currentUser) idSpan.textContent = window.currentUser.email;
          try { hardenPaywall(); } catch {}
        }
        window.__paywallInitialized = true;
        document.body.style.overflow = 'hidden';
        try { await supabase.from('user_profiles').upsert({ user_id: window.currentUser.id, email: (window.currentUser && window.currentUser.email) || '' , is_paid: false }, { onConflict: 'user_id' }); } catch {}
        return;
      }
      if (data) {
        state.userProfile = {
          businessName: data.business_name || '',
          email: data.email || window.currentUser.email || '',
          phone: data.phone || '',
          address: data.address || '',
          country: data.country || '',
          city: data.city || '',
          role: data.role || (state.userProfile && state.userProfile.role) || 'owner',
          vatNumber: data.vat_number || (state.userProfile && state.userProfile.vatNumber) || ''
        };
        state.userProfile.tinNumber = data.tin_number || state.userProfile.vatNumber || '';
        state.userProfile.blNumber = data.business_license_number || state.userProfile.blNumber || '';
        state.userProfile.hasVAT = (data.has_vat === true) || !!state.userProfile.vatNumber;
        if (data.logo_data) {
          state.userLogoDataUrl = data.logo_data;
          state.userLogoMime = data.logo_mime || (String(data.logo_data).startsWith('data:image/png') ? 'image/png' : 'image/jpeg');
        }
        state.profileEditMode = false;
        state.profileLoaded = true;
        try { saveData && saveData(); } catch {}
        if (data.is_paid !== true) {
          const overlay = document.getElementById('paywall-overlay');
          const idSpan = document.getElementById('paywall-user-id');
          if (overlay) {
            overlay.style.display = 'flex';
            if (idSpan && window.currentUser) idSpan.textContent = window.currentUser.email;
            try { hardenPaywall(); } catch {}
          }
          window.__paywallInitialized = true;
          document.body.style.overflow = 'hidden';
          return;
        } else {
          const overlay = document.getElementById('paywall-overlay');
          if (overlay) overlay.style.display = 'none';
          window.__paywallInitialized = true;
          document.body.style.overflow = '';
        }
    } else {
      state.profileEditMode = false;
      state.profileLoaded = true;
      }
    } catch (e) { console.warn('Error loading profile:', e); }
  }
  window.loadUserProfile = loadUserProfile;

  function setupPaidRealtime(){
    try {
      if (!supabase || !window.currentUser) return;
      if (window.paidChannel) { try { supabase.removeChannel(window.paidChannel); } catch {} }
      window.paidChannel = supabase
        .channel('user-profile-paid')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles', filter: 'user_id=eq.' + window.currentUser.id }, function(payload){
          try {
            var row = payload && payload.new ? payload.new : null;
            if (row && row.is_paid === true) {
              window.isPaid = true;
              var overlay = document.getElementById('paywall-overlay'); if (overlay) overlay.style.display = 'none';
              document.body.style.overflow = '';
              try { render && render(); } catch {}
            }
          } catch {}
        })
        .subscribe();
    } catch {}
  }

  function startPaidPolling(){
    try {
      if (window.paidPoll) { try { clearInterval(window.paidPoll); } catch {} }
      window.paidPoll = setInterval(async function(){
        try {
          if (!supabase || !window.currentUser) return;
          const { data } = await supabase.from('user_profiles').select('is_paid').eq('user_id', window.currentUser.id).single();
          if (data && data.is_paid === true) {
            window.isPaid = true;
            var overlay = document.getElementById('paywall-overlay'); if (overlay) overlay.style.display = 'none';
            document.body.style.overflow = '';
            try { clearInterval(window.paidPoll); } catch {}
            try { render && render(); } catch {}
          }
        } catch {}
      }, 5000);
    } catch {}
  }

  // ================================
  // Queues, upsert/delete, audit
  // ================================
  async function pushToSupabase(table, data){ if (!window.syncEnabled || !window.currentUser) return; if (!window.isPaid && table !== 'user_profiles') return; try { data.user_id = window.currentUser.id; await supabase.from(table).insert(data); } catch (error) { console.error(`Error syncing to ${table}:`, error); } }
  window.pushToSupabase = pushToSupabase;

  window.conflictTargets = window.conflictTargets || {
    products:'user_id,name,category', categories:'user_id,name', sales:'user_id,timestamp', expenses:'user_id,timestamp', income:'user_id,timestamp', customers:'user_id,name,email', invoices:'user_id,number', receipts:'user_id,timestamp', inventory:'user_id,product_name', inventory_purchases:'user_id,timestamp', inventory_purchase_periods:'user_id,period_number', notes:'user_id,timestamp', transactions:'user_id,timestamp', unpaid_entries:'user_id,timestamp', transaction_floats:'user_id,channel', settings:'user_id', assets:'user_id,timestamp', maintenance:'user_id,timestamp', tithing:'user_id,month_key', user_profiles:'user_id'
  };

  function auditBuildItemKey(table, src){ let k=''; switch(table){ case 'sales': case 'expenses': case 'notes': case 'transactions': case 'receipts': case 'unpaid_entries': case 'assets': case 'maintenance': k=String((src||{}).timestamp||''); break; case 'invoices': k=String((src||{}).number||''); break; case 'customers': k=[String((src||{}).name||''), String((src||{}).email||'')].join('|'); break; case 'products': k=[String((src||{}).name||''), String((src||{}).category||'')].join('|'); break; case 'categories': k=typeof src==='string'?String(src):String((src||{}).name||src); break; case 'inventory': k=String((src||{}).product_name||''); break; case 'inventory_purchases': k=String((src||{}).timestamp||''); break; case 'inventory_purchase_periods': k=String((src||{}).period_number||src.cycleNumber||src.number||''); break; case 'settings': k='settings'; break; default: k=String((src||{}).timestamp||''); } return k; }
  window.auditBuildItemKey = auditBuildItemKey;
  function auditLog(action, table, src, payload){ if (!window.syncEnabled || !window.currentUser) return; const entry={ action, table_name:table, item_key:auditBuildItemKey(table, src||{}), payload:payload||null, timestamp:Date.now(), client_version:'web-v1' }; try { window.__pinInternalWrite = true; pushToSupabase('audit_logs', entry); } catch {} finally { window.__pinInternalWrite = false; } }
  window.auditLog = auditLog;
  function reportClientError(type, message, source, stack){ if (!message) return; const entry={ type:String(type||''), message:String(message||'').slice(0,4000), source:String(source||''), stack:String(stack||''), timestamp:Date.now() }; try { window.__pinInternalWrite = true; pushToSupabase('client_errors', entry); } catch {} finally { window.__pinInternalWrite = false; } }
  window.reportClientError = reportClientError;
  function getRole(){ const r = (state&&state.userProfile&&state.userProfile.role) || 'owner'; return r; }
  window.getRole = getRole;
  window.ROLE_CAPABILITIES = window.ROLE_CAPABILITIES || { owner:{delete:true}, manager:{delete:true}, cashier:{delete:false} };
  function requireCapability(action){ const role=getRole(); const caps=window.ROLE_CAPABILITIES[role]||{}; if (!caps[action]) { try { showToast && showToast('Not permitted','error'); } catch {} return false; } return true; }
  window.requireCapability = requireCapability;
  function canUpsertTable(table){
    const role=getRole();
    if (role==='owner') return true;
    if (role==='manager'){
      const denied=['assets','maintenance','transaction_floats','settings'];
      return denied.indexOf(table)===-1;
    }
    if (role==='cashier'){
      const allowed=[
        'sales','expenses','income','customers','transactions','receipts','unpaid_entries','notes',
        'inventory','inventory_purchases','inventory_purchase_periods'
      ];
      return allowed.indexOf(table)!==-1;
    }
    return true;
  }
  window.canUpsertTable = canUpsertTable;
  function getCurrencySymbol(){ return state.currencySymbol || 'Tsh'; }
  window.getCurrencySymbol = getCurrencySymbol;
  function setCurrency(code, symbol){ state.currencyCode=String(code||'').toUpperCase()||'TZS'; state.currencySymbol=symbol||'Tsh'; try { saveData && saveData(); } catch {} if (window.syncEnabled && window.currentUser) { try { upsertOne('settings',{ currency_code: state.currencyCode, currency_symbol: state.currencySymbol }); } catch {} } try { render && render(); } catch {} }
  window.setCurrency = setCurrency;
  function applyCurrencySymbols(){ const s=getCurrencySymbol(); const root=document.getElementById('app'); if (!root || !s) return; const walker=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null); const nodes=[]; while (walker.nextNode()) nodes.push(walker.currentNode); nodes.forEach(n=>{ if (!n.nodeValue) return; if (n.nodeValue.includes('Tsh')) n.nodeValue=n.nodeValue.replace(/Tsh/g,s); }); }
  window.applyCurrencySymbols = applyCurrencySymbols;
  function applyRoleGatingToUI(){ const role=getRole(); const caps=window.ROLE_CAPABILITIES[role]||{}; if (!caps.delete){ const buttons=Array.from(document.querySelectorAll('button')); buttons.forEach(btn=>{ const text=(btn.textContent||'').toLowerCase(); const on=(btn.getAttribute('onclick')||'').toLowerCase(); if (text.includes('delete') || on.includes('delete')){ btn.disabled=true; btn.style.opacity='0.5'; btn.style.cursor='not-allowed'; } }); } }
  window.applyRoleGatingToUI = applyRoleGatingToUI;
  try { window.addEventListener('error', function(e){ reportClientError('error', e.message, (e.filename ? (e.filename + ':' + e.lineno) : ''), (e.error && e.error.stack) ? e.error.stack : ''); }); window.addEventListener('unhandledrejection', function(e){ const r=e.reason; const msg=(r&&r.message)?r.message:String(r); const st=(r&&r.stack)?r.stack:''; reportClientError('unhandledrejection', msg, '', st); }); } catch {}

  async function hashPin(pin){ const enc=new TextEncoder(); const uid=(window.currentUser && window.currentUser.id) || getLocalOwnerUid() || ''; const data=enc.encode(String(pin||'')+'|'+uid); const digest=await crypto.subtle.digest('SHA-256', data); const hex=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join(''); return hex; }
  async function setSecurityPin(pin){
    if (!pin || !/^\d{4}$/.test(String(pin||''))) { try { showToast && showToast('Enter 4 digits','error'); } catch {} return false; }
    const h=await hashPin(pin);
    try { await upsertOne('settings',{ pin_hash:h }); } catch {}
    try { state.securityPinHash=h; state.securityPinUpdatedAt=new Date().toISOString(); saveData && saveData(); } catch {}
    try { showToast && showToast('PIN saved','success'); } catch {}
    return true;
  }
  function openModalById(id){
    const el=document.getElementById(id);
    if (!el) return;
    try { el.classList.add('show'); el.style.display=''; } catch {}
    try { __updateModalOverflow && __updateModalOverflow(); } catch {}
  }
  function closeModalById(id){
    const el=document.getElementById(id);
    if (!el) return;
    try { el.classList.remove('show'); el.style.display='none'; } catch {}
    try { __updateModalOverflow && __updateModalOverflow(); } catch {}
  }
  window.openModalById = openModalById;
  window.closeModalById = closeModalById;
  function closeAllModals(){
    try {
      const modals = Array.from(document.querySelectorAll('.modal'));
      modals.forEach(function(m){
        try { m.classList.remove('show'); } catch {}
        try { m.style.display = 'none'; } catch {}
      });
      try { __updateModalOverflow && __updateModalOverflow(); } catch {}
    } catch {}
  }
  window.closeAllModals = closeAllModals;
  function openPinSetModal(){
    try { resetPinSetModalFields(); } catch {}
    openModalById('pinSetModal');
    try {
      const grp=document.getElementById('pinSetCurrentGroup');
      const input0=document.getElementById('pinSetInputCurrent');
      const input=document.getElementById('pinSetInput');
      const hasPin=!!state.securityPinHash;
      if (grp) grp.style.display = hasPin ? '' : 'none';
      if (input0) {
        input0.value='';
        input0.type='password';
        input0.disabled = !hasPin;
      }
      const t0=document.getElementById('pinSetToggleCurrent');
      if (t0) t0.style.display = 'none';
      if (input0 && hasPin) { input0.focus(); }
      else if (input) { input.focus(); }
    } catch {}
  }
  window.openPinSetModal = openPinSetModal;
  function promptForPin(){
    return new Promise(resolve=>{
      const modal=document.getElementById('pinEntryModal'); const input=document.getElementById('pinEntryInput'); const btn=document.getElementById('pinEntryConfirm'); const cancelBtn=document.getElementById('pinEntryCancel');
      if (modal && input && btn){
        openModalById('pinEntryModal'); input.value=''; input.focus();
        let handlerFired = false;
        let closeModalHandler = null;
        const handler=async function(){ 
          if (handlerFired) return;
          handlerFired = true;
          const raw=String(input.value||''); 
          const val=raw.replace(/[^0-9]/g,'').slice(0,4); 
          btn.removeEventListener('click', handler); 
          if (cancelBtn) cancelBtn.removeEventListener('click', closeHandler);
          if (closeModalHandler) modal.removeEventListener('click', closeModalHandler);
          closeModalById('pinEntryModal'); 
          resolve(val); 
        };
        const closeHandler = function() {
          if (handlerFired) return;
          handlerFired = true;
          btn.removeEventListener('click', handler);
          if (cancelBtn) cancelBtn.removeEventListener('click', closeHandler);
          if (closeModalHandler) modal.removeEventListener('click', closeModalHandler);
          closeModalById('pinEntryModal');
          resolve('');
        };
        btn.addEventListener('click', handler);
        if (cancelBtn) cancelBtn.addEventListener('click', closeHandler);
        closeModalHandler = function(e) {
          if (e.target === modal || e.target.classList.contains('modal-close')) {
            modal.removeEventListener('click', closeModalHandler);
            closeHandler();
          }
        };
        modal.addEventListener('click', closeModalHandler);
      } else {
        const v=(window.prompt('Enter 4-digit PIN')||'').replace(/[^0-9]/g,'').slice(0,4);
        resolve(v);
      }
    });
  }
  function promptToSetPin(){
    return new Promise(resolve=>{
      const modal=document.getElementById('pinSetModal'); const input0=document.getElementById('pinSetInputCurrent'); const input=document.getElementById('pinSetInput'); const input2=document.getElementById('pinSetInputConfirm'); const confirmBtn=document.getElementById('pinSetConfirm'); const cancelBtn=document.getElementById('pinSetCancel');
      if (modal && input && input2 && confirmBtn){
        const hasPin=!!state.securityPinHash;
        const grp=document.getElementById('pinSetCurrentGroup');
        if (grp) grp.style.display = hasPin ? '' : 'none';
        if (input0) input0.disabled = !hasPin;
        openModalById('pinSetModal'); if (input0) input0.value=''; input.value=''; input2.value=''; if (input0 && hasPin) { input0.focus(); } else { input.focus(); }
        let handlerFired = false;
        let closeModalHandler = null;
        const handler=async function(){
          if (handlerFired) return;
          const existing=state.securityPinHash||null;
          const v0=String(input0 && input0.value || '').trim();
          const v1=String(input.value||'').replace(/[^0-9]/g,'').slice(0,4);
          const v2=String(input2.value||'').replace(/[^0-9]/g,'').slice(0,4);
          if (existing){
            if (!v0){ showToast && showToast('Enter your main password','error'); return; }
            if (!supabase || !window.currentUser){ showToast && showToast('Sign in to verify password','error'); return; }
            const { error } = await supabase.auth.signInWithPassword({ email: String(window.currentUser && window.currentUser.email || ''), password: v0 });
            if (error){ showToast && showToast('Invalid password','error'); return; }
          }
          if (!/^\d{4}$/.test(v1) || !/^\d{4}$/.test(v2)){ showToast && showToast('Enter 4 digits','error'); return; }
          if (v1!==v2){ showToast && showToast('Pins do not match','error'); return; }
          handlerFired = true;
          confirmBtn.removeEventListener('click', handler);
          if (cancelBtn) cancelBtn.removeEventListener('click', closeHandler);
          if (closeModalHandler) modal.removeEventListener('click', closeModalHandler);
          closeModalById('pinSetModal');
          resetPinSetModalFields();
          resolve(v1);
        };
        const closeHandler = function() {
          if (handlerFired) return;
          handlerFired = true;
          confirmBtn.removeEventListener('click', handler);
          if (cancelBtn) cancelBtn.removeEventListener('click', closeHandler);
          if (closeModalHandler) modal.removeEventListener('click', closeModalHandler);
          closeModalById('pinSetModal');
          resetPinSetModalFields();
          resolve('');
        };
        confirmBtn.addEventListener('click', handler);
        if (cancelBtn) cancelBtn.addEventListener('click', closeHandler);
        closeModalHandler = function(e) {
          if (e.target === modal || e.target.classList.contains('modal-close')) {
            modal.removeEventListener('click', closeModalHandler);
            closeHandler();
          }
        };
        modal.addEventListener('click', closeModalHandler);
      } else {
        const v=(window.prompt('Create 4-digit PIN')||'').replace(/[^0-9]/g,'').slice(0,4);
        resolve(v);
      }
    });
  }
  function resetPinSetModalFields(){
    try {
      const grp=document.getElementById('pinSetCurrentGroup');
      const input0=document.getElementById('pinSetInputCurrent');
      const input=document.getElementById('pinSetInput');
      const input2=document.getElementById('pinSetInputConfirm');
      const t0=document.getElementById('pinSetToggleCurrent');
      const t1=document.getElementById('pinSetToggle');
      const t2=document.getElementById('pinSetToggleConfirm');
      const hasPin=!!state.securityPinHash;
      if (grp) grp.style.display = hasPin ? '' : 'none';
      if (input0) { input0.value=''; input0.type='password'; }
      if (input0) input0.disabled = !hasPin;
      if (input) { input.value=''; input.type='password'; }
      if (input2) { input2.value=''; input2.type='password'; }
      if (t0) t0.style.display='none';
      if (t1) t1.style.display='none';
      if (t2) t2.style.display='none';
    } catch {}
  }
  async function requirePinForDestructive(reason){
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
  window.hashPin = hashPin;
  window.setSecurityPin = setSecurityPin;
  window.requirePinForDestructive = requirePinForDestructive;
  window.requestPinChangeEmail = async function(){ try { if (!supabase || !window.currentUser) return; const email=(window.currentUser && window.currentUser.email)||null; if (!email){ showToast && showToast('No email','error'); return; } const url=(window.APP_BASE_URL||window.location.origin||'').replace(/\/+$/,'')+'/?change-pin=1'; const { error } = await supabase.auth.signInWithOtp({ email, options:{ shouldCreateUser:false, emailRedirectTo:url } }); if (error){ showToast && showToast('Email send failed','error'); return; } showToast && showToast('Check email for confirmation link','success'); } catch(e){ showToast && showToast('Email send failed','error'); } };
  window.savePinFromModal = async function(){
    try {
      const input0=document.getElementById('pinSetInputCurrent'); const input=document.getElementById('pinSetInput'); const input2=document.getElementById('pinSetInputConfirm');
      const existing=state.securityPinHash||null;
      const v0=String(input0 && input0.value || '').trim();
      const v1=String(input && input.value || '').replace(/[^0-9]/g,'').slice(0,4);
      const v2=String(input2 && input2.value || '').replace(/[^0-9]/g,'').slice(0,4);
      if (existing){
        if (!v0){ showToast && showToast('Enter your main password','error'); return; }
        if (!supabase || !window.currentUser){ showToast && showToast('Sign in to verify password','error'); return; }
        const { error } = await supabase.auth.signInWithPassword({ email: String(window.currentUser && window.currentUser.email || ''), password: v0 });
        if (error){ showToast && showToast('Invalid password','error'); return; }
      }
      if (!/^\d{4}$/.test(v1) || !/^\d{4}$/.test(v2)){ showToast && showToast('Enter 4 digits','error'); return; }
      if (v1!==v2){ showToast && showToast('Pins do not match','error'); return; }
      const ok = await setSecurityPin(v1);
      if (ok){ closeModalById('pinSetModal'); resetPinSetModalFields(); }
      else { showToast && showToast('PIN save failed','error'); }
    } catch(e){ showToast && showToast('PIN save failed','error'); }
  };
  (function(){ try { const params=new URLSearchParams(window.location.search||''); const cp=params.get('change-pin'); if (cp==='1'){ window.__pinStandaloneMode = true; setTimeout(()=>{ try { openPinSetModal(); } catch {} }, 300); } } catch {} })();


  const DELETE_QUEUE_KEY='tuba-delete-queue-v1';
  window.deleteQueue = {
    load(){ try { const raw=localStorage.getItem(DELETE_QUEUE_KEY); this.items=raw?JSON.parse(raw):[]; } catch { this.items=[]; } },
    save(){ try { localStorage.setItem(DELETE_QUEUE_KEY, JSON.stringify(this.items)); } catch {} },
    enqueue(table,keySource){ const owner=(window.currentUser && window.currentUser.id) || getLocalOwnerUid() || null; this.items.push({ id:`${table}-del-${Date.now()}-${Math.random().toString(36).slice(2)}`, table, keySource, owner_uid: owner, attempts:0, nextTryAt:Date.now()+1000 }); this.save(); },
    backoffDelay(attempts){ const schedule=[1000,2000,5000,10000,30000,60000]; return schedule[Math.min(attempts, schedule.length - 1)]; },
    buildDeleteKeys(table,src){
      const k={};
      switch(table){
        case 'sales': k.timestamp=src.timestamp; break;
        case 'expenses': if (src.id!=null) k.id=src.id; else k.timestamp=src.timestamp; break;
        case 'notes': case 'transactions': case 'receipts': case 'unpaid_entries': case 'assets': case 'maintenance': k.timestamp=src.timestamp; break;
        case 'invoices': k.number=src.number; break;
        case 'customers': k.name=src.name; k.email=src.email||''; break;
        case 'products': k.name=src.name; k.category=src.category||''; break;
        case 'categories': k.name=typeof src==='string'?src:(src.name||src); break;
        case 'inventory': k.product_name = src.product_name || src.name; break;
        case 'inventory_purchases': k.timestamp=src.timestamp; break;
        case 'inventory_purchase_periods': k.period_number=src.period_number||src.cycleNumber||src.number; break;
        default: if (src.timestamp) k.timestamp=src.timestamp; break;
      }
      return k;
    },
    async process(){
      if (!navigator.onLine || !window.syncEnabled || !window.currentUser) return;
      if (!Array.isArray(this.items) || this.items.length===0) return;
      const now=Date.now();
      for (const item of [...this.items]){
        if (item.nextTryAt && item.nextTryAt>now) continue;
        let started=false;
        try {
          if ((item.owner_uid||'') !== (window.currentUser && window.currentUser.id || '')) { try { this.items=this.items.filter(q=>q.id!==item.id); this.save(); } catch {} try { handleOwnerMismatch && handleOwnerMismatch(window.currentUser.id); } catch {} continue; }
          if (!requireCapability('delete')) continue;
          if (!window.isPaid && item.table !== 'user_profiles' && item.table !== 'tithing') continue;
          started=true; cloudSyncStart();
          const keys=this.buildDeleteKeys(item.table, item.keySource);
          const payload={ ...keys, deleted: true, user_id: window.currentUser.id };
          const conflict=window.conflictTargets && window.conflictTargets[item.table];
          const { error } = conflict
            ? await supabase.from(item.table).upsert(payload, { onConflict: conflict })
            : await supabase.from(item.table).upsert(payload);
          if (error) throw error;
          this.items=this.items.filter(q=>q.id!==item.id);
          this.save();
          auditLog('delete', item.table, item.keySource, null);
        } catch(err){
          item.attempts=(item.attempts||0)+1;
          item.nextTryAt=Date.now()+this.backoffDelay(item.attempts);
          this.save();
        } finally {
          if (started) cloudSyncEnd();
        }
      }
    }
  };
  deleteQueue.load(); setInterval(()=>{ try { deleteQueue.process(); } catch {} }, 30000); window.addEventListener('online', ()=>{ try { deleteQueue.process(); } catch {} });

  function getTodayStr(){ try { return (typeof getTodayDateString==='function')?getTodayDateString():new Date().toISOString().slice(0,10); } catch { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; } }
  function getDeletePart(){ const h=(new Date()).getHours(); if (h>=7 && h<12) return 'morning'; if (h>=12 && h<18) return 'afternoon'; return 'evening'; }
  function getDeleteReminderKey(){ return `tuba-del-reminder-count-${getTodayStr()}-${getDeletePart()}`; }
  function canSendDeleteReminder(){ try { const k=getDeleteReminderKey(); const c=parseInt(localStorage.getItem(k)||'0',10)||0; return c<2; } catch { return true; } }
  function markDeleteReminderSent(){ try { const k=getDeleteReminderKey(); const c=parseInt(localStorage.getItem(k)||'0',10)||0; localStorage.setItem(k, String(c+1)); } catch {} }
  function maybeSendDeleteReminder(){ try { if (window.getNotificationsPref && !window.getNotificationsPref()) return; if (!canSendDeleteReminder()) return; if (window.sendNotification) { window.sendNotification('Backup Reminder', 'Consider exporting your data (Tools → Save offline)'); markDeleteReminderSent(); } } catch {} }

  window.__tubaCloudSync = window.__tubaCloudSync || { inFlight: 0, endTimer: null };
  function cloudSyncStart(){ try { if (!window.syncEnabled || !window.currentUser) return; window.__tubaCloudSync.inFlight = (window.__tubaCloudSync.inFlight || 0) + 1; if (window.__tubaCloudSync.endTimer) { try { clearTimeout(window.__tubaCloudSync.endTimer); } catch {} window.__tubaCloudSync.endTimer = null; } try { updateSyncIndicator && updateSyncIndicator('syncing'); } catch {} } catch {} }
  function cloudSyncEnd(){ try { if (!window.syncEnabled || !window.currentUser) return; window.__tubaCloudSync.inFlight = Math.max(0, (window.__tubaCloudSync.inFlight || 0) - 1); if ((window.__tubaCloudSync.inFlight || 0) === 0) { window.__tubaCloudSync.endTimer = setTimeout(()=>{ try { if (window.syncEnabled && window.currentUser) { updateSyncIndicator && updateSyncIndicator('synced'); } } catch {} }, 350); } } catch {} }

  async function persistLocalTombstone(table, keySource){
    try {
      if (!window.tubaDB) return;
      const keys = deleteQueue.buildDeleteKeys(table, keySource || {});
      const payload = { ...keys, deleted: true, last_updated: Date.now() };
      await window.tubaDB.put(table, payload);
    } catch {}
  }

  function markLocalItemDeleted(table, keySource){
    try {
      switch(table){
        case 'sales':
        case 'expenses':
        case 'income':
        case 'transactions':
        case 'notes':
        case 'assets':
        case 'maintenance':
        case 'receipts':
        case 'loans': {
          var ts=(keySource && (keySource.timestamp||keySource.id))||null;
          var key = (table==='receipts')?'receipts':(table==='assets')?'assets':(table==='maintenance')?'maintenance':(table==='notes')?'notes':(table==='transactions')?'transactions':(table==='income')?'income':(table==='expenses')?'expenses':(table==='loans')?'loans':'sales';
          var arr = Array.isArray(state[key]) ? state[key].map(x => {
            if ((x && (x.timestamp||x.id)) === ts) { return { ...x, deleted: true, last_updated: Date.now() }; }
            return x;
          }) : [];
          state[key] = arr.filter(x => !(x && x.deleted === true));
          break;
        }
        case 'unpaid_entries': {
          var tsu=(keySource && keySource.timestamp)||null;
          if (tsu!=null && Array.isArray(state.unpaidEntries)){
            state.unpaidEntries = state.unpaidEntries.filter(x => (x && x.timestamp) !== tsu);
          }
          break;
        }
        case 'invoices': {
          var num=(keySource && keySource.number)||null;
          if (num!=null && Array.isArray(state.invoices)){
            state.invoices = state.invoices.filter(x => (x && x.number) !== num);
          }
          break;
        }
        case 'customers': {
          var nm=(keySource && keySource.name)||null;
          var em=(keySource && (keySource.email||''))||'';
          if (Array.isArray(state.customers)){
            state.customers = state.customers.filter(x => (x && x.name) !== nm || String(x.email||'') !== String(em||''));
          }
          break;
        }
        case 'products': {
          var pn=(keySource && keySource.name)||null;
          var pc=String((keySource && keySource.category)||'');
          if (Array.isArray(state.products)){
            state.products = state.products.filter(x => (x && x.name) !== pn || String(x.category||'') !== pc);
          }
          if (pn && state.inventory && state.inventory[pn]) { delete state.inventory[pn]; }
          break;
        }
        case 'categories': {
          var cn=typeof keySource==='string'?keySource:(keySource && keySource.name);
          if (Array.isArray(state.categories)){
            state.categories = state.categories.filter(x => x !== cn);
          }
          if (state.categoryKinds && cn){ delete state.categoryKinds[cn]; }
          break;
        }
        case 'inventory': {
          var ipn=(keySource && (keySource.product_name||keySource.name))||null;
          if (ipn && state.inventory && state.inventory[ipn]) { delete state.inventory[ipn]; }
          break;
        }
        case 'inventory_purchases': {
          var tsip=(keySource && keySource.timestamp)||null;
          if (tsip!=null && Array.isArray(state.inventoryPurchases)){
            state.inventoryPurchases = state.inventoryPurchases.filter(x => (x && x.timestamp) !== tsip);
          }
          break;
        }
        case 'inventory_purchase_periods': {
          var pnum=(keySource && (keySource.period_number||keySource.number))||null;
          if (pnum!=null && Array.isArray(state.inventoryPurchaseCycles)){
            state.inventoryPurchaseCycles = state.inventoryPurchaseCycles.filter(x => (x && x.number) !== pnum);
          }
          break;
        }
        case 'tags': {
          var tag=(keySource && (keySource.tag_name||keySource.name))||null;
          if (tag){
            var nm=String(tag).toLowerCase();
            if (Array.isArray(state.tags)){ state.tags = state.tags.filter(t => t !== nm); }
            if (state.tagColors && state.tagColors[nm]) delete state.tagColors[nm];
          }
          break;
        }
        case 'tithing': {
          var mk=(keySource && keySource.month_key)||null;
          if (mk && state.tithingRecords){ delete state.tithingRecords[mk]; }
          break;
        }
        default:
          break;
      }
      try { saveData && saveData(); } catch {}
      try { render && render(); } catch {}
    } catch {}
  }
  async function deleteOne(table, keySource){
    if (!window.syncEnabled || !window.currentUser){
      try { deleteQueue.enqueue(table,keySource); } catch {}
      try { markLocalItemDeleted(table, keySource); } catch {}
      try { await persistLocalTombstone(table, keySource); } catch {}
      try { maybeSendDeleteReminder(); } catch {}
      return;
    }
    if (!requireCapability('delete')) return;
    if (!window.isPaid && table !== 'user_profiles' && table !== 'tithing'){ try { showToast && showToast('Activate account to sync','error'); } catch {} return; }
    try {
      cloudSyncStart();
      const keys=deleteQueue.buildDeleteKeys(table, keySource);
      const payload={ ...keys, deleted: true, user_id: window.currentUser.id };
      const conflict=window.conflictTargets && window.conflictTargets[table];
      const { error } = conflict
        ? await supabase.from(table).upsert(payload, { onConflict: conflict })
        : await supabase.from(table).upsert(payload);
      if (error) throw error;
      try { markLocalItemDeleted(table, keySource); } catch {}
      try { await persistLocalTombstone(table, keySource); } catch {}
      auditLog('delete', table, keySource, null);
      try { showToast && showToast('Item deleted successfully','success'); } catch {}
      try { maybeSendDeleteReminder(); } catch {}
    } catch(error){
      console.error(`Delete error on ${table}:`, error);
      try { showToast && showToast('Cloud delete failed, will retry in background','info'); } catch {}
      try { deleteQueue.enqueue(table, keySource); } catch {}
      try { markLocalItemDeleted(table, keySource); } catch {}
      try { maybeSendDeleteReminder(); } catch {}
    } finally {
      cloudSyncEnd();
    }
  }
  window.deleteOne = deleteOne;
  function removeLocalStateItem(table, keySource){
    try {
      switch(table){
        case 'sales':
        case 'expenses':
        case 'income':
        case 'transactions':
        case 'notes':
        case 'assets':
        case 'maintenance':
        case 'receipts':
        case 'loans': {
          var ts=(keySource && (keySource.timestamp||keySource.id))||null;
          if (ts!=null){
            var key = (table==='receipts')?'receipts':(table==='assets')?'assets':(table==='maintenance')?'maintenance':(table==='notes')?'notes':(table==='transactions')?'transactions':(table==='income')?'income':(table==='expenses')?'expenses':(table==='loans')?'loans':'sales';
            var arr = Array.isArray(state[key]) ? state[key].filter(x => (x && (x.timestamp||x.id)) !== ts) : [];
            state[key] = arr;
          }
          break;
        }
        case 'unpaid_entries': {
          var tsu=(keySource && keySource.timestamp)||null;
          if (tsu!=null && Array.isArray(state.unpaidEntries)){
            state.unpaidEntries = state.unpaidEntries.filter(x => (x && x.timestamp) !== tsu);
          }
          break;
        }
        case 'invoices': {
          var num=(keySource && keySource.number)||null;
          if (num!=null && Array.isArray(state.invoices)){
            state.invoices = state.invoices.filter(x => (x && x.number) !== num);
          }
          break;
        }
        case 'customers': {
          var nm=(keySource && keySource.name)||null;
          var em=(keySource && (keySource.email||''))||'';
          if (Array.isArray(state.customers)){
            state.customers = state.customers.filter(x => (x && x.name) !== nm || String(x.email||'') !== String(em||''));
          }
          break;
        }
        case 'products': {
          var pn=(keySource && keySource.name)||null;
          var pc=String((keySource && keySource.category)||'');
          if (Array.isArray(state.products)){
            state.products = state.products.filter(x => (x && x.name) !== pn || String(x.category||'') !== pc);
          }
          if (pn && state.inventory && state.inventory[pn]) { delete state.inventory[pn]; }
          break;
        }
        case 'categories': {
          var cn=typeof keySource==='string'?keySource:(keySource && keySource.name);
          if (Array.isArray(state.categories)){
            state.categories = state.categories.filter(x => x !== cn);
          }
          if (state.categoryKinds && cn){ delete state.categoryKinds[cn]; }
          break;
        }
        case 'inventory': {
          var ipn=(keySource && (keySource.product_name||keySource.name))||null;
          if (ipn && state.inventory && state.inventory[ipn]) { delete state.inventory[ipn]; }
          break;
        }
        case 'inventory_purchases': {
          var tsip=(keySource && keySource.timestamp)||null;
          if (tsip!=null && Array.isArray(state.inventoryPurchases)){
            state.inventoryPurchases = state.inventoryPurchases.filter(x => (x && x.timestamp) !== tsip);
          }
          break;
        }
        case 'inventory_purchase_periods': {
          var pnum=(keySource && (keySource.period_number||keySource.number))||null;
          if (pnum!=null && Array.isArray(state.inventoryPurchaseCycles)){
            state.inventoryPurchaseCycles = state.inventoryPurchaseCycles.filter(x => (x && x.number) !== pnum);
          }
          break;
        }
        case 'tags': {
          var tag=(keySource && (keySource.tag_name||keySource.name))||null;
          if (tag){
            var nm=String(tag).toLowerCase();
            if (Array.isArray(state.tags)){ state.tags = state.tags.filter(t => t !== nm); }
            if (state.tagColors && state.tagColors[nm]) delete state.tagColors[nm];
          }
          break;
        }
        case 'tithing': {
          var mk=(keySource && keySource.month_key)||null;
          if (mk && state.tithingRecords){ delete state.tithingRecords[mk]; }
          break;
        }
        default:
          break;
      }
      try { saveData && saveData(); } catch {}
      try { render && render(); } catch {}
    } catch {}
  }

  const UPSERT_QUEUE_KEY='tuba-upsert-queue-v1';
  window.upsertQueue = {
    items:[],
    load(){ try { const raw=localStorage.getItem(UPSERT_QUEUE_KEY); this.items=raw?JSON.parse(raw):[]; } catch { this.items=[]; } },
    save(){ try { localStorage.setItem(UPSERT_QUEUE_KEY, JSON.stringify(this.items)); } catch {} },
    enqueue(table,payload){
      const conflict=window.conflictTargets[table]||null;
      const owner=(window.currentUser && window.currentUser.id) || getLocalOwnerUid() || null;
      this.items.push({ id:`${table}-${Date.now()}-${Math.random().toString(36).slice(2)}`, table, payload, conflict, owner_uid: owner, attempts:0, nextTryAt:Date.now()+1000 });
      this.save();
    },
    backoffDelay(attempts){ const schedule=[1000,2000,5000,10000,30000,60000]; return schedule[Math.min(attempts, schedule.length - 1)]; },
    async process(){
      if (!navigator.onLine || !window.syncEnabled || !window.currentUser) return;
      if (!Array.isArray(this.items) || this.items.length===0) return;
      const now=Date.now();
      for (const item of [...this.items]){
        if (item.nextTryAt && item.nextTryAt>now) continue;
        let started=false;
        try {
          if ((item.owner_uid||'') !== (window.currentUser && window.currentUser.id || '')) {
            try { this.items=this.items.filter(q=>q.id!==item.id); this.save(); } catch {}
            try { handleOwnerMismatch && handleOwnerMismatch(window.currentUser.id); } catch {}
            continue;
          }
          if (!window.isPaid && item.table !== 'user_profiles' && item.table !== 'tithing') continue;
          if (!canUpsertTable(item.table)) continue;
          const data={ ...item.payload, user_id: window.currentUser.id };
          if (item.table==='products'){ data.category = data.category || ''; }
          started=true; cloudSyncStart();
          if (item.conflict){
            const { error } = await supabase.from(item.table).upsert(data, { onConflict: item.conflict });
            if (error) throw error;
          } else {
            const { error } = await supabase.from(item.table).upsert(data);
            if (error) throw error;
          }
          this.items=this.items.filter(q=>q.id!==item.id);
          this.save();
          auditLog('upsert', item.table, item.payload, data);
        } catch(err){
          item.attempts=(item.attempts||0)+1;
          item.nextTryAt=Date.now()+this.backoffDelay(item.attempts);
          this.save();
        } finally {
          if (started) cloudSyncEnd();
        }
      }
    }
  };
  upsertQueue.load(); setInterval(()=>{ try { upsertQueue.process(); } catch {} }, 30000); window.addEventListener('online', ()=>{ try { upsertQueue.process(); } catch {} });

  async function upsertOne(table, payload, skipPin){
    if (!window.syncEnabled || !window.currentUser){ try { upsertQueue.enqueue(table, payload); } catch {} return; }
    if (!window.isPaid && table !== 'user_profiles' && table !== 'tithing'){ try { showToast && showToast('Activate account to sync','error'); } catch {} return; }
    if (!canUpsertTable(table)){ try { showToast && showToast('Not permitted','error'); } catch {} return; }
    const pinSkip = !!skipPin || !!window.__pinInternalWrite;
    if (!pinSkip && table==='user_profiles'){
      const ok=await requirePinForDestructive('profile'); if (!ok) return;
    } else if (!pinSkip && table==='settings'){
      const settingIsPinUpdate = !!(payload && typeof payload.pin_hash === 'string');
      const skipGate = settingIsPinUpdate || (window.__pinStandaloneMode === true) || !state.securityPinHash;
      if (!skipGate){ const ok=await requirePinForDestructive('settings'); if (!ok) return; }
    } else if (!pinSkip && table==='transaction_floats'){
      const ok=await requirePinForDestructive('floats'); if (!ok) return;
    }
    try {
      cloudSyncStart();
      const data={ ...payload, user_id: window.currentUser.id };
      if (table==='products'){ data.category=data.category || ''; }
      const conflict=window.conflictTargets[table];
      if (conflict){
        const { error } = await supabase.from(table).upsert(data, { onConflict: conflict });
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).upsert(data);
        if (error) throw error;
      }
      auditLog('upsert', table, payload, data);
      try { syncInBackground && syncInBackground(); } catch {}
    } catch(error){
      console.error(`Upsert error on ${table}:`, error);
      try { upsertQueue.enqueue(table, payload); } catch {}
    } finally { cloudSyncEnd(); }
  }
  window.upsertOne = upsertOne;

  // ================================
  // Stats and cloud sync
  // ================================
  window.cachedStats = window.cachedStats || null;
  window.lastStatsUpdate = window.lastStatsUpdate || 0;
  window.getStats = function(){
    const currentTime = Date.now();
    if (window.cachedStats && (currentTime - window.lastStatsUpdate) < 3000) { return window.cachedStats; }
    const paidSales = (state.sales || []).filter(s => s.status !== 'unpaid');
    const totalCapital = (state.capital_history || []).reduce((sum, item) => sum + (Number(item.amount || 0)), 0);
    const incomeAsCapital = (state.income || []).filter(i => i && (i.asCapital === true || i.as_capital === true)).reduce((sum, i) => sum + (Number(i.amount || 0)), 0);
    const totalProfit = paidSales.reduce((sum, s) => sum + (s.profit || 0), 0);
    const totalRevenue = paidSales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
    const allSalesRevenue = (state.sales || []).reduce((sum, s) => sum + (s.totalPrice || 0), 0);
    const totalExpenses = (state.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const expensesForCapital = (state.expenses || []).filter(e => {
      const c = String(e.category || '').toLowerCase();
      return c !== 'loan given' && c !== 'maintenance' && c !== 'asset purchase';
    }).reduce((sum, e) => sum + (e.amount || 0), 0);
    const today = (typeof getTodayDateString === 'function') ? getTodayDateString() : (new Date().toISOString().slice(0,10));
    const todaySales = paidSales.filter(s => s.date === today);
    const todaySalesProfit = todaySales.reduce((sum, s) => sum + (s.profit || 0), 0);
    const todayRevenue = todaySales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
    const todayCapital = todaySales.reduce((sum, s) => sum + (s.totalCost || 0), 0);
    const todayExpenses = (state.expenses || []).filter(e => String(e.date||'').slice(0,10) === today).reduce((sum, e) => sum + (e.amount || 0), 0);
    const todayIncomeAmt = (state.income || []).filter(i => String(i.date||'').slice(0,10) === today).reduce((sum, i) => sum + (i.amount || 0), 0);
    const todayProfit = todaySalesProfit + todayIncomeAmt - todayExpenses;
    const yd = new Date(Date.now() - 86400000);
    const yesterday = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;
    const yesterdaySalesProfit = paidSales.filter(s => s.date === yesterday).reduce((sum, s) => sum + (s.profit || 0), 0);
    const yesterdayExpenses = (state.expenses || []).filter(e => e.date === yesterday).reduce((sum, e) => sum + (e.amount || 0), 0);
    const yesterdayIncomeAmt = (state.income || []).filter(i => i.date === yesterday).reduce((sum, i) => sum + (i.amount || 0), 0);
    const yesterdayProfit = yesterdaySalesProfit + yesterdayIncomeAmt - yesterdayExpenses;
    const now = new Date(); const monthStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStart = `${monthStartDate.getFullYear()}-${String(monthStartDate.getMonth() + 1).padStart(2, '0')}-${String(monthStartDate.getDate()).padStart(2, '0')}`;
    const monthSales = paidSales.filter(s => new Date(s.date) >= new Date(monthStart));
    const monthSalesProfit = monthSales.reduce((sum, s) => sum + (s.profit || 0), 0);
    const monthRevenue = monthSales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
    const monthExpenses = (state.expenses || []).filter(e => new Date(e.date) >= new Date(monthStart)).reduce((sum, e) => sum + (e.amount || 0), 0);
    const monthIncome = (state.income || []).filter(i => new Date(i.date) >= new Date(monthStart)).reduce((sum, i) => sum + (i.amount || 0), 0);
    const monthProfit = monthSalesProfit + monthIncome - monthExpenses;
    const totalIncome = (state.income || []).reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalInvoiced = (state.invoices || []).reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalPaid = (state.invoices || []).filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const netProfit = (totalProfit + totalIncome - totalExpenses);
    const inventorySpendTotal = (state.inventoryPurchases || []).reduce((sum, p) => sum + (p.planned ? 0 : (Number(p.totalCost) || Number(p.buyingPrice) || 0)), 0);
    const prodCostMap = {}; (state.products || []).forEach(p => { prodCostMap[p.name] = Number(p.cost) || 0; });
    const inventoryStockValue = Object.entries(state.inventory || {}).reduce((sum, [name, inv]) => sum + ((Number(inv.stock) || 0) * (prodCostMap[name] || 0)), 0);
    const cashFromSales = (state.sales || []).reduce((sum, sale) => sum + ((sale && sale.status === 'unpaid') ? 0 : (Number(sale.totalPrice || 0))), 0);
    const loanInBusiness = (state.loans || []).filter(l => String(l && l.type || '').toLowerCase() === 'taken').reduce((sum, l) => sum + (Number(l && l.amount || 0)), 0);
    const loanOutBusiness = (state.loans || []).filter(l => String(l && l.type || '').toLowerCase() === 'given' && String((l && (l.moneySource || l.money_source) || '')).toLowerCase() === 'business').reduce((sum, l) => sum + (Number(l && l.amount || 0)), 0);
    const maintenanceBusinessTotal = (state.maintenance || []).filter(m => String((m && (m.moneySource || m.money_source) || 'business')).toLowerCase() === 'business').reduce((sum, m) => sum + (Number(m && m.amount || 0)), 0);
    const assetsBusinessTotal = (state.assets || []).filter(a => String((a && (a.moneySource || a.money_source) || 'business')).toLowerCase() === 'business').reduce((sum, a) => sum + (Number(a && a.cost || 0)), 0);
    const availableCapital = totalIncome + loanInBusiness + cashFromSales - expensesForCapital - loanOutBusiness - inventorySpendTotal - maintenanceBusinessTotal - assetsBusinessTotal;
    const monthNetProfit = monthProfit;
    window.cachedStats = { totalCapital, incomeAsCapital, loanInBusiness, loanOutBusiness, expensesForCapital, inventorySpendTotal, maintenanceBusinessTotal, assetsBusinessTotal, totalProfit, totalRevenue, totalExpenses, monthExpenses, todayProfit, todayRevenue, todayCapital, inventoryStockValue, availableCapital, yesterdayProfit, monthProfit, monthRevenue, monthNetProfit, totalIncome, monthIncome, monthSalesProfit, totalInvoiced, totalPaid, netProfit, totalSalesCount: paidSales.length, todaySalesCount: todaySales.length };
    window.lastStatsUpdate = now; return window.cachedStats;
  };

  async function pushAllDataToSupabase(skipPin){ if (!window.syncEnabled || !window.currentUser) return; try { const uid=window.currentUser.id; const prev=getLocalOwnerUid(); if (prev && prev!==uid){ handleOwnerMismatch(uid); return; } } catch {} cloudSyncStart(); try {
      const pinSkip = !!skipPin || !!window.__pinInternalWrite;
      if (state && state.userProfile){ const p=state.userProfile||{}; const payload={ user_id: window.currentUser.id }; var ev=(p.email||((window.currentUser&&window.currentUser.email)||'')); if (p.businessName) payload.business_name=p.businessName; if (ev) payload.email=ev; if (p.phone) payload.phone=p.phone; if (p.address) payload.address=p.address; if (p.country) payload.country=p.country; if (p.city) payload.city=p.city; if (p.role) payload.role=p.role; if (p.tinNumber) payload.tin_number=p.tinNumber; if (p.blNumber) payload.business_license_number=p.blNumber; if (typeof p.hasVAT==='boolean') payload.has_vat=!!p.hasVAT; if (p.hasVAT && p.vatNumber) payload.vat_number=p.vatNumber; if (state.userLogoDataUrl) payload.logo_data=state.userLogoDataUrl; if (state.userLogoMime) payload.logo_mime=state.userLogoMime; const needPin = !!state.profileLoaded; if (needPin && !pinSkip){ const ok=await requirePinForDestructive('profile'); if (!ok) { try { showToast && showToast('Profile update cancelled','error'); } catch {} } } const { error: profErr } = await supabase.from('user_profiles').upsert(payload, { onConflict: 'user_id' }); if (profErr) console.warn('Profile upsert skipped:', profErr.message||profErr); }
      if (!window.isPaid) { return; }
      if ((state.products||[]).length>0){ const productsData=state.products.map(p=>({ user_id: window.currentUser.id, name:p.name, category:p.category||'', cost:p.cost, price:p.price, has_stock:(p.hasStock===false)?false:true, sale_unit: p.saleUnit||null, purchase_unit: p.purchaseUnit||null, units_per_purchase: p.unitsPerPurchase||null })); await supabase.from('products').upsert(productsData, { onConflict: 'user_id,name,category' }); }
      if ((state.categories||[]).length>0){
        const kindMap = state.categoryKinds || {};
        const categoriesData = state.categories.map(c => {
          let kind = kindMap[c];
          if (!kind) {
            const prods = (state.products || []).filter(p => String(p.category||'') === String(c));
            const hasProd = prods.some(p => p.hasStock !== false);
            const hasServ = prods.some(p => p.hasStock === false);
            if (hasServ && !hasProd) kind = 'service';
            else if (hasProd && !hasServ) kind = 'product';
            else if (hasProd && hasServ) kind = 'mixed';
            else kind = 'product';
          }
        return { user_id: window.currentUser.id, name: c, kind };
        });
        await supabase.from('categories').upsert(categoriesData, { onConflict: 'user_id,name' });
      }
      if (Array.isArray(state.tags) && state.tags.length > 0) {
        const tagsData = state.tags.map(tag => ({
          user_id: window.currentUser.id,
          tag_name: tag,
          color: (state.tagColors && state.tagColors[tag]) ? state.tagColors[tag] : '#999999'
        }));
        await supabase.from('tags').upsert(tagsData, { onConflict: 'user_id,tag_name' });
      }
      if ((state.sales||[]).length>0){ const salesData=state.sales.map(s=>({ user_id: window.currentUser.id, date:s.date, time:s.time, timestamp:s.timestamp, product_name:s.productName, customer:s.customer, quantity:s.quantity, cost_per_unit:s.costPerUnit, price_per_unit:s.pricePerUnit, total_cost:s.totalCost, total_price:s.totalPrice, profit:s.profit, payment:s.payment, status:s.status||'paid', category:s.category||'', has_stock:(s.hasStock===false?false:true), tags:(Array.isArray(s.tags)? s.tags.join(',') : (s.tags||null)) })); await supabase.from('sales').upsert(salesData, { onConflict: 'user_id,timestamp' }); }
      if ((state.expenses||[]).length>0){ const expensesData=state.expenses.map(e=>({ user_id: window.currentUser.id, date:e.date, time:e.time, timestamp:e.timestamp, description:e.description, category:e.category, amount:e.amount, payment:e.payment, comment:e.comment||'', tags:(Array.isArray(e.tags)? e.tags.join(',') : (e.tags||null)) })); await supabase.from('expenses').upsert(expensesData, { onConflict: 'user_id,timestamp' }); }
      if ((state.income||[]).length>0){ const incomeData=state.income.map(i=>({ user_id: window.currentUser.id, date:i.date, time:i.time, timestamp:i.timestamp, source:i.source, amount:i.amount, payment:i.payment, comment:i.comment||'', as_capital: (i.asCapital === true || i.as_capital === true), include_in_tithing: !(i.includeTithing === false || i.include_in_tithing === false) })); await supabase.from('income').upsert(incomeData, { onConflict: 'user_id,timestamp' }); }
      if ((state.notes||[]).length>0){ const notesData=state.notes.map(n=>({ user_id: window.currentUser.id, title:n.title, content:n.content, date:n.date, time:n.time, timestamp:n.timestamp, tags: (Array.isArray(n.tags)? n.tags.join(',') : (n.tags||null)) })); await supabase.from('notes').upsert(notesData, { onConflict: 'user_id,timestamp' }); }
      if ((state.customers||[]).length>0){ const customersData=state.customers.map(c=>({ user_id: window.currentUser.id, name:c.name, email:c.email||'', phone:c.phone||'', address:c.address||'', total_purchases:c.totalPurchases||0, tags:(Array.isArray(c.tags)? c.tags.join(',') : (c.tags||null)) })); await supabase.from('customers').upsert(customersData, { onConflict: 'user_id,name,email' }); }
      if ((state.invoices||[]).length>0){ const invoicesData=state.invoices.map(inv=>({ user_id: window.currentUser.id, number:inv.number, customer:inv.customer, date:inv.date, due_date:inv.dueDate, items:inv.items, amount:inv.amount, status:inv.status, subtotal:inv.subtotal, tax_rate:inv.taxRate, tax_amount:inv.taxAmount, currency_code:inv.currencyCode||state.currencyCode, currency_symbol:inv.currencySymbol||state.currencySymbol })); await supabase.from('invoices').upsert(invoicesData, { onConflict: 'user_id,number' }); }
      if ((state.receipts||[]).length>0){ const receiptsData=state.receipts.map(r=>({ user_id: window.currentUser.id, number:r.number, customer:r.customer, customer_email:r.customerEmail||r.customer_email||'', date:r.date, time:r.time, timestamp:r.timestamp, description:r.description, amount:r.amount, payment_method:r.paymentMethod||r.payment_method||'', currency_code:r.currencyCode||r.currency_code||state.currencyCode, currency_symbol:r.currencySymbol||r.currency_symbol||state.currencySymbol })); await supabase.from('receipts').upsert(receiptsData, { onConflict: 'user_id,timestamp' }); }
      if ((state.inventory||{}) && Object.keys(state.inventory).length>0){ const invRows=Object.entries(state.inventory).map(([name, inv])=>({ user_id: window.currentUser.id, product_name:name, stock:(inv.stock||0), min_alert:(inv.minAlert||5) })); await supabase.from('inventory').upsert(invRows, { onConflict: 'user_id,product_name' }); }
      if ((state.assets||[]).length>0){ const assetsData=state.assets.map(a=>({ user_id: window.currentUser.id, name:a.name, purchase_date:a.purchaseDate, time:a.time, timestamp:a.timestamp, cost:a.cost, description:a.description||'', money_source: a.moneySource || 'business' })); await supabase.from('assets').upsert(assetsData, { onConflict: 'user_id,timestamp' }); }
      if ((state.maintenance||[]).length>0){ const maintData=state.maintenance.map(m=>({ user_id: window.currentUser.id, asset_name:m.assetName, amount:m.amount, date:m.date, time:m.time, timestamp:m.timestamp, description:m.description||'', money_source: (m.moneySource || m.money_source || 'business') })); await supabase.from('maintenance').upsert(maintData, { onConflict: 'user_id,timestamp' }); }
      if ((state.transactions||[]).length>0){ const transactionsData=state.transactions.map(t=>({ user_id: window.currentUser.id, channel:t.channel, customer_name:t.customerName, type:t.type, amount:t.amount, date:t.date, time:t.time, timestamp:t.timestamp, tags:(Array.isArray(t.tags)? t.tags.join(',') : (t.tags||null)) })); await supabase.from('transactions').upsert(transactionsData, { onConflict: 'user_id,timestamp' }); }
      if ((state.unpaidEntries||[]).length>0){ const unpaidData=state.unpaidEntries.map(u=>({ user_id: window.currentUser.id, name:u.name, type:u.type, amount:u.amount, date:u.date, time:u.time, timestamp:u.timestamp, paid:u.paid, tags:(Array.isArray(u.tags)? u.tags.join(',') : (u.tags||null)) })); await supabase.from('unpaid_entries').upsert(unpaidData, { onConflict: 'user_id,timestamp' }); }
      const floatsKeys = state.transactionFloats ? Object.keys(state.transactionFloats) : [];
      if (floatsKeys.length>0){ const floatsData=floatsKeys.map(ch=>{ const f=state.transactionFloats[ch]||{}; return { user_id: window.currentUser.id, channel:ch, initial_account_float:(f.initialAccount!=null?f.initialAccount:(f.initial||0)), initial_cash_float:(f.initialCash!=null?f.initialCash:0) }; }); await supabase.from('transaction_floats').upsert(floatsData, { onConflict: 'user_id,channel' }); }
      const cycles=(state.inventoryPurchaseCycles||[]); if (cycles.length>0){ const periodsData=cycles.map(c=>({ user_id: window.currentUser.id, period_number:c.number, title:c.title||'', start_date:c.startDate||null, end_date:c.endDate||null, notes:c.notes||'' })); await supabase.from('inventory_purchase_periods').upsert(periodsData, { onConflict: 'user_id,period_number' }); }
      const purchases=(state.inventoryPurchases||[]); if (purchases.length>0){ const purchasesData=purchases.map(p=>({ user_id: window.currentUser.id, period_number:p.cycleNumber, item_name:p.itemName, quantity:p.quantity||0, unit_cost:p.unitCost||p.buyingPrice||0, total_cost:p.totalCost||p.buyingPrice||0, purchase_unit: p.purchaseUnit||null, units_per_purchase: p.unitsPerPurchase||null, purchase_date:p.purchaseDate, supplier_name:p.supplierName||'', supplier_phone:p.supplierPhone||p.supplierContact||'', supplier_address:p.supplierAddress||'', notes:p.notes||'', timestamp:p.timestamp })); await supabase.from('inventory_purchases').upsert(purchasesData, { onConflict: 'user_id,timestamp' }); }
      const loansArr=(state.loans||[]).slice();
      if (loansArr.length>0){
        const loansData = loansArr.map(l => ({ user_id: window.currentUser.id, timestamp: (l.timestamp || l.id || Date.now()), name: l.name, type: l.type, amount: Number(l.amount)||0, date: l.date, notes: l.notes || '', money_source: l.moneySource || null }));
        await supabase.from('loans').upsert(loansData, { onConflict: 'user_id,timestamp' });
        const payRows=[];
        loansArr.forEach(l => { (l.payments||[]).forEach(p => { payRows.push({ user_id: window.currentUser.id, loan_timestamp: (l.timestamp || l.id || Date.now()), amount: Number(p.amount)||0, date: p.date, timestamp: p.timestamp || (p.ts || Date.now()), source: p.source || null, destination: p.destination || null }); }); });
        if (payRows.length>0){ await supabase.from('loan_payments').upsert(payRows, { onConflict: 'user_id,timestamp' }); }
      }
      const tithingRecords=state.tithingRecords||{}; const tithingKeys=Object.keys(tithingRecords); if (tithingKeys.length>0){ const tithingData=tithingKeys.map(k=>{ const r=tithingRecords[k]||{}; return { user_id: window.currentUser.id, month_key:r.monthKey||k, base:r.base||0, due:r.due||0, paid:r.paid||0, history:r.history||[], updated_at:r.updated_at||new Date().toISOString() }; }); await supabase.from('tithing').upsert(tithingData, { onConflict: 'user_id,month_key' }); }
    } catch (error) { console.error('pushAllDataToSupabase error:', error); throw error; } finally { cloudSyncEnd(); }
  }
  window.pushAllDataToSupabase = pushAllDataToSupabase;

  async function clearAndPushAllData(skipPin){ if (!window.syncEnabled || !window.currentUser) return; try { await pushAllDataToSupabase(skipPin); } catch (error) { console.error('Merge and push error:', error); throw error; } }
  window.clearAndPushAllData = clearAndPushAllData;

  async function syncInBackground(){ if (!window.syncEnabled || !window.currentUser || !navigator.onLine) return; try { await clearAndPushAllData(true); } catch (error) { console.error('Background sync error:', error); } }
  window.syncInBackground = syncInBackground;

  async function pullDataFromSupabase(){ if (!window.syncEnabled || !window.currentUser) return; cloudSyncStart(); try { showToast && showToast('Loading Data...', 'info', null, null, 8000); const uid=window.currentUser.id; const fetch = (table, cols) => supabase.from(table).select(cols).eq('user_id', uid);
      const [ productsRes, salesRes, categoriesRes, expensesRes, incomeRes, customersRes, invoicesRes, receiptsRes, inventoryRes, notesRes, assetsRes, maintenanceRes, transactionsRes, unpaidRes, floatsRes, settingsRes, periodsRes, auditLogsRes, purchasesRes, loansRes, loanPaymentsRes, tithingRes, tagsRes ] = await Promise.all([
        fetch('products','name,category,cost,price,has_stock,sale_unit,purchase_unit,units_per_purchase,tags,deleted'),
        supabase.from('sales').select('date,time,timestamp,product_name,customer,quantity,cost_per_unit,price_per_unit,total_cost,total_price,profit,payment,status,category,has_stock,tags,deleted').eq('user_id', uid).order('timestamp',{ascending:false}),
        fetch('categories','name,kind,deleted'),
        fetch('expenses','id,date,time,timestamp,description,category,amount,payment,comment,tags,deleted'),
        fetch('income','date,time,timestamp,source,amount,payment,comment,as_capital,include_in_tithing,deleted'),
        fetch('customers','name,email,phone,address,total_purchases,tags,deleted'),
        fetch('invoices','number,customer,date,due_date,items,amount,status,subtotal,tax_rate,tax_amount,currency_code,currency_symbol,deleted'),
        fetch('receipts','number,customer,customer_email,date,time,timestamp,description,amount,payment_method,currency_code,currency_symbol,deleted'),
        fetch('inventory','product_name,stock,min_alert,deleted'),
        fetch('notes','title,content,date,time,timestamp,tags,deleted'),
        fetch('assets','name,purchase_date,time,timestamp,cost,description,money_source,deleted'),
        fetch('maintenance','asset_name,amount,date,time,timestamp,description,money_source,deleted'),
        fetch('transactions','channel,customer_name,type,amount,date,time,timestamp,tags,deleted'),
        fetch('unpaid_entries','name,type,amount,date,time,timestamp,paid,tags,deleted'),
        fetch('transaction_floats','channel,initial_account_float,initial_cash_float'),
        supabase.from('settings').select('daily_target,monthly_target,currency_code,currency_symbol,default_tax_rate,cogs_method,pin_hash,pin_updated_at').eq('user_id', uid).single(),
        fetch('inventory_purchase_periods','period_number,title,start_date,end_date,notes,deleted'),
        supabase.from('audit_logs').select('action,table_name,item_key,timestamp,created_at').eq('user_id', uid).order('timestamp',{ascending:false}).limit(50),
        fetch('inventory_purchases','period_number,item_name,quantity,unit_cost,total_cost,purchase_date,supplier_name,supplier_phone,supplier_address,notes,timestamp,purchase_unit,units_per_purchase,deleted'),
        fetch('loans','name,type,amount,date,notes,timestamp,money_source,deleted'),
        fetch('loan_payments','loan_timestamp,amount,date,timestamp,source,destination,deleted'),
        fetch('tithing','month_key,base,due,paid,history,updated_at,deleted'),
        fetch('tags','tag_name,color,deleted') ]);
      const products=(productsRes.data||[]); if (products.length){ const mapped=products.map(p=>({ id:`P-${(p.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'_')}`, name:p.name, category:p.category, cost:parseFloat(p.cost), price:parseFloat(p.price), hasStock:(p.has_stock===false)?false:true, saleUnit: p.sale_unit||'', purchaseUnit: p.purchase_unit||'', unitsPerPurchase: (p.units_per_purchase!=null?Number(p.units_per_purchase):null), tags:(typeof p.tags==='string'&&p.tags?p.tags.split(',').map(t=>t.trim()).filter(Boolean):[]), deleted: p.deleted===true })); const tomb=mapped.filter(x=>x.deleted===true); const norm=mapped.filter(x=>x.deleted!==true); if (tomb.length && window.tubaDB){ for (const it of tomb){ try { await window.tubaDB.put('products', { ...it, deleted: true }); } catch {} state.products = (state.products||[]).filter(local => !(local && local.name===it.name && String(local.category||'')===String(it.category||''))); } } state.products = deduplicateByContent([...(state.products||[]), ...norm], 'products'); }
      const sales=(salesRes.data||[]); if (sales.length){ const mapped=sales.map(s=>({ id:`S-${s.timestamp}`, date:s.date, time:s.time, timestamp:s.timestamp, productName:s.product_name, customer:s.customer, quantity:s.quantity, costPerUnit:parseFloat(s.cost_per_unit), pricePerUnit:parseFloat(s.price_per_unit), totalCost:parseFloat(s.total_cost), totalPrice:parseFloat(s.total_price), profit:parseFloat(s.profit), payment:s.payment, status:s.status||'paid', category:s.category||'', hasStock:(s.has_stock===false?false:true), tags:(typeof s.tags==='string'&&s.tags?s.tags.split(',').map(t=>t.trim()).filter(Boolean):[]), deleted: s.deleted===true })); const tomb=mapped.filter(x=>x.deleted===true); const norm=mapped.filter(x=>x.deleted!==true); if (tomb.length && window.tubaDB){ for (const it of tomb){ try { await window.tubaDB.put('sales', { ...it, deleted: true }); } catch {} state.sales = (state.sales||[]).filter(local => (local && local.id)!==it.id); } } state.sales = deduplicateByContent([...(state.sales||[]), ...norm], 'sales'); }
      const categories=(categoriesRes.data||[]); if (categories.length){
        const tomb=categories.filter(c=>c.deleted===true);
        const norm=categories.filter(c=>c.deleted!==true);
        if (tomb.length && window.tubaDB){
          for (const it of tomb){
            try { await window.tubaDB.put('categories', { ...it, deleted: true }); } catch {}
            const nm=(it.name||'').trim();
            if (nm){ state.categories = (state.categories||[]).filter(x => x !== nm); if (state.categoryKinds && state.categoryKinds[nm]) delete state.categoryKinds[nm]; }
          }
        }
        const cloudCategories=norm.map(c=>(c.name||'').trim()).filter(Boolean);
        state.categories = Array.from(new Set([...(state.categories||[]), ...cloudCategories]));
        state.categoryKinds = state.categoryKinds || {};
        norm.forEach(c => { const nm=(c.name||'').trim(); if (nm && c.kind) state.categoryKinds[nm] = c.kind; });
      }
      const expenses=(expensesRes.data||[]); if (expenses.length){ const mapped=expenses.map(e=>({ id:e.id || `E-${e.timestamp}`, date:e.date, time:e.time, timestamp:e.timestamp, description:e.description, category:e.category, amount:parseFloat(e.amount), payment:e.payment, comment:e.comment, tags:(typeof e.tags==='string'&&e.tags?e.tags.split(',').map(t=>t.trim()).filter(Boolean):[]), deleted: e.deleted===true })); const tomb=mapped.filter(x=>x.deleted===true); const norm=mapped.filter(x=>x.deleted!==true); if (tomb.length && window.tubaDB){ for (const it of tomb){ try { await window.tubaDB.put('expenses', { ...it, deleted: true }); } catch {} state.expenses = (state.expenses||[]).filter(local => (local && (local.id||local.timestamp))!==(it.id||it.timestamp)); } } state.expenses = deduplicateByContent([...(state.expenses||[]), ...norm], 'expenses'); }
      const income=(incomeRes.data||[]); if (income.length){ const mapped=income.map(i=>({ id:`I-${i.timestamp}`, date:i.date, time:i.time, timestamp:i.timestamp, source:i.source, amount:parseFloat(i.amount), payment:i.payment, comment:i.comment, asCapital: i.as_capital === true, includeTithing: i.include_in_tithing !== false, deleted: i.deleted===true })); const tomb=mapped.filter(x=>x.deleted===true); const norm=mapped.filter(x=>x.deleted!==true); if (tomb.length && window.tubaDB){ for (const it of tomb){ try { await window.tubaDB.put('income', { ...it, deleted: true }); } catch {} state.income = (state.income||[]).filter(local => (local && local.id)!==it.id); } } state.income = deduplicateByContent([...(state.income||[]), ...norm], 'income'); }
      const customers=(customersRes.data||[]); if (customers.length){ const mapped=customers.map(c=>({ name:c.name, email:c.email||'', phone:c.phone||'', address:c.address||'', totalPurchases:c.total_purchases||0, tags:(typeof c.tags==='string'&&c.tags?c.tags.split(',').map(t=>t.trim()).filter(Boolean):[]), deleted: c.deleted===true })); const tomb=mapped.filter(x=>x.deleted===true); const norm=mapped.filter(x=>x.deleted!==true); if (tomb.length && window.tubaDB){ for (const it of tomb){ try { await window.tubaDB.put('customers', { ...it, deleted: true }); } catch {} state.customers = (state.customers||[]).filter(local => !(local && local.name===it.name && String(local.email||'')===String(it.email||''))); } } state.customers = deduplicateByContent([...(state.customers||[]), ...norm], 'customers'); }
      const invoices=(invoicesRes.data||[]); if (invoices.length){ const mapped=invoices.map(inv=>({ ...inv, deleted: inv.deleted===true })); const tomb=mapped.filter(x=>x.deleted===true); const norm=mapped.filter(x=>x.deleted!==true); if (tomb.length && window.tubaDB){ for (const it of tomb){ try { await window.tubaDB.put('invoices', { ...it, deleted: true }); } catch {} state.invoices = (state.invoices||[]).filter(local => (local && local.number)!==it.number); } } state.invoices = deduplicateByContent([...(state.invoices||[]), ...norm], 'invoices'); }
      const receipts=(receiptsRes.data||[]); if (receipts.length){ const mapped=receipts.map(r=>({ ...r, deleted: r.deleted===true })); const tomb=mapped.filter(x=>x.deleted===true); const norm=mapped.filter(x=>x.deleted!==true); if (tomb.length && window.tubaDB){ for (const it of tomb){ try { await window.tubaDB.put('receipts', { ...it, deleted: true }); } catch {} state.receipts = (state.receipts||[]).filter(local => (local && local.timestamp)!==it.timestamp); } } state.receipts = deduplicateByContent([...(state.receipts||[]), ...norm], 'receipts'); }
      const inventory=(inventoryRes.data||[]); if (inventory.length){ inventory.forEach(row=>{ const name=row.product_name; if (row.deleted===true){ if (window.tubaDB){ try { window.tubaDB.put('inventory', { ...row, deleted: true }); } catch {} } if (state.inventory && state.inventory[name]) delete state.inventory[name]; return; } const inv=state.inventory[name] || { stock:0, minAlert:5 }; inv.stock = row.stock || 0; inv.minAlert = row.min_alert || inv.minAlert; state.inventory[name] = inv; }); }
      const notes=(notesRes.data||[]); if (notes.length){ const mapped=notes.map(n=>({ title:n.title, content:n.content, date:n.date, time:n.time, timestamp:n.timestamp, tags: (typeof n.tags==='string' && n.tags ? n.tags.split(',').map(t=>t.trim()).filter(Boolean) : (Array.isArray(n.tags)? n.tags : []) ), deleted: n.deleted===true })); const tomb=mapped.filter(x=>x.deleted===true); const norm=mapped.filter(x=>x.deleted!==true); if (tomb.length && window.tubaDB){ for (const it of tomb){ try { await window.tubaDB.put('notes', { ...it, deleted: true }); } catch {} state.notes = (state.notes||[]).filter(local => (local && local.timestamp)!==it.timestamp); } } state.notes = deduplicateByContent([...(state.notes||[]), ...norm], 'notes'); }
      const assets=(assetsRes.data||[]); if (assets.length){ const mapped=assets.map(a=>({ name:a.name, purchaseDate:a.purchase_date, time:a.time, timestamp:a.timestamp, cost:parseFloat(a.cost)||0, description:a.description||'', moneySource: a.money_source || 'business', deleted: a.deleted===true })); const tomb=mapped.filter(x=>x.deleted===true); const norm=mapped.filter(x=>x.deleted!==true); if (tomb.length && window.tubaDB){ for (const it of tomb){ try { await window.tubaDB.put('assets', { ...it, deleted: true }); } catch {} state.assets = (state.assets||[]).filter(local => (local && local.timestamp)!==it.timestamp); } } state.assets = deduplicateByContent([...(state.assets||[]), ...norm], 'assets'); }
      const loansAll = (loansRes.data || []);
      const deletedLoans = loansAll.filter(l => l.deleted === true);
      if (deletedLoans.length && window.tubaDB){
        for (const it of deletedLoans){
          try { await window.tubaDB.put('loans', { ...it, deleted: true }); } catch {}
          state.loans = (state.loans || []).filter(x => (x && (x.timestamp || x.id)) !== it.timestamp);
        }
      }
      const loansCloud = loansAll.filter(l => l.deleted !== true).map(l => ({ id: l.timestamp, timestamp: l.timestamp, name: l.name, type: l.type, amount: parseFloat(l.amount)||0, date: l.date, notes: l.notes||'', moneySource: l.money_source || null, payments: [] }));
      const loanPaysAll = (loanPaymentsRes.data || []);
      const deletedLoanPays = loanPaysAll.filter(p => p.deleted === true);
      if (deletedLoanPays.length && window.tubaDB){
        for (const it of deletedLoanPays){
          try { await window.tubaDB.put('loan_payments', { ...it, deleted: true }); } catch {}
        }
      }
      const loanPaymentsCloud = loanPaysAll.filter(p => p.deleted !== true).map(p => ({ loan_timestamp: p.loan_timestamp, amount: parseFloat(p.amount)||0, date: p.date, timestamp: p.timestamp, source: p.source || null, destination: p.destination || null }));
      if (loansCloud.length){
        const byTs = new Map(loansCloud.map(l => [l.timestamp, l]));
        loanPaymentsCloud.forEach(p => { const host = byTs.get(p.loan_timestamp); if (host) { host.payments = host.payments || []; host.payments.push({ amount: p.amount, date: p.date, timestamp: p.timestamp, source: p.source, destination: p.destination }); } });
        const merged = (state.loans || []).slice();
        loansCloud.forEach(cl => {
          const idx = merged.findIndex(x => (x.timestamp || x.id) === cl.timestamp);
          if (idx >= 0) {
            const local = merged[idx];
            const pays = Array.isArray(local.payments) ? local.payments.slice() : [];
            const seen = new Set(pays.map(pp => String(pp.timestamp || '')));
            (cl.payments || []).forEach(pp => { const key = String(pp.timestamp || ''); if (!seen.has(key)) pays.push(pp); });
            merged[idx] = { ...local, ...cl, payments: pays };
          } else {
            merged.push(cl);
          }
        });
        state.loans = merged;
      }
      const maintenance=(maintenanceRes.data||[]); if (maintenance.length){ const mapped=maintenance.map(m=>({ assetName:m.asset_name, amount:parseFloat(m.amount)||0, date:m.date, time:m.time, timestamp:m.timestamp, description:m.description||'', moneySource: m.money_source || 'business', deleted: m.deleted===true })); const tomb=mapped.filter(x=>x.deleted===true); const norm=mapped.filter(x=>x.deleted!==true); if (tomb.length && window.tubaDB){ for (const it of tomb){ try { await window.tubaDB.put('maintenance', { ...it, deleted: true }); } catch {} state.maintenance = (state.maintenance||[]).filter(local => (local && local.timestamp)!==it.timestamp); } } state.maintenance = deduplicateByContent([...(state.maintenance||[]), ...norm], 'maintenance'); }
      const transactions=(transactionsRes.data||[]); if (transactions.length){ const mapped=transactions.map(t=>({ channel:t.channel, customerName:t.customer_name, type:t.type, amount:parseFloat(t.amount), date:t.date, time:t.time, timestamp:t.timestamp, tags:(typeof t.tags==='string'&&t.tags?t.tags.split(',').map(x=>x.trim()).filter(Boolean):[]), deleted: t.deleted===true })); const tomb=mapped.filter(x=>x.deleted===true); const norm=mapped.filter(x=>x.deleted!==true); if (tomb.length && window.tubaDB){ for (const it of tomb){ try { await window.tubaDB.put('transactions', { ...it, deleted: true }); } catch {} state.transactions = (state.transactions||[]).filter(local => (local && local.timestamp)!==it.timestamp); } } state.transactions = deduplicateByContent([...(state.transactions||[]), ...norm], 'transactions'); }
      const unpaidEntries=(unpaidRes.data||[]); if (unpaidEntries.length){ const mapped=unpaidEntries.map(u=>({ name:u.name, type:u.type, amount:parseFloat(u.amount), date:u.date, time:u.time, timestamp:u.timestamp, paid:!!u.paid, tags:(typeof u.tags==='string'&&u.tags?u.tags.split(',').map(t=>t.trim()).filter(Boolean):[]), deleted: u.deleted===true })); const tomb=mapped.filter(x=>x.deleted===true); const norm=mapped.filter(x=>x.deleted!==true); if (tomb.length && window.tubaDB){ for (const it of tomb){ try { await window.tubaDB.put('unpaid_entries', { ...it, deleted: true }); } catch {} state.unpaidEntries = (state.unpaidEntries||[]).filter(local => (local && local.timestamp)!==it.timestamp); } } state.unpaidEntries = deduplicateByContent([...(state.unpaidEntries||[]), ...norm], 'unpaid'); }
      const floats=(floatsRes.data||[]); if (floats.length){ state.transactionFloats = state.transactionFloats || {}; floats.forEach(f=>{ const ch=f.channel; state.transactionFloats[ch] = state.transactionFloats[ch] || {}; state.transactionFloats[ch].initialAccount = f.initial_account_float || 0; state.transactionFloats[ch].initialCash = f.initial_cash_float || 0; }); }
      const settings=(settingsRes.data||{}); if (settings && Object.keys(settings).length){ state.dailyTarget=settings.daily_target||state.dailyTarget; state.monthlyTarget=settings.monthly_target||state.monthlyTarget; state.currencyCode=settings.currency_code||state.currencyCode; state.currencySymbol=settings.currency_symbol||state.currencySymbol; state.defaultTaxRate=settings.default_tax_rate||state.defaultTaxRate; state.cogsMethod=settings.cogs_method||state.cogsMethod; state.securityPinHash = settings.pin_hash || null; state.securityPinUpdatedAt = settings.pin_updated_at || null; }
      const periods=(periodsRes.data||[]);
      if (periods.length){
        const tomb=periods.filter(c=>c.deleted===true);
        const norm=periods.filter(c=>c.deleted!==true);
        if (tomb.length && window.tubaDB){
          for (const it of tomb){
            try { await window.tubaDB.put('inventory_purchase_periods', { ...it, deleted: true }); } catch {}
            state.inventoryPurchaseCycles = (state.inventoryPurchaseCycles || []).filter(x => (x && x.number) !== it.period_number);
          }
        }
        const cycles = norm.map(c=>({ id:`CYC-${c.period_number}`, number:c.period_number, title:c.title||'', startDate:c.start_date||'', endDate:c.end_date||'', notes:c.notes||'' }));
        state.inventoryPurchaseCycles = cycles;
      }
      const audits=(auditLogsRes.data||[]); if (audits.length){ state.auditLogs = audits; }
      const purchases=(purchasesRes.data||[]);
      if (purchases.length){
        const mapped = purchases.map(p=>({
          id:`PUR-${p.timestamp}`,
          cycleNumber:p.period_number,
          itemName:p.item_name,
          quantity:parseInt(p.quantity||0,10),
          unitCost:parseFloat(p.unit_cost||0),
          totalCost:parseFloat(p.total_cost||0),
          purchaseUnit: p.purchase_unit||null,
          unitsPerPurchase: (p.units_per_purchase!=null?Number(p.units_per_purchase):null),
          purchaseDate:p.purchase_date||'',
          time:p.time||'',
          supplierName:p.supplier_name||'',
          supplierPhone:p.supplier_phone||'',
          supplierAddress:p.supplier_address||'',
          notes:p.notes||'',
          timestamp:p.timestamp,
          planned:false,
          activated:true,
          discount:0,
          deleted: p.deleted===true
        }));
        const tomb=mapped.filter(x=>x.deleted===true);
        const norm=mapped.filter(x=>x.deleted!==true);
        if (tomb.length && window.tubaDB){ for (const it of tomb){ try { await window.tubaDB.put('inventory_purchases', { ...it, deleted: true }); } catch {} state.inventoryPurchases = (state.inventoryPurchases||[]).filter(local => (local && local.timestamp)!==it.timestamp); } }
        state.inventoryPurchases = (Array.isArray(state.inventoryPurchases) && state.inventoryPurchases.length)
          ? state.inventoryPurchases.concat(norm)
          : norm;
      }
      const tithingCloud=(tithingRes.data||[]); if (tithingCloud.length){ state.tithingRecords = state.tithingRecords || {}; tithingCloud.forEach(r=>{ const mk=String(r.month_key); if (r.deleted===true){ if (window.tubaDB){ try { window.tubaDB.put('tithing', { ...r, deleted: true }); } catch {} } if (state.tithingRecords[mk]) delete state.tithingRecords[mk]; return; } state.tithingRecords[mk] = { monthKey: mk, base: r.base || 0, due: r.due || 0, paid: r.paid || 0, history: r.history || [], updated_at: r.updated_at || new Date().toISOString() }; }); }
      const tagsCloud=(tagsRes.data||[]); if (tagsCloud.length){ const tomb=tagsCloud.filter(r=>r.deleted===true); const norm=tagsCloud.filter(r=>r.deleted!==true); if (tomb.length && window.tubaDB){ for (const it of tomb){ try { await window.tubaDB.put('tags', { ...it, deleted: true }); } catch {} const n=String(it.tag_name||'').toLowerCase(); if (n){ state.tags = (state.tags||[]).filter(t => t !== n); if (state.tagColors && state.tagColors[n]) delete state.tagColors[n]; } } } const names=norm.map(r=>String(r.tag_name||'').toLowerCase()).filter(Boolean); const unique=Array.from(new Set([...(state.tags||[]), ...names])); state.tags = unique; state.tagColors = state.tagColors || {}; norm.forEach(r=>{ const n=String(r.tag_name||'').toLowerCase(); if (!n) return; const col = r.color || '#999999'; if (!state.tagColors[n]) state.tagColors[n] = col; }); }
      try { saveData && saveData(); render && render(); } catch {}
    } catch (error) { console.error('Pull data error:', error); } finally { cloudSyncEnd(); }
  }
  window.pullDataFromSupabase = pullDataFromSupabase;
 
  function sendAuthToSW(session){
    try {
      if (!session || !('serviceWorker' in navigator)) return;
      navigator.serviceWorker.ready.then(reg => {
        const target = reg.active || navigator.serviceWorker.controller;
        if (!target) return;
        const payload = {
          type: 'auth',
          token: session.access_token,
          uid: session.user && session.user.id,
          supabaseUrl: window.SUPABASE_URL,
          anonKey: window.SUPABASE_ANON_KEY
        };
        target.postMessage(payload);
      }).catch(()=>{});
    } catch {}
  }
  window.sendAuthToSW = sendAuthToSW;
  (function(){
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          try {
            if (reg.periodicSync && typeof reg.periodicSync.register === 'function') {
              reg.periodicSync.register('tuba-prefetch', { minInterval: 60 * 60 * 1000 }).catch(()=>{});
            }
          } catch {}
        }).catch(()=>{});
      }
    } catch {}
  })();
  async function openPrefetchDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('tuba-sw', 1);
      req.onupgradeneeded = function(){};
      req.onsuccess = function(){ resolve(req.result); };
      req.onerror = function(){ reject(req.error || new Error('idb open')); };
    });
  }
  async function idbGetPrefetch(table) {
    const db = await openPrefetchDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('prefetch', 'readonly');
      const st = tx.objectStore('prefetch');
      const req = st.get(table);
      req.onsuccess = function(){ resolve(req.result || null); };
      req.onerror = function(){ reject(req.error || new Error('idb get')); };
    });
  }
  async function loadPrefetchedDataFromSW(){
    try {
      const productsRec = await idbGetPrefetch('products');
      const salesRec = await idbGetPrefetch('sales');
      const categoriesRec = await idbGetPrefetch('categories');
      const expensesRec = await idbGetPrefetch('expenses');
      const incomeRec = await idbGetPrefetch('income');
      const customersRec = await idbGetPrefetch('customers');
      const invoicesRec = await idbGetPrefetch('invoices');
      const receiptsRec = await idbGetPrefetch('receipts');
      const inventoryRec = await idbGetPrefetch('inventory');
      const notesRec = await idbGetPrefetch('notes');
      const assetsRec = await idbGetPrefetch('assets');
      const maintenanceRec = await idbGetPrefetch('maintenance');
      const transactionsRec = await idbGetPrefetch('transactions');
      const unpaidRec = await idbGetPrefetch('unpaid_entries');
      const floatsRec = await idbGetPrefetch('transaction_floats');
      const settingsRec = await idbGetPrefetch('settings');
      const periodsRec = await idbGetPrefetch('inventory_purchase_periods');
      const purchasesRec = await idbGetPrefetch('inventory_purchases');
      const loansRec = await idbGetPrefetch('loans');
      const loanPaymentsRec = await idbGetPrefetch('loan_payments');
      const tithingRec = await idbGetPrefetch('tithing');
      const tagsRec = await idbGetPrefetch('tags');
      const products = (productsRec && productsRec.data) || [];
      if (products.length){
        const cloudProducts = products.map(p=>({ id:`P-${(p.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'_')}`, name:p.name, category:p.category, cost:parseFloat(p.cost), price:parseFloat(p.price), hasStock:(p.has_stock===false)?false:true, saleUnit: p.sale_unit||'', purchaseUnit: p.purchase_unit||'', unitsPerPurchase: (p.units_per_purchase!=null?Number(p.units_per_purchase):null), tags:(typeof p.tags==='string'&&p.tags?p.tags.split(',').map(t=>t.trim()).filter(Boolean):[]) }));
        state.products = deduplicateByContent([...(state.products||[]), ...cloudProducts], 'products');
      }
      const sales = (salesRec && salesRec.data) || [];
      if (sales.length){
        const cloudSales=sales.map(s=>({ id:`S-${s.timestamp}`, date:s.date, time:s.time, timestamp:s.timestamp, productName:s.product_name, customer:s.customer, quantity:s.quantity, costPerUnit:parseFloat(s.cost_per_unit), pricePerUnit:parseFloat(s.price_per_unit), totalCost:parseFloat(s.total_cost), totalPrice:parseFloat(s.total_price), profit:parseFloat(s.profit), payment:s.payment, status:s.status||'paid', category:s.category||'', hasStock:(s.has_stock===false?false:true), tags:(typeof s.tags==='string'&&s.tags?s.tags.split(',').map(t=>t.trim()).filter(Boolean):[]) }));
        state.sales = deduplicateByContent([...(state.sales||[]), ...cloudSales], 'sales');
      }
      const categories = (categoriesRec && categoriesRec.data) || [];
      if (categories.length){
        const cloudCategories=categories.map(c=>(c.name||'').trim()).filter(Boolean);
        state.categories = Array.from(new Set([...(state.categories||[]), ...cloudCategories]));
        state.categoryKinds = state.categoryKinds || {};
        categories.forEach(c => { const nm=(c.name||'').trim(); if (nm && c.kind) state.categoryKinds[nm] = c.kind; });
      }
      const expenses = (expensesRec && expensesRec.data) || [];
      if (expenses.length){
        const cloudExpenses=expenses.map(e=>({ id:e.id || `E-${e.timestamp}`, date:e.date, time:e.time, timestamp:e.timestamp, description:e.description, category:e.category, amount:parseFloat(e.amount), payment:e.payment, comment:e.comment, tags:(typeof e.tags==='string'&&e.tags?e.tags.split(',').map(t=>t.trim()).filter(Boolean):[]) }));
        state.expenses = deduplicateByContent([...(state.expenses||[]), ...cloudExpenses], 'expenses');
      }
      const income = (incomeRec && incomeRec.data) || [];
      if (income.length){
        const cloudIncome=income.map(i=>({ id:`I-${i.timestamp}`, date:i.date, time:i.time, timestamp:i.timestamp, source:i.source, amount:parseFloat(i.amount), payment:i.payment, comment:i.comment, asCapital: i.as_capital === true, includeTithing: i.include_in_tithing !== false }));
        state.income = deduplicateByContent([...(state.income||[]), ...cloudIncome], 'income');
      }
      const customers = (customersRec && customersRec.data) || [];
      if (customers.length){
        const cloudCustomers=customers.map(c=>({ name:c.name, email:c.email||'', phone:c.phone||'', address:c.address||'', totalPurchases:c.total_purchases||0, tags:(typeof c.tags==='string'&&c.tags?c.tags.split(',').map(t=>t.trim()).filter(Boolean):[]) }));
        state.customers = deduplicateByContent([...(state.customers||[]), ...cloudCustomers], 'customers');
      }
      const invoices = (invoicesRec && invoicesRec.data) || [];
      if (invoices.length){
        state.invoices = deduplicateByContent([...(state.invoices||[]), ...invoices], 'invoices');
      }
      const receipts = (receiptsRec && receiptsRec.data) || [];
      if (receipts.length){
        state.receipts = deduplicateByContent([...(state.receipts||[]), ...receipts], 'receipts');
      }
      const inventory = (inventoryRec && inventoryRec.data) || [];
      if (inventory.length){
        inventory.forEach(row=>{ const name=row.product_name; const inv=state.inventory[name] || { stock:0, minAlert:5 }; inv.stock = row.stock || 0; inv.minAlert = row.min_alert || inv.minAlert; state.inventory[name] = inv; });
      }
      const notes = (notesRec && notesRec.data) || [];
      if (notes.length){
        const cloudNotes=notes.map(n=>({ title:n.title, content:n.content, date:n.date, time:n.time, timestamp:n.timestamp, tags: (typeof n.tags==='string' && n.tags ? n.tags.split(',').map(t=>t.trim()).filter(Boolean) : (Array.isArray(n.tags)? n.tags : [])) }));
        state.notes = deduplicateByContent([...(state.notes||[]), ...cloudNotes], 'notes');
      }
      const assets = (assetsRec && assetsRec.data) || [];
      if (assets.length){
        const cloudAssets = assets.map(a => ({
          name: a.name,
          purchaseDate: a.purchase_date,
          time: a.time,
          timestamp: a.timestamp,
          cost: parseFloat(a.cost) || 0,
          description: a.description || '',
          moneySource: a.money_source || 'business'
        }));
        state.assets = deduplicateByContent([...(state.assets||[]), ...cloudAssets], 'assets');
      }
      const loans = (loansRec && loansRec.data) || [];
      const loanPays = (loanPaymentsRec && loanPaymentsRec.data) || [];
      if (loans.length){
        const cloudLoans = loans.map(l => ({ id: l.timestamp, timestamp: l.timestamp, name: l.name, type: l.type, amount: parseFloat(l.amount)||0, date: l.date, notes: l.notes||'', payments: [] }));
        const byTs = new Map(cloudLoans.map(l => [l.timestamp, l]));
        loanPays.forEach(p => {
          const host = byTs.get(p.loan_timestamp);
          if (host) {
            host.payments = host.payments || [];
            host.payments.push({ amount: parseFloat(p.amount)||0, date: p.date, timestamp: p.timestamp, source: p.source || 'business' });
          }
        });
        state.loans = deduplicateByContent([...(state.loans||[]), ...cloudLoans], 'loans');
      }
      const maintenance = (maintenanceRec && maintenanceRec.data) || [];
      if (maintenance.length){
        const cloudMaint = maintenance.map(m => ({ assetName: m.asset_name, amount: parseFloat(m.amount)||0, date: m.date, time: m.time, timestamp: m.timestamp, description: m.description||'', moneySource: m.money_source || 'business' }));
        state.maintenance = deduplicateByContent([...(state.maintenance||[]), ...cloudMaint], 'maintenance');
      }
      const transactions = (transactionsRec && transactionsRec.data) || [];
      if (transactions.length){
        const cloudTx=transactions.map(t=>({ channel:t.channel, customerName:t.customer_name, type:t.type, amount:parseFloat(t.amount), date:t.date, time:t.time, timestamp:t.timestamp, tags:(typeof t.tags==='string'&&t.tags?t.tags.split(',').map(x=>x.trim()).filter(Boolean):[]) }));
        state.transactions = deduplicateByContent([...(state.transactions||[]), ...cloudTx], 'transactions');
      }
      const unpaid = (unpaidRec && unpaidRec.data) || [];
      if (unpaid.length){
        const cloudUnpaid=unpaid.map(u=>({ name:u.name, type:u.type, amount:parseFloat(u.amount), date:u.date, time:u.time, timestamp:u.timestamp, paid:!!u.paid, tags:(typeof u.tags==='string'&&u.tags?u.tags.split(',').map(t=>t.trim()).filter(Boolean):[]) }));
        state.unpaidEntries = deduplicateByContent([...(state.unpaidEntries||[]), ...cloudUnpaid], 'unpaid');
      }
      const floats = (floatsRec && floatsRec.data) || [];
      if (floats.length){
        state.transactionFloats = state.transactionFloats || {};
        floats.forEach(f=>{ const ch=f.channel; state.transactionFloats[ch] = state.transactionFloats[ch] || {}; state.transactionFloats[ch].initialAccount = f.initial_account_float || 0; state.transactionFloats[ch].initialCash = f.initial_cash_float || 0; });
      }
      const settings = (settingsRec && settingsRec.data) || {};
      if (settings && Object.keys(settings).length){
        state.dailyTarget=settings.daily_target||state.dailyTarget;
        state.monthlyTarget=settings.monthly_target||state.monthlyTarget;
        state.currencyCode=settings.currency_code||state.currencyCode;
        state.currencySymbol=settings.currency_symbol||state.currencySymbol;
        state.defaultTaxRate=settings.default_tax_rate||state.defaultTaxRate;
        state.cogsMethod=settings.cogs_method||state.cogsMethod;
        state.securityPinHash = settings.pin_hash || state.securityPinHash || null;
        state.securityPinUpdatedAt = settings.pin_updated_at || state.securityPinUpdatedAt || null;
      }
      const periods = (periodsRec && periodsRec.data) || [];
      if (periods.length){
        const cycles = periods.map(c=>({ id:`CYC-${c.period_number}`, number:c.period_number, title:c.title||'', startDate:c.start_date||'', endDate:c.end_date||'', notes:c.notes||'' }));
        state.inventoryPurchaseCycles = cycles;
      }
      const purchases = (purchasesRec && purchasesRec.data) || [];
      if (purchases.length){
        const cloudPurchases = purchases.map(p=>({
          id:`PUR-${p.timestamp}`,
          cycleNumber:p.period_number,
          itemName:p.item_name,
          quantity:parseInt(p.quantity||0,10),
          unitCost:parseFloat(p.unit_cost||0),
          totalCost:parseFloat(p.total_cost||0),
          purchaseUnit: p.purchase_unit||null,
          unitsPerPurchase: (p.units_per_purchase!=null?Number(p.units_per_purchase):null),
          purchaseDate:p.purchase_date||'',
          time:p.time||'',
          supplierName:p.supplier_name||'',
          supplierPhone:p.supplier_phone||'',
          supplierAddress:p.supplier_address||'',
          notes:p.notes||'',
          timestamp:p.timestamp,
          planned:false,
          activated:true,
          discount:0
        }));
        state.inventoryPurchases = (Array.isArray(state.inventoryPurchases) && state.inventoryPurchases.length)
          ? state.inventoryPurchases.concat(cloudPurchases)
          : cloudPurchases;
      }
      const tithingCloud = (tithingRec && tithingRec.data) || [];
      if (tithingCloud.length){
        state.tithingRecords = state.tithingRecords || {};
        tithingCloud.forEach(r=>{ const mk=String(r.month_key); state.tithingRecords[mk] = { monthKey: mk, base: r.base || 0, due: r.due || 0, paid: r.paid || 0, history: r.history || [], updated_at: r.updated_at || new Date().toISOString() }; });
      }
      const tagsCloud = (tagsRec && tagsRec.data) || [];
      if (tagsCloud.length){
        const names=tagsCloud.map(r=>String(r.tag_name||'').toLowerCase()).filter(Boolean);
        const unique=Array.from(new Set([...(state.tags||[]), ...names]));
        state.tags = unique;
        state.tagColors = state.tagColors || {};
        tagsCloud.forEach(r=>{ const n=String(r.tag_name||'').toLowerCase(); if (!n) return; const col = r.color || '#999999'; if (!state.tagColors[n]) state.tagColors[n] = col; });
      }
      try { saveData && saveData(); render && render(); } catch {}
    } catch {}
  }
  window.loadPrefetchedDataFromSW = loadPrefetchedDataFromSW;
  
  async function pullSalesHistory(){ try { if (!window.syncEnabled || !window.currentUser || !window.supabase) { showToast && showToast('Sign in to pull history', 'error'); return; } showToast && showToast('Pulling sales history...', 'info', null, null, 6000); const uid=window.currentUser.id; const res = await supabase.from('sales').select('date,time,timestamp,product_name,customer,quantity,cost_per_unit,price_per_unit,total_cost,total_price,profit,payment,status,category,tags').eq('user_id', uid).order('timestamp',{ascending:false}); const rows = res.data || []; if (rows.length){ const cloudSales = rows.map(s=>({ id:`S-${s.timestamp}`, date:s.date, time:s.time, timestamp:s.timestamp, productName:s.product_name, customer:s.customer, quantity:s.quantity, costPerUnit:parseFloat(s.cost_per_unit), pricePerUnit:parseFloat(s.price_per_unit), totalCost:parseFloat(s.total_cost), totalPrice:parseFloat(s.total_price), profit:parseFloat(s.profit), payment:s.payment, status:s.status||'paid', category:s.category||'', tags:(typeof s.tags==='string'&&s.tags?s.tags.split(',').map(t=>t.trim()).filter(Boolean):[]) })); state.sales = deduplicateByContent([...(state.sales||[]), ...cloudSales], 'sales'); state.showSalesHistory = true; try { saveData && saveData(); render && render(); } catch {} } else { state.showSalesHistory = true; try { render && render(); } catch {} } } catch (error) { console.error('pullSalesHistory error:', error); } }
  window.pullSalesHistory = pullSalesHistory;

  // Inventory Cloud Persistence Diagnostic
  window.testInventoryCloudPersistence = async function(){
    try {
      if (!window.syncEnabled || !window.currentUser || !window.supabase) { showToast && showToast('Sign in to test cloud', 'error'); return; }
      const uid = window.currentUser.id;
      const today = new Date().toISOString().slice(0,10);
      const nowTs = Date.now();
      const periodNumber = Math.floor(nowTs % 1000000);
      const periodPayload = { period_number: periodNumber, title: 'Diagnostic Period', start_date: today, end_date: '', notes: 'auto diagnostic' };
      await upsertOne('inventory_purchase_periods', periodPayload);
      const purchasePayload = { period_number: periodNumber, item_name: '__DIAGNOSTIC_ITEM__', quantity: 1, unit_cost: 1, total_cost: 1, purchase_date: today, supplier_name: '', supplier_phone: '', supplier_address: '', notes: 'diagnostic', timestamp: nowTs };
      await upsertOne('inventory_purchases', purchasePayload);
      await new Promise(r=>setTimeout(r, 800));
      const { data, error } = await supabase.from('inventory_purchases').select('timestamp,item_name,period_number').eq('user_id', uid).eq('timestamp', nowTs).limit(1);
      if (error) throw error;
      if (Array.isArray(data) && data.length>0) {
        showToast && showToast('✅ Inventory purchase persisted in cloud', 'success');
      } else {
        showToast && showToast('❌ Not found in cloud; check RLS/policies', 'error');
      }
      try { await deleteOne('inventory_purchases', { timestamp: nowTs }); } catch {}
      try { await deleteOne('inventory_purchase_periods', { period_number: periodNumber }); } catch {}
    } catch(err){ console.error('testInventoryCloudPersistence error:', err); showToast && showToast('Diagnostic error', 'error'); }
  };

  try {
    if (!window._originalRender && typeof window.render === 'function') {
      window._originalRender = window.render;
    }
    window.render = function() {
      const scrollMap = new Map();
      const lists = document.querySelectorAll('.list-scroll-container');
      lists.forEach(el => {
        if (el && el.id) scrollMap.set(el.id, el.scrollTop);
      });
      const active = document.activeElement;
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');
      const isBusy = (window.state && window.state.lastInteractionInProgress);
      const modalShown = document.querySelector('.modal.show');
      const modalDisplayed = Array.from(document.querySelectorAll('.modal')).find(m => {
        const ds = m && m.style ? m.style.display : '';
        return ds === 'block' || ds === 'flex';
      });
      const openModal = modalShown || modalDisplayed;
      if (isInput || isBusy || openModal) return;
      if (typeof window._originalRender === 'function') {
        window._originalRender();
      }
      requestAnimationFrame(() => {
        scrollMap.forEach((scrollTop, id) => {
          const el = document.getElementById(id);
          if (el) {
            el.scrollTop = scrollTop;
          }
        });
      });
    };
  } catch {}

  function attemptBootstrap(force) {
    try { initPWA(); } catch {}
    try {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        initSupabase();
      }
    } catch (e) { console.error('Bootstrap error:', e); }
    try {
      if (window.__deferAuthUntilUiReady && !window.__uiRenderedOnce && !force) {
        window.__pendingAuthBootstrap = true;
        return;
      }
    } catch {}
    try {
      if (!window.__restoreSessionInFlight && typeof window.restoreSession === 'function' && window.supabase && window.supabase.auth) {
        window.__restoreSessionInFlight = true;
        Promise.resolve(window.restoreSession()).finally(() => { window.__restoreSessionInFlight = false; });
      }
    } catch {}
  }
  try {
    window.__runDeferredAuthBootstrap = function(){
      if (!window.__pendingAuthBootstrap) return;
      window.__pendingAuthBootstrap = false;
      attemptBootstrap(true);
    };
  } catch {}
  attemptBootstrap();
  window.addEventListener('DOMContentLoaded', attemptBootstrap);
  window.addEventListener('load', attemptBootstrap);
})();
window.urlBase64ToUint8Array = function(base64String){
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
  return outputArray;
};
window.VAPID_PUBLIC_KEY = window.VAPID_PUBLIC_KEY || 'BLXVHSrBIIe2SpkpHhptJtv4dIP6GZCzOXJ5p4SYS19U5_gLzSlE0nhrPR0y0Fiaxf0W652nCb1q6IW9dDq-tkM';
window.subscribeToPush = async function(){
  try {
    if (!window.currentUser) { showToast && showToast('Sign in first', 'error'); return; }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { showToast && showToast('Push not supported', 'error'); return; }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { showToast && showToast('Permission denied', 'error'); return; }
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      try {
        const subJsonOld = existing.toJSON();
        const { error: upErr } = await supabase.from('push_subscriptions').upsert({
          user_id: window.currentUser.id,
          endpoint: subJsonOld.endpoint,
          p256dh: subJsonOld.keys.p256dh,
          auth: subJsonOld.keys.auth
        }, { onConflict: 'user_id,endpoint' });
        if (upErr) { showToast && showToast('Failed to save subscription: ' + (upErr.message || 'unknown'), 'error'); return; }
        showToast && showToast('Notifications Enabled', 'success');
    try { window.state = window.state || {}; window.state.pushEnabled = true; localStorage.setItem('tuba-push-enabled', '1'); } catch {}
    try { if (typeof updateQuickButtonsState === 'function') updateQuickButtonsState(); } catch {}
        return;
      } catch (e) {}
    }
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(window.VAPID_PUBLIC_KEY)
    });
    const subJson = subscription.toJSON();
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: window.currentUser.id,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth
    }, { onConflict: 'user_id,endpoint' });
    if (error) { showToast && showToast('Failed to save subscription: ' + (error.message || 'unknown'), 'error'); return; }
    showToast && showToast('Notifications Enabled', 'success');
    try { window.state = window.state || {}; window.state.pushEnabled = true; localStorage.setItem('tuba-push-enabled', '1'); } catch {}
    try { if (typeof updateQuickButtonsState === 'function') updateQuickButtonsState(); } catch {}
  } catch (err) {
    try {
      const msg = String((err && err.message) || '').toLowerCase();
      if (msg.includes('applicationsubserverkey') || msg.includes('gcm')) {
        await window.resetPushSubscription();
        return;
      }
    } catch {}
    showToast && showToast('Subscribe error: ' + (err && err.message ? err.message : 'unknown'), 'error');
  }
};
window.loadPushPreferences = async function(){
  try {
    if (window.supabase) {
      let uid = null;
      try { const { data: { session } } = await supabase.auth.getSession(); uid = (session && session.user && session.user.id) || null; } catch {}
      if (uid) {
        const { data, error } = await supabase.from('push_preferences').select('morning,evening,backup,destructive').eq('user_id', uid).single();
        if (!error && data) {
          window.state = window.state || {};
          window.state.pushPrefs = { morning: !!data.morning, evening: !!data.evening, backup: !!data.backup, destructive: !!data.destructive };
          saveData();
        }
      }
    }
    if (!window.state || !window.state.pushPrefs) {
      try {
        const raw = localStorage.getItem('tuba-push-prefs');
        if (raw) {
          const obj = JSON.parse(raw);
          window.state = window.state || {};
          window.state.pushPrefs = { morning: !!obj.morning, evening: !!obj.evening, backup: !!obj.backup, destructive: !!obj.destructive };
        }
      } catch {}
    }
  } catch {}
};
window.savePushPreferences = async function(){
  try {
    const m = !!document.getElementById('pushPrefMorning')?.checked;
    const e = !!document.getElementById('pushPrefEvening')?.checked;
    const b = !!document.getElementById('pushPrefBackup')?.checked;
    const d = !!document.getElementById('pushPrefDestructive')?.checked;
    window.state = window.state || {};
    window.state.pushPrefs = { morning: m, evening: e, backup: b, destructive: d };
    saveData();
    try { localStorage.setItem('tuba-push-prefs', JSON.stringify(window.state.pushPrefs)); } catch {}
    if (window.supabase) {
      let uid = null;
      try { const { data: { session } } = await supabase.auth.getSession(); uid = (session && session.user && session.user.id) || null; } catch {}
      if (uid) {
        const { error } = await supabase.from('push_preferences').upsert({ user_id: uid, morning: m, evening: e, backup: b, destructive: d }, { onConflict: 'user_id' });
        if (error) { showToast && showToast('Save failed: ' + (error.message || 'unknown'), 'error'); return; }
      } else {
        showToast && showToast('Saved locally — sign in to sync preferences', 'info');
      }
    }
    showToast && showToast('Push preferences saved', 'success');
    try { if (typeof updateQuickButtonsState === 'function') updateQuickButtonsState(); } catch {}
  } catch(e){
    showToast && showToast('Save failed', 'error');
  }
};
window.resetPushSubscription = async function(){
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { showToast && showToast('Push not supported', 'error'); return; }
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      try {
        const info = existing.toJSON();
        await existing.unsubscribe();
        try { if (window.currentUser && window.supabase) { await supabase.from('push_subscriptions').delete().eq('user_id', window.currentUser.id).eq('endpoint', info.endpoint); } } catch {}
      } catch {}
    }
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(window.VAPID_PUBLIC_KEY) });
    const s = sub.toJSON();
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: window.currentUser.id,
      endpoint: s.endpoint,
      p256dh: s.keys.p256dh,
      auth: s.keys.auth
    }, { onConflict: 'user_id,endpoint' });
    if (error) { showToast && showToast('Failed to save subscription: ' + (error.message || 'unknown'), 'error'); return; }
    showToast && showToast('Notifications Enabled', 'success');
    try { window.state = window.state || {}; window.state.pushEnabled = true; localStorage.setItem('tuba-push-enabled', '1'); } catch {}
    try { if (typeof updateQuickButtonsState === 'function') updateQuickButtonsState(); } catch {}
  } catch (e) {
    showToast && showToast('Reset push failed: ' + (e && e.message ? e.message : 'unknown'), 'error');
  }
};
window.sendTestPush = async function(){
  try {
    const base = (window.API_URL || (window.location && window.location.origin) || '');
    const url = String(base).replace(/\/+$/,'') + '/api/push-reminders?kind=morning&secret=' + encodeURIComponent('tuba-secure-8821');
    const res = await fetch(url);
    if (res && res.ok) { showToast && showToast('Test push requested', 'success'); }
    else { showToast && showToast('Test push failed', 'error'); }
  } catch(e){
    showToast && showToast('Test push failed', 'error');
  }
};
window.markUserOpen = async function(){
  try {
    if (!window.supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    const uid = (session && session.user && session.user.id) || null;
    if (!uid) return;
    await supabase.from('user_activity').upsert({ user_id: uid, last_open_at: new Date().toISOString() }, { onConflict: 'user_id' });
  } catch {}
};
document.addEventListener('DOMContentLoaded', function(){
  try {
    const dev = localStorage.getItem('tuba-dev-tools') === '1';
    window.__devToolsEnabled = dev;
    if (typeof updateSideNavToolsVisibility === 'function') updateSideNavToolsVisibility();
  } catch {}
  try { if (typeof updateQuickButtonsState === 'function') updateQuickButtonsState(); } catch {}
  try { if (typeof markUserOpen === 'function') markUserOpen(); } catch {}
});
document.addEventListener('DOMContentLoaded', function(){
  const floatingBtn = document.querySelector('button[title="📱 Install App"]');
  const iosBtn = document.getElementById('iosInstallButton');
  if (!floatingBtn && !iosBtn) return;
  if (floatingBtn) floatingBtn.style.display = 'none';
  if (iosBtn) iosBtn.style.display = 'none';
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  let deferredPrompt;
  function isStandaloneNow(){
    try {
      return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone === true);
    } catch {
      return false;
    }
  }
  function updateInstallButtons(){
    const standalone = isStandaloneNow();
    if (floatingBtn) {
      const showFloating = !standalone && (isIOS || !!deferredPrompt);
      floatingBtn.style.display = showFloating ? 'block' : 'none';
    }
    if (iosBtn) {
      iosBtn.style.display = (isIOS && !standalone) ? 'inline-flex' : 'none';
    }
  }
  updateInstallButtons();
  try {
    const mm = window.matchMedia && window.matchMedia('(display-mode: standalone)');
    if (mm && typeof mm.addEventListener === 'function') {
      mm.addEventListener('change', updateInstallButtons);
    } else if (mm && typeof mm.addListener === 'function') {
      mm.addListener(updateInstallButtons);
    }
  } catch {}
  window.addEventListener('visibilitychange', updateInstallButtons);
  window.addEventListener('pageshow', updateInstallButtons);
  window.addEventListener('focus', updateInstallButtons);
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    deferredPrompt = e;
    updateInstallButtons();
  });
  window.addEventListener('appinstalled', function(){
    try { localStorage.setItem('tuba_pwa_installed', '1'); } catch {}
    deferredPrompt = null;
    updateInstallButtons();
  });
  if (floatingBtn) {
    floatingBtn.addEventListener('click', async function(){
      if (isIOS) {
        const sidebarBtn = document.getElementById('iosInstallButton');
        if (sidebarBtn) {
          sidebarBtn.click();
        } else {
          const link = document.createElement('a');
          link.href = '/tuba.mobileconfig';
          link.setAttribute('download', 'tuba.mobileconfig');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
        try {
          const choice = await deferredPrompt.userChoice;
          if (choice && choice.outcome === 'accepted') {
            try { localStorage.setItem('tuba_pwa_installed', '1'); } catch {}
          }
        } catch {}
        deferredPrompt = null;
      } else {
        alert('To install, tap Share and select "Add to Home Screen".');
      }
      updateInstallButtons();
    });
  }
});
function clearBadge(){ try { if ('clearAppBadge' in navigator) { navigator.clearAppBadge().catch(()=>{}); } } catch {} }
window.addEventListener('load', clearBadge);
document.addEventListener('visibilitychange', function(){ try { if (document.visibilityState === 'visible') { clearBadge(); } } catch {} });
