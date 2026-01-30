import { state } from './state.js';
import { showToast } from './ui.js';

const DEQUEUE_KEY = 'tuba-delete-queue-v1';
const UPSERT_QUEUE_KEY = 'tuba-upsert-queue-v1';

export const deleteQueue = {
  items: [],
  load() { 
    try { 
      const raw = localStorage.getItem(DEQUEUE_KEY); 
      this.items = raw ? JSON.parse(raw) : []; 
    } catch { 
      this.items = []; 
    } 
  },
  save() { 
    try { 
      localStorage.setItem(DEQUEUE_KEY, JSON.stringify(this.items)); 
    } catch {} 
  },
  enqueue(table, keySource) { 
    const owner = (window.currentUser && window.currentUser.id) || (window.getLocalOwnerUid ? window.getLocalOwnerUid() : null) || null; 
    this.items.push({ 
      id: `${table}-del-${Date.now()}-${Math.random().toString(36).slice(2)}`, 
      table, 
      keySource, 
      owner_uid: owner, 
      attempts: 0, 
      nextTryAt: Date.now() + 1000 
    }); 
    this.save(); 
  },
  backoffDelay(attempts) { 
    const schedule = [1000, 2000, 5000, 10000, 30000, 60000]; 
    return schedule[Math.min(attempts, schedule.length - 1)]; 
  },
  buildDeleteKeys(table, src) {
    const k = {};
    switch (table) {
      case 'sales': k.timestamp = src.timestamp; break;
      case 'expenses': 
        if (src.id != null) k.id = src.id; 
        else k.timestamp = src.timestamp; 
        break;
      case 'notes': 
      case 'transactions': 
      case 'receipts': 
      case 'unpaid_entries': 
      case 'assets': 
      case 'maintenance': 
        k.timestamp = src.timestamp; 
        break;
      case 'invoices': k.number = src.number; break;
      case 'customers': 
        k.name = src.name; 
        k.email = src.email || ''; 
        break;
      case 'products': 
        k.name = src.name; 
        k.category = src.category || ''; 
        break;
      case 'categories': 
        k.name = typeof src === 'string' ? src : (src.name || src); 
        break;
      case 'inventory': 
        k.product_name = src.product_name || src.name; 
        break;
      case 'inventory_purchases': 
        k.timestamp = src.timestamp; 
        break;
      case 'inventory_purchase_periods': 
        k.period_number = src.period_number || src.cycleNumber || src.number; 
        break;
      case 'loans': 
        k.timestamp = src.timestamp; 
        break;
      case 'loan_payments': 
        k.timestamp = src.timestamp; 
        break;
      case 'tithing': 
        k.month_key = src.month_key || src.monthKey; 
        break;
      case 'tags': 
        k.tag_name = src.tag_name || src.name; 
        break;
      default: 
        if (src.timestamp) k.timestamp = src.timestamp; 
        break;
    }
    return k;
  },
  async process() {
    if (!navigator.onLine || !window.syncEnabled || !window.currentUser) return;
    if (!Array.isArray(this.items) || this.items.length === 0) return;
    const now = Date.now();
    for (const item of [...this.items]) {
      if (item.nextTryAt && item.nextTryAt > now) continue;
      let started = false;
      try {
        if ((item.owner_uid || '') !== (window.currentUser && window.currentUser.id || '')) { 
          this.items = this.items.filter(q => q.id !== item.id); 
          this.save(); 
          if (window.handleOwnerMismatch) window.handleOwnerMismatch(window.currentUser.id); 
          continue; 
        }
        if (!window.requireCapability || !window.requireCapability('delete')) continue;
        if (!window.isPaid && item.table !== 'user_profiles' && item.table !== 'tithing') continue;
        started = true; 
        if (window.cloudSyncStart) window.cloudSyncStart();
        const keys = this.buildDeleteKeys(item.table, item.keySource);
        const payload = { ...keys, deleted: true, user_id: window.currentUser.id };
        const conflict = window.conflictTargets && window.conflictTargets[item.table];
        const { error } = conflict
          ? await window.supabase.from(item.table).upsert(payload, { onConflict: conflict })
          : await window.supabase.from(item.table).upsert(payload);
        if (error) throw error;
        this.items = this.items.filter(q => q.id !== item.id);
        this.save();
        if (window.auditLog) window.auditLog('delete', item.table, item.keySource, null);
      } catch (err) {
        item.attempts = (item.attempts || 0) + 1;
        item.nextTryAt = Date.now() + this.backoffDelay(item.attempts);
        this.save();
      } finally {
        if (started && window.cloudSyncEnd) window.cloudSyncEnd();
      }
    }
  }
};

export const upsertQueue = {
  items: [],
  load() { 
    try { 
      const raw = localStorage.getItem(UPSERT_QUEUE_KEY); 
      this.items = raw ? JSON.parse(raw) : []; 
    } catch { 
      this.items = []; 
    } 
  },
  save() { 
    try { 
      localStorage.setItem(UPSERT_QUEUE_KEY, JSON.stringify(this.items)); 
    } catch {} 
  },
  enqueue(table, payload) {
    const conflict = window.conflictTargets && window.conflictTargets[table] || null;
    const owner = (window.currentUser && window.currentUser.id) || (window.getLocalOwnerUid ? window.getLocalOwnerUid() : null) || null;
    this.items.push({ 
      id: `${table}-${Date.now()}-${Math.random().toString(36).slice(2)}`, 
      table, 
      payload, 
      conflict, 
      owner_uid: owner, 
      attempts: 0, 
      nextTryAt: Date.now() + 1000 
    });
    this.save();
  },
  backoffDelay(attempts) { 
    const schedule = [1000, 2000, 5000, 10000, 30000, 60000]; 
    return schedule[Math.min(attempts, schedule.length - 1)]; 
  },
  async process() {
    if (!navigator.onLine || !window.syncEnabled || !window.currentUser) return;
    if (!Array.isArray(this.items) || this.items.length === 0) return;
    const now = Date.now();
    for (const item of [...this.items]) {
      if (item.nextTryAt && item.nextTryAt > now) continue;
      let started = false;
      try {
        if ((item.owner_uid || '') !== (window.currentUser && window.currentUser.id || '')) { 
          this.items = this.items.filter(q => q.id !== item.id); 
          this.save(); 
          if (window.handleOwnerMismatch) window.handleOwnerMismatch(window.currentUser.id); 
          continue; 
        }
        if (!window.isPaid && item.table !== 'user_profiles' && item.table !== 'tithing') continue;
        if (!window.canUpsertTable || !window.canUpsertTable(item.table)) continue;
        const data = { ...item.payload, user_id: window.currentUser.id };
        if (item.table === 'products') { data.category = data.category || ''; }
        started = true; 
        if (window.cloudSyncStart) window.cloudSyncStart();
        if (item.conflict) {
          const { error } = await window.supabase.from(item.table).upsert(data, { onConflict: item.conflict });
          if (error) throw error;
        } else {
          const { error } = await window.supabase.from(item.table).upsert(data);
          if (error) throw error;
        }
        this.items = this.items.filter(q => q.id !== item.id);
        this.save();
        if (window.auditLog) window.auditLog('upsert', item.table, item.payload, data);
      } catch (err) {
        item.attempts = (item.attempts || 0) + 1;
        item.nextTryAt = Date.now() + this.backoffDelay(item.attempts);
        this.save();
      } finally {
        if (started && window.cloudSyncEnd) window.cloudSyncEnd();
      }
    }
  }
};

export function initSync() {
  deleteQueue.load();
  upsertQueue.load();
  setInterval(() => { 
    try { 
      deleteQueue.process(); 
    } catch {} 
  }, 30000);
  setInterval(() => { 
    try { 
      upsertQueue.process(); 
    } catch {} 
  }, 30000);
  window.addEventListener('online', () => { 
    try { 
      deleteQueue.process(); 
    } catch {} 
  });
  window.addEventListener('online', () => { 
    try { 
      upsertQueue.process(); 
    } catch {} 
  });
  if (window.attemptCloudSync && typeof window.attemptCloudSync === 'function') {
    return window.attemptCloudSync();
  }
  return null;
}

window.deleteQueue = deleteQueue;
window.upsertQueue = upsertQueue;