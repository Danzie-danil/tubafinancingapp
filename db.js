(() => {
  const DB_NAME = 'tuba-indexdb';
  const DB_VERSION = 1;
  const STORES = [
    'app_state',
    'products',
    'categories',
    'sales',
    'expenses',
    'income',
    'customers',
    'invoices',
    'receipts',
    'inventory',
    'notes',
    'transactions',
    'unpaid_entries',
    'transaction_floats',
    'settings',
    'inventory_purchase_periods',
    'inventory_purchases',
    'loans',
    'loan_payments',
    'tithing',
    'tags',
    'assets',
    'maintenance'
  ];
  function slugify(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }
  function computeId(store, obj) {
    switch (store) {
      case 'sales': return obj.id || `S-${obj.timestamp}`;
      case 'expenses': return obj.id || `E-${obj.timestamp}`;
      case 'income': return obj.id || `I-${obj.timestamp}`;
      case 'notes': return obj.id || obj.timestamp;
      case 'receipts': return obj.id || obj.timestamp;
      case 'invoices': return obj.number;
      case 'customers': return obj.id || `C-${slugify(obj.name)}_${String(obj.email || '')}`;
      case 'products': return obj.id || `P-${slugify(obj.name)}_${slugify(obj.category || '')}`;
      case 'categories': return obj.name;
      case 'inventory': return obj.id || String(obj.product_name || obj.name);
      case 'transactions': return obj.id || obj.timestamp;
      case 'unpaid_entries': return obj.id || obj.timestamp;
      case 'assets': return obj.id || obj.timestamp;
      case 'maintenance': return obj.id || obj.timestamp;
      case 'inventory_purchases': return obj.id || obj.timestamp;
      case 'inventory_purchase_periods': return obj.id || (obj.period_number != null ? obj.period_number : obj.number);
      case 'loan_payments': return obj.id || obj.timestamp;
      case 'loans': return obj.id || obj.timestamp;
      case 'tithing': return obj.id || obj.month_key;
      case 'transaction_floats': return obj.id || obj.channel;
      case 'settings': return 'settings';
      case 'tags': return obj.id || obj.tag_name;
      case 'app_state': return 'state';
      default: return obj.id || String(obj.timestamp || Date.now());
    }
  }
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        const db = req.result;
        STORES.forEach((name) => {
          try {
            if (!db.objectStoreNames.contains(name)) {
              db.createObjectStore(name, { keyPath: 'id' });
            }
          } catch {}
        });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('idb open')); };
    });
  }
  async function withStore(store, mode, fn) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const st = tx.objectStore(store);
      Promise.resolve().then(() => fn(st)).then(resolve).catch(reject);
    });
  }
  async function get(store, id) {
    return withStore(store, 'readonly', (st) => {
      return new Promise((resolve, reject) => {
        const req = st.get(id);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error || new Error('idb get')); };
      });
    });
  }
  async function put(store, obj) {
    const id = computeId(store, obj);
    const rec = { ...obj, id };
    return withStore(store, 'readwrite', (st) => {
      return new Promise((resolve, reject) => {
        const req = st.put(rec);
        req.onsuccess = function () { resolve(true); };
        req.onerror = function () { reject(req.error || new Error('idb put')); };
      });
    });
  }
  async function getAll(store, includeDeleted = false) {
    return withStore(store, 'readonly', (st) => {
      return new Promise((resolve, reject) => {
        const req = st.getAll();
        req.onsuccess = function () {
          const rows = Array.isArray(req.result) ? req.result : [];
          resolve(includeDeleted ? rows : rows.filter((r) => !(r && r.deleted === true)));
        };
        req.onerror = function () { reject(req.error || new Error('idb getAll')); };
      });
    });
  }
  async function softDelete(store, id) {
    const rec = await get(store, id);
    if (!rec) return false;
    rec.deleted = true;
    rec.last_updated = Date.now();
    await put(store, rec);
    return true;
  }
  async function bulkPut(store, arr) {
    if (!Array.isArray(arr) || arr.length === 0) return true;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const st = tx.objectStore(store);
      let i = 0;
      function step() {
        if (i >= arr.length) { resolve(true); return; }
        const obj = arr[i++];
        const id = computeId(store, obj);
        const rec = { ...obj, id };
        const req = st.put(rec);
        req.onsuccess = function () { step(); };
        req.onerror = function () { reject(req.error || new Error('idb bulkPut')); };
      }
      step();
    });
  }
  async function loadAllIntoState(state) {
    const map = {
      products: 'products',
      categories: 'categories',
      sales: 'sales',
      expenses: 'expenses',
      income: 'income',
      customers: 'customers',
      invoices: 'invoices',
      receipts: 'receipts',
      inventory: 'inventory',
      notes: 'notes',
      transactions: 'transactions',
      unpaid_entries: 'unpaidEntries',
      transaction_floats: 'transactionFloats',
      settings: 'settings',
      tags: 'tags',
      inventory_purchase_periods: 'inventoryPurchaseCycles',
      inventory_purchases: 'inventoryPurchases',
      loans: 'loans',
      loan_payments: 'loanPayments',
      tithing: 'tithingRecords',
      assets: 'assets',
      maintenance: 'maintenance'
    };
    for (const [store, key] of Object.entries(map)) {
      try {
        const rows = await getAll(store, false);
        if (key === 'inventory') {
          const inv = {};
          rows.forEach((r) => {
            const name = String(r.product_name || r.name || r.id);
            const stock = Number(r.stock || 0);
            const minAlert = Number(r.min_alert || r.minAlert || 5);
            inv[name] = { stock, minAlert };
          });
          state.inventory = inv;
        } else if (key === 'transactionFloats') {
          const obj = {};
          rows.forEach((r) => {
            const ch = String(r.channel || '');
            obj[ch] = {
              initialAccount: Number(r.initial_account_float || r.initialAccount || 0),
              initialCash: Number(r.initial_cash_float || r.initialCash || 0)
            };
          });
          state.transactionFloats = obj;
        } else if (key === 'tags') {
          const names = [];
          const colors = {};
          rows.forEach((r) => {
            const name = String(r.tag_name || r.name || '').trim();
            if (!name) return;
            names.push(name);
            if (r.color) colors[name] = r.color;
          });
          state.tags = Array.from(new Set(names));
          state.tagColors = { ...(state.tagColors || {}), ...colors };
        } else if (key === 'settings') {
          const s = rows.find((r) => r && r.id === 'settings') || null;
          if (s) {
            state.currencyCode = s.currency_code || state.currencyCode;
            state.currencySymbol = s.currency_symbol || state.currencySymbol;
            state.dailyTarget = s.daily_target != null ? s.daily_target : state.dailyTarget;
            state.monthlyTarget = s.monthly_target != null ? s.monthly_target : state.monthlyTarget;
            state.defaultTaxRate = s.default_tax_rate != null ? s.default_tax_rate : state.defaultTaxRate;
            state.cogsMethod = s.cogs_method || state.cogsMethod;
          }
        } else if (key === 'tithingRecords') {
          const obj = {};
          rows.forEach((r) => {
            const mk = String(r.month_key || r.id);
            obj[mk] = {
              monthKey: mk,
              base: Number(r.base || 0),
              due: Number(r.due || 0),
              paid: Number(r.paid || 0),
              history: Array.isArray(r.history) ? r.history : []
            };
          });
          state.tithingRecords = obj;
        } else {
          state[key] = rows;
        }
      } catch {}
    }
    return state;
  }
  window.tubaDB = { STORES, openDB, get, put, getAll, softDelete, bulkPut, loadAllIntoState };
})();
export const tubaDB = window.tubaDB;
