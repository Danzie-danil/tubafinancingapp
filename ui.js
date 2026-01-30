import { state } from './state.js';

export function showToast(message, type = "info", actionText = null, actionHandler = null, durationMs = 3000, onClickHandler = null) {
  try {
    const msg = String(message || '');
    const allowBootMsg = msg.toLowerCase().includes('loading your data');
    if (window.__bootSilenceToasts && !allowBootMsg) return;
  } catch { }
  try {
    const msgLower = String(message || '').toLowerCase();
    const isPinRequiredMsg = msgLower.startsWith('delete failed: pin required') || msgLower.startsWith('edit failed: pin required');
    if (isPinRequiredMsg && window.__pinLastFailure && window.__pinLastFailure !== 'cancel') {
      window.__pinLastFailure = null;
      return;
    }
    if (isPinRequiredMsg && window.__pinLastFailure === 'cancel') {
      window.__pinLastFailure = null;
    }
  } catch { }
  let bar = document.getElementById('toastBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'toastBar';
    bar.className = 'toast-bar';
    document.body.appendChild(bar);
  }
  try {
    const msgLower = String(message || '').toLowerCase();
    if (msgLower.includes('loading your data')) {
      Array.from(bar.querySelectorAll('.toast')).forEach(t => { try { t.remove(); } catch {} });
    }
  } catch { }

  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  const key = (type + ':' + message).toLowerCase();
  t.setAttribute('data-key', key);
  try {
    const existing = Array.from(bar.querySelectorAll('.toast')).find(el => el.getAttribute('data-key') === key);
    if (existing) {
      existing.classList.remove('show');
      setTimeout(() => existing.remove(), 0);
    }
  } catch { }
  const span = document.createElement('span');
  span.textContent = message;
  t.appendChild(span);
  if (actionText && typeof actionHandler === 'function') {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = actionText;
    btn.addEventListener('click', actionHandler);
    t.appendChild(btn);
  }
  if (typeof onClickHandler === 'function') {
    t.style.cursor = 'pointer';
    t.addEventListener('click', onClickHandler);
  }
  bar.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  if (type !== 'error' && type !== 'warning') {
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 300);
    }, durationMs);
  }
  return t;
}

export function openModalById(id) {
  const el = document.getElementById(id);
  if (!el) return;
  try { el.classList.add('show'); el.style.display = ''; } catch {}
  try { window.__updateModalOverflow && window.__updateModalOverflow(); } catch {}
}

export function closeModalById(id) {
  const el = document.getElementById(id);
  if (!el) return;
  try { el.classList.remove('show'); el.style.display = 'none'; } catch {}
  try { window.__updateModalOverflow && window.__updateModalOverflow(); } catch {}
}

export function closeAllModals() {
  try {
    const modals = Array.from(document.querySelectorAll('.modal'));
    modals.forEach(function(m) {
      try { m.classList.remove('show'); } catch {}
      try { m.style.display = 'none'; } catch {}
    });
    try { window.__updateModalOverflow && window.__updateModalOverflow(); } catch {}
  } catch {}
}

export function openPinSetModal() {
  try { resetPinSetModalFields(); } catch {}
  openModalById('pinSetModal');
  try {
    const grp = document.getElementById('pinSetCurrentGroup');
    const input0 = document.getElementById('pinSetInputCurrent');
    const input = document.getElementById('pinSetInput');
    const hasPin = !!state.securityPinHash;
    if (grp) grp.style.display = hasPin ? '' : 'none';
    if (input0) {
      input0.value = '';
      input0.type = 'password';
      input0.disabled = !hasPin;
    }
    const t0 = document.getElementById('pinSetToggleCurrent');
    if (t0) t0.style.display = 'none';
    if (input0 && hasPin) { input0.focus(); }
    else if (input) { input.focus(); }
  } catch {}
}

export function promptForPin() {
  return new Promise(resolve => {
    const modal = document.getElementById('pinEntryModal');
    const input = document.getElementById('pinEntryInput');
    const btn = document.getElementById('pinEntryConfirm');
    const cancelBtn = document.getElementById('pinEntryCancel');
    if (modal && input && btn) {
      openModalById('pinEntryModal'); input.value = ''; input.focus();
      let handlerFired = false;
      let closeModalHandler = null;
      const handler = async function() {
        if (handlerFired) return;
        handlerFired = true;
        const raw = String(input.value || '');
        const val = raw.replace(/[^0-9]/g, '').slice(0, 4);
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
      const v = (window.prompt('Enter 4-digit PIN') || '').replace(/[^0-9]/g, '').slice(0, 4);
      resolve(v);
    }
  });
}

export function promptToSetPin() {
  return new Promise(resolve => {
    const modal = document.getElementById('pinSetModal');
    const input0 = document.getElementById('pinSetInputCurrent');
    const input = document.getElementById('pinSetInput');
    const input2 = document.getElementById('pinSetInputConfirm');
    const confirmBtn = document.getElementById('pinSetConfirm');
    const cancelBtn = document.getElementById('pinSetCancel');
    if (modal && input && input2 && confirmBtn) {
      const hasPin = !!state.securityPinHash;
      const grp = document.getElementById('pinSetCurrentGroup');
      if (grp) grp.style.display = hasPin ? '' : 'none';
      if (input0) input0.disabled = !hasPin;
      openModalById('pinSetModal');
      if (input0) input0.value = '';
      input.value = '';
      input2.value = '';
      if (input0 && hasPin) { input0.focus(); } else { input.focus(); }
      let handlerFired = false;
      let closeModalHandler = null;
      const handler = async function() {
        if (handlerFired) return;
        const existing = state.securityPinHash || null;
        const v0 = String(input0 && input0.value || '').trim();
        const v1 = String(input.value || '').replace(/[^0-9]/g, '').slice(0, 4);
        const v2 = String(input2.value || '').replace(/[^0-9]/g, '').slice(0, 4);
        if (existing) {
          if (!v0) { showToast('Enter your main password', 'error'); return; }
          if (!window.supabase || !window.currentUser) { showToast('Sign in to verify password', 'error'); return; }
          const { error } = await window.supabase.auth.signInWithPassword({ email: String(window.currentUser && window.currentUser.email || ''), password: v0 });
          if (error) { showToast('Invalid password', 'error'); return; }
        }
        if (!/^\d{4}$/.test(v1) || !/^\d{4}$/.test(v2)) { showToast('Enter 4 digits', 'error'); return; }
        if (v1 !== v2) { showToast('Pins do not match', 'error'); return; }
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
      const v = (window.prompt('Create 4-digit PIN') || '').replace(/[^0-9]/g, '').slice(0, 4);
      resolve(v);
    }
  });
}

export function resetPinSetModalFields() {
  try {
    const grp = document.getElementById('pinSetCurrentGroup');
    const input0 = document.getElementById('pinSetInputCurrent');
    const input = document.getElementById('pinSetInput');
    const input2 = document.getElementById('pinSetInputConfirm');
    const t0 = document.getElementById('pinSetToggleCurrent');
    const t1 = document.getElementById('pinSetToggle');
    const t2 = document.getElementById('pinSetToggleConfirm');
    const hasPin = !!state.securityPinHash;
    if (grp) grp.style.display = hasPin ? '' : 'none';
    if (input0) { input0.value = ''; input0.type = 'password'; }
    if (input0) input0.disabled = !hasPin;
    if (input) { input.value = ''; input.type = 'password'; }
    if (input2) { input2.value = ''; input2.type = 'password'; }
    if (t0) t0.style.display = 'none';
    if (t1) t1.style.display = 'none';
    if (t2) t2.style.display = 'none';
  } catch {}
}

export function render() {
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
}

window.showToast = showToast;
window.openModalById = openModalById;
window.closeModalById = closeModalById;
window.closeAllModals = closeAllModals;
window.openPinSetModal = openPinSetModal;
window.promptForPin = promptForPin;
window.promptToSetPin = promptToSetPin;
window.resetPinSetModalFields = resetPinSetModalFields;
window.render = render;