import { state } from './state.js';
import { showToast } from './ui.js';

export function initSupabase() {
  try {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') { 
      window.syncEnabled = false; 
      return; 
    }
    window.supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, multiTab: true, storageKey: 'tuba-auth-token', storage: window.localStorage }
    });
    window.supabaseClient = window.supabase;
    window.supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && window.currentUser && window.currentUser.id === session.user.id) {
        console.log('Session confirmed (background focus), skipping re-init.');
        return;
      }
      if (event === 'SIGNED_IN' && session) {
        window.currentUser = session.user; 
        window.syncEnabled = true; 
        if (window.ensureOwnershipOnSignIn && window.ensureOwnershipOnSignIn(session.user.id) === false) return; 
        window.autoCloudPullDone = false; 
        try { 
          if (window.updateSyncIndicator) window.updateSyncIndicator('synced'); 
        } catch {} 
        try { 
          if (window.maybeAutoPullCloudData) window.maybeAutoPullCloudData(); 
        } catch {} 
        try { 
          if (window.sendAuthToSW) window.sendAuthToSW(session); 
        } catch {} 
        try { 
          if (window.setupPaidRealtime) window.setupPaidRealtime(); 
          if (window.startPaidPolling) window.startPaidPolling(); 
        } catch {} 
        try { 
          if (typeof window.switchTab === 'function') { 
            window.switchTab('sales'); 
          } 
        } catch {}
      } else if (event === 'SIGNED_OUT') {
        window.currentUser = null; 
        window.syncEnabled = false; 
        window.autoCloudPullDone = false; 
        try { 
          if (window.updateSyncIndicator) window.updateSyncIndicator('offline'); 
        } catch {} 
        try { 
          if (window.render) window.render(); 
        } catch {}
      } else if (event === 'TOKEN_REFRESHED' && session) {
        window.currentUser = session.user; 
        window.syncEnabled = true; 
        if (window.ensureOwnershipOnSignIn && window.ensureOwnershipOnSignIn(session.user.id) === false) return; 
        window.autoCloudPullDone = false; 
        try { 
          if (window.maybeAutoPullCloudData) window.maybeAutoPullCloudData(); 
        } catch {} 
        try { 
          if (window.sendAuthToSW) window.sendAuthToSW(session); 
        } catch {} 
        try { 
          if (window.setupPaidRealtime) window.setupPaidRealtime(); 
          if (window.startPaidPolling) window.startPaidPolling(); 
        } catch {}
      }
    });
  } catch (error) { 
    console.error('Supabase init error:', error); 
    window.syncEnabled = false; 
  }
}

export async function restoreSession() { 
  try { 
    if (!window.supabase || !window.supabase.auth) return false; 
    if (state && state.autoAuthDisabled) return false; 
    const { data: { session } } = await window.supabase.auth.getSession(); 
    if (session) { 
      window.currentUser = session.user; 
      window.syncEnabled = true; 
      if (window.ensureOwnershipOnSignIn && window.ensureOwnershipOnSignIn(session.user.id) === false) return false; 
      try { 
        if (window.updateSyncIndicator) window.updateSyncIndicator('synced'); 
      } catch {} 
      try { 
        if (window.updateAuthBanner) window.updateAuthBanner(); 
      } catch {} 
      try { 
        if (window.sendAuthToSW) window.sendAuthToSW(session); 
      } catch {} 
      try { 
        if (navigator.onLine) { 
          if (window.loadUserProfile) await window.loadUserProfile(); 
        } 
      } catch {} 
      try { 
        if (window.loadPrefetchedDataFromSW) await window.loadPrefetchedDataFromSW(); 
      } catch {} 
      if (navigator.onLine) { 
        try { 
          Promise.resolve().then(() => {
            if (window.pullDataFromSupabase) window.pullDataFromSupabase();
          }).catch((e) => { 
            console.warn('Cloud pull after restore failed:', e); 
          }); 
        } catch (e) { 
          console.warn('Cloud pull after restore failed:', e); 
        } 
      } 
      try { 
        if (typeof window.switchTab === 'function') { 
          window.switchTab('sales'); 
        } 
      } catch {} 
      return true; 
    } 
    return false; 
  } catch (error) { 
    console.error('Restore session error:', error); 
    try { 
      if (String((error && error.message) || '').toLowerCase().includes('invalid refresh token')) { 
        await window.supabase.auth.signOut(); 
        window.currentUser = null; 
        window.syncEnabled = false; 
        try { 
          if (window.updateSyncIndicator) window.updateSyncIndicator('offline'); 
        } catch {} 
      } 
    } catch {} 
    return false; 
  } 
}

export async function loadUserProfile() {
  const localProfile = state.userProfile;
  const hasLocalProfile = localProfile && localProfile.businessName && localProfile.phone && localProfile.address;
  if (!window.syncEnabled || !window.currentUser) {
    if (!hasLocalProfile) { 
      state.profileEditMode = true; 
      state.profileLoaded = false; 
    } else { 
      state.profileEditMode = false; 
      state.profileLoaded = true; 
    }
    return;
  }
  try {
    const { data } = await window.supabase.from('user_profiles').select('*').eq('user_id', window.currentUser.id).single();
    if (data && typeof data.is_paid !== 'undefined') { 
      window.isPaid = data.is_paid === true; 
    }
    if (!data) {
      window.isPaid = false;
      const overlay = document.getElementById('paywall-overlay');
      const idSpan = document.getElementById('paywall-user-id');
      if (overlay) {
        overlay.style.display = 'flex';
        if (idSpan && window.currentUser) idSpan.textContent = window.currentUser.email;
        try { 
          if (window.hardenPaywall) window.hardenPaywall(); 
        } catch {}
      }
      window.__paywallInitialized = true;
      document.body.style.overflow = 'hidden';
      try { 
        await window.supabase.from('user_profiles').upsert({ 
          user_id: window.currentUser.id, 
          email: (window.currentUser && window.currentUser.email) || '', 
          is_paid: false 
        }, { onConflict: 'user_id' }); 
      } catch {}
      return;
    }
    if (data) {
      state.userProfile = {
        businessName: data.business_name || '',
        phone: data.phone || '',
        address: data.address || '',
        email: data.email || '',
        currency: data.currency || 'USD',
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: data.date_format || 'MM/DD/YYYY',
        theme: data.theme || 'light',
        isPaid: data.is_paid === true,
        role: data.role || 'cashier',
        capabilities: data.capabilities || {}
      };
      state.profileLoaded = true;
      state.profileEditMode = false;
      try { 
        if (window.setCurrency) window.setCurrency(data.currency || 'USD'); 
      } catch {}
      try { 
        if (window.applyTheme) window.applyTheme(data.theme || 'light'); 
      } catch {}
      window.isPaid = data.is_paid === true;
      if (window.isPaid) {
        const overlay = document.getElementById('paywall-overlay');
        if (overlay) overlay.style.display = 'none';
        document.body.style.overflow = '';
        try { 
          if (window.render) window.render(); 
        } catch {}
      }
    }
  } catch (err) {
    console.error('loadUserProfile error:', err);
    if (!hasLocalProfile) {
      state.profileEditMode = true;
      state.profileLoaded = false;
    }
  }
}

export function setupPaidRealtime() {
  try {
    if (!window.supabase || !window.currentUser) return;
    if (window.paidChannel) { 
      try { 
        window.supabase.removeChannel(window.paidChannel); 
      } catch {} 
    }
    window.paidChannel = window.supabase
      .channel('user-profile-paid')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_profiles', 
        filter: 'user_id=eq.' + window.currentUser.id 
      }, function(payload) {
        try {
          var row = payload && payload.new ? payload.new : null;
          if (row && row.is_paid === true) {
            window.isPaid = true;
            var overlay = document.getElementById('paywall-overlay'); 
            if (overlay) overlay.style.display = 'none';
            document.body.style.overflow = '';
            try { 
              if (window.render) window.render(); 
            } catch {}
          }
        } catch {}
      })
      .subscribe();
  } catch {}
}

export function startPaidPolling() {
  try {
    if (window.paidPoll) { 
      try { 
        clearInterval(window.paidPoll); 
      } catch {} 
    }
    window.paidPoll = setInterval(async function() {
      try {
        if (!window.supabase || !window.currentUser) return;
        const { data } = await window.supabase.from('user_profiles').select('is_paid').eq('user_id', window.currentUser.id).single();
        if (data && data.is_paid === true && !window.isPaid) {
          window.isPaid = true;
          const overlay = document.getElementById('paywall-overlay');
          if (overlay) overlay.style.display = 'none';
          document.body.style.overflow = '';
          try { 
            if (window.render) window.render(); 
          } catch {}
        }
      } catch {}
    }, 30000);
  } catch {}
}

window.initSupabase = initSupabase;
window.restoreSession = restoreSession;
window.loadUserProfile = loadUserProfile;
window.setupPaidRealtime = setupPaidRealtime;
window.startPaidPolling = startPaidPolling;