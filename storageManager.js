(() => {
  async function loadAllIntoState(state) {
    if (!window.tubaDB || !state) return state;
    try {
      const snap = await window.tubaDB.get('app_state', 'state');
      if (snap && snap.data) {
        state = { ...state, ...snap.data };
      }
    } catch {}
    await window.tubaDB.loadAllIntoState(state);
    return state;
  }
  async function saveCollectionsFromState(state) {
    if (!window.tubaDB || !state) return;
    const bulk = [];
    const pushAll = (store, items) => {
      if (Array.isArray(items) && items.length) {
        bulk.push(window.tubaDB.bulkPut(store, items));
      }
    };
    pushAll('products', state.products);
    pushAll('categories', (state.categories || []).map((name) => ({ name })));
    pushAll('sales', state.sales);
    pushAll('expenses', state.expenses);
    pushAll('income', state.income);
    pushAll('customers', state.customers);
    pushAll('invoices', state.invoices);
    pushAll('receipts', state.receipts);
    pushAll('notes', state.notes);
    pushAll('transactions', state.transactions);
    pushAll('unpaid_entries', state.unpaidEntries);
    pushAll('assets', state.assets);
    pushAll('maintenance', state.maintenance);
    pushAll('inventory_purchase_periods', state.inventoryPurchaseCycles);
    pushAll('inventory_purchases', state.inventoryPurchases);
    pushAll('loans', state.loans);
    pushAll('loan_payments', state.loanPayments);
    const inv = state.inventory || {};
    const invRows = Object.entries(inv).map(([name, rec]) => ({
      product_name: name,
      stock: Number(rec.stock || 0),
      min_alert: Number(rec.minAlert || 5)
    }));
    if (invRows.length) bulk.push(window.tubaDB.bulkPut('inventory', invRows));
    const floats = state.transactionFloats || {};
    const floatRows = Object.entries(floats).map(([channel, rec]) => ({
      channel,
      initial_account_float: Number(rec.initialAccount || rec.initial || 0),
      initial_cash_float: Number(rec.initialCash || 0)
    }));
    if (floatRows.length) bulk.push(window.tubaDB.bulkPut('transaction_floats', floatRows));
    const tithing = state.tithingRecords || {};
    const titRows = Object.entries(tithing).map(([monthKey, rec]) => ({
      month_key: rec.monthKey || monthKey,
      base: Number(rec.base || 0),
      due: Number(rec.due || 0),
      paid: Number(rec.paid || 0),
      history: Array.isArray(rec.history) ? rec.history : []
    }));
    if (titRows.length) bulk.push(window.tubaDB.bulkPut('tithing', titRows));
    if (Array.isArray(state.tags) && state.tags.length) {
      const tagRows = state.tags.map((tag) => ({
        tag_name: tag,
        color: (state.tagColors && state.tagColors[tag]) ? state.tagColors[tag] : '#999999'
      }));
      bulk.push(window.tubaDB.bulkPut('tags', tagRows));
    }
    const settings = {
      id: 'settings',
      currency_code: state.currencyCode,
      currency_symbol: state.currencySymbol,
      daily_target: state.dailyTarget,
      monthly_target: state.monthlyTarget,
      default_tax_rate: state.defaultTaxRate,
      cogs_method: state.cogsMethod
    };
    bulk.push(window.tubaDB.put('settings', settings));
    await Promise.allSettled(bulk);
  }
  async function saveStateSnapshot(state) {
    if (!window.tubaDB || !state) return;
    const payload = { id: 'state', data: state, saved_at: Date.now() };
    try { await window.tubaDB.put('app_state', payload); } catch {}
  }
  window.storageManager = { loadAllIntoState, saveCollectionsFromState, saveStateSnapshot };
})(); 
