import { state } from './state.js';
import { showToast } from './ui.js';

export function getStats() {
  const currentTime = Date.now();
  if (window.cachedStats && (currentTime - window.lastStatsUpdate) < 3000) { 
    return window.cachedStats; 
  }
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
  const today = (typeof window.getTodayDateString === 'function') ? window.getTodayDateString() : (new Date().toISOString().slice(0,10));
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
  const now = new Date(); 
  const monthStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
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
  const prodCostMap = {}; 
  (state.products || []).forEach(p => { prodCostMap[p.name] = Number(p.cost) || 0; });
  const inventoryStockValue = Object.entries(state.inventory || {}).reduce((sum, [name, inv]) => sum + ((Number(inv.stock) || 0) * (prodCostMap[name] || 0)), 0);
  const cashFromSales = (state.sales || []).reduce((sum, sale) => sum + ((sale && sale.status === 'unpaid') ? 0 : (Number(sale.totalPrice || 0))), 0);
  const loanInBusiness = (state.loans || []).filter(l => String(l && l.type || '').toLowerCase() === 'taken').reduce((sum, l) => sum + (Number(l && l.amount || 0)), 0);
  const loanOutBusiness = (state.loans || []).filter(l => String(l && l.type || '').toLowerCase() === 'given' && String((l && (l.moneySource || l.money_source) || '')).toLowerCase() === 'business').reduce((sum, l) => sum + (Number(l && l.amount || 0)), 0);
  const maintenanceBusinessTotal = (state.maintenance || []).filter(m => String((m && (m.moneySource || m.money_source) || 'business')).toLowerCase() === 'business').reduce((sum, m) => sum + (Number(m && m.amount || 0)), 0);
  const assetsBusinessTotal = (state.assets || []).filter(a => String((a && (a.moneySource || a.money_source) || 'business')).toLowerCase() === 'business').reduce((sum, a) => sum + (Number(a && a.cost || 0)), 0);
  const availableCapital = totalIncome + loanInBusiness + cashFromSales - expensesForCapital - loanOutBusiness - inventorySpendTotal - maintenanceBusinessTotal - assetsBusinessTotal;
  const monthNetProfit = monthProfit;
  const stats = {
    totalCapital, totalProfit, totalRevenue, totalExpenses, totalIncome, netProfit, 
    todayProfit, todayRevenue, todayExpenses, todayCapital,
    yesterdayProfit, yesterdayRevenue, yesterdayExpenses,
    monthProfit, monthRevenue, monthExpenses, monthNetProfit,
    availableCapital, inventoryStockValue, cashFromSales,
    totalInvoiced, totalPaid,
    loanInBusiness, loanOutBusiness, maintenanceBusinessTotal, assetsBusinessTotal,
    incomeAsCapital, expensesForCapital,
    allSalesRevenue
  };
  window.cachedStats = stats;
  window.lastStatsUpdate = currentTime;
  return stats;
}

export async function pushAllDataToSupabase(skipPin) {
  if (!window.syncEnabled || !window.currentUser) return; 
  try { 
    const uid = window.currentUser.id; 
    const prev = window.getLocalOwnerUid ? window.getLocalOwnerUid() : null; 
    if (prev && prev !== uid) { 
      if (window.handleOwnerMismatch) window.handleOwnerMismatch(uid); 
      return; 
    } 
  } catch {} 
  if (window.cloudSyncStart) window.cloudSyncStart(); 
  try {
    const pinSkip = !!skipPin || !!window.__pinInternalWrite;
    if (state && state.userProfile) { 
      const p = state.userProfile || {}; 
      const payload = { user_id: window.currentUser.id }; 
      var ev = (p.email || ((window.currentUser && window.currentUser.email) || '')); 
      if (p.businessName) payload.business_name = p.businessName; 
      if (ev) payload.email = ev; 
      if (p.phone) payload.phone = p.phone; 
      if (p.address) payload.address = p.address; 
      if (p.country) payload.country = p.country; 
      if (p.city) payload.city = p.city; 
      if (p.role) payload.role = p.role; 
      if (p.tinNumber) payload.tin_number = p.tinNumber; 
      if (p.blNumber) payload.business_license_number = p.blNumber; 
      if (typeof p.hasVAT === 'boolean') payload.has_vat = !!p.hasVAT; 
      if (p.hasVAT && p.vatNumber) payload.vat_number = p.vatNumber; 
      if (state.userLogoDataUrl) payload.logo_data = state.userLogoDataUrl; 
      if (state.userLogoMime) payload.logo_mime = state.userLogoMime; 
      const needPin = !!state.profileLoaded; 
      if (needPin && !pinSkip) { 
        if (window.requirePinForDestructive) {
          const ok = await window.requirePinForDestructive('profile'); 
          if (!ok) { 
            showToast('Profile update cancelled', 'error'); 
            return; 
          }
        }
      } 
      const { error: profErr } = await window.supabase.from('user_profiles').upsert(payload, { onConflict: 'user_id' }); 
      if (profErr) console.warn('Profile upsert skipped:', profErr.message || profErr); 
    }
    if (!window.isPaid) { 
      if (window.cloudSyncEnd) window.cloudSyncEnd(); 
      return; 
    }
    if ((state.products || []).length > 0) { 
      const productsData = state.products.map(p => ({ 
        user_id: window.currentUser.id, 
        name: p.name, 
        category: p.category || '', 
        cost: p.cost, 
        price: p.price, 
        has_stock: (p.hasStock === false) ? false : true, 
        sale_unit: p.saleUnit || null, 
        purchase_unit: p.purchaseUnit || null, 
        units_per_purchase: p.unitsPerPurchase || null 
      })); 
      await window.supabase.from('products').upsert(productsData, { onConflict: 'user_id,name,category' }); 
    }
    if ((state.categories || []).length > 0) {
      const kindMap = state.categoryKinds || {};
      const categoriesData = state.categories.map(c => {
        let kind = kindMap[c];
        if (!kind) {
          const prods = (state.products || []).filter(p => String(p.category || '') === String(c));
          const hasProd = prods.some(p => p.hasStock !== false);
          const hasServ = prods.some(p => p.hasStock === false);
          if (hasServ && !hasProd) kind = 'service';
          else if (hasProd && !hasServ) kind = 'product';
          else if (hasProd && hasServ) kind = 'mixed';
          else kind = 'product';
        }
        return { user_id: window.currentUser.id, name: c, kind };
      });
      await window.supabase.from('categories').upsert(categoriesData, { onConflict: 'user_id,name' });
    }
    if (Array.isArray(state.tags) && state.tags.length > 0) {
      const tagsData = state.tags.map(tag => ({
        user_id: window.currentUser.id,
        tag_name: tag,
        color: (state.tagColors && state.tagColors[tag]) ? state.tagColors[tag] : '#999999'
      }));
      await window.supabase.from('tags').upsert(tagsData, { onConflict: 'user_id,tag_name' });
    }
    if ((state.sales || []).length > 0) { 
      const salesData = state.sales.map(s => ({ 
        user_id: window.currentUser.id, 
        date: s.date, 
        time: s.time, 
        timestamp: s.timestamp, 
        product_name: s.productName, 
        customer: s.customer, 
        quantity: s.quantity, 
        cost_per_unit: s.costPerUnit, 
        price_per_unit: s.pricePerUnit, 
        total_cost: s.totalCost, 
        total_price: s.totalPrice, 
        profit: s.profit, 
        payment: s.payment, 
        status: s.status || 'paid', 
        category: s.category || '', 
        has_stock: (s.hasStock === false ? false : true), 
        tags: (Array.isArray(s.tags) ? s.tags.join(',') : (s.tags || null)) 
      })); 
      await window.supabase.from('sales').upsert(salesData, { onConflict: 'user_id,timestamp' }); 
    }
    if ((state.expenses || []).length > 0) { 
      const expensesData = state.expenses.map(e => ({ 
        user_id: window.currentUser.id, 
        date: e.date, 
        time: e.time, 
        timestamp: e.timestamp, 
        description: e.description, 
        category: e.category, 
        amount: e.amount, 
        payment: e.payment, 
        comment: e.comment || '', 
        tags: (Array.isArray(e.tags) ? e.tags.join(',') : (e.tags || null)) 
      })); 
      await window.supabase.from('expenses').upsert(expensesData, { onConflict: 'user_id,timestamp' }); 
    }
    if ((state.income || []).length > 0) { 
      const incomeData = state.income.map(i => ({ 
        user_id: window.currentUser.id, 
        date: i.date, 
        time: i.time, 
        timestamp: i.timestamp, 
        source: i.source, 
        amount: i.amount, 
        payment: i.payment, 
        comment: i.comment || '', 
        as_capital: (i.asCapital === true || i.as_capital === true), 
        include_in_tithing: !(i.includeTithing === false || i.include_in_tithing === false) 
      })); 
      await window.supabase.from('income').upsert(incomeData, { onConflict: 'user_id,timestamp' }); 
    }
    if ((state.notes || []).length > 0) { 
      const notesData = state.notes.map(n => ({ 
        user_id: window.currentUser.id, 
        title: n.title, 
        content: n.content, 
        date: n.date, 
        time: n.time, 
        timestamp: n.timestamp, 
        tags: (Array.isArray(n.tags) ? n.tags.join(',') : (n.tags || null)) 
      })); 
      await window.supabase.from('notes').upsert(notesData, { onConflict: 'user_id,timestamp' }); 
    }
    if ((state.customers || []).length > 0) { 
      const customersData = state.customers.map(c => ({ 
        user_id: window.currentUser.id, 
        name: c.name, 
        email: c.email || '', 
        phone: c.phone || '', 
        address: c.address || '', 
        total_purchases: c.totalPurchases || 0, 
        tags: (Array.isArray(c.tags) ? c.tags.join(',') : (c.tags || null)) 
      })); 
      await window.supabase.from('customers').upsert(customersData, { onConflict: 'user_id,name,email' }); 
    }
    if ((state.invoices || []).length > 0) { 
      const invoicesData = state.invoices.map(inv => ({ 
        user_id: window.currentUser.id, 
        number: inv.number, 
        customer: inv.customer, 
        date: inv.date, 
        due_date: inv.dueDate, 
        items: inv.items, 
        amount: inv.amount, 
        status: inv.status, 
        subtotal: inv.subtotal, 
        tax_rate: inv.taxRate, 
        tax_amount: inv.taxAmount, 
        currency_code: inv.currencyCode || state.currencyCode, 
        currency_symbol: inv.currencySymbol || state.currencySymbol 
      })); 
      await window.supabase.from('invoices').upsert(invoicesData, { onConflict: 'user_id,number' }); 
    }
    if ((state.receipts || []).length > 0) { 
      const receiptsData = state.receipts.map(r => ({ 
        user_id: window.currentUser.id, 
        number: r.number, 
        customer: r.customer, 
        customer_email: r.customerEmail || r.customer_email || '', 
        date: r.date, 
        time: r.time, 
        timestamp: r.timestamp, 
        description: r.description, 
        amount: r.amount, 
        payment_method: r.paymentMethod || r.payment_method || '', 
        currency_code: r.currencyCode || r.currency_code || state.currencyCode, 
        currency_symbol: r.currencySymbol || r.currency_symbol || state.currencySymbol 
      })); 
      await window.supabase.from('receipts').upsert(receiptsData, { onConflict: 'user_id,timestamp' }); 
    }
    if ((state.inventory || {}) && Object.keys(state.inventory).length > 0) { 
      const invRows = Object.entries(state.inventory).map(([name, inv]) => ({ 
        user_id: window.currentUser.id, 
        product_name: name, 
        stock: (inv.stock || 0), 
        min_alert: (inv.minAlert || 5) 
      })); 
      await window.supabase.from('inventory').upsert(invRows, { onConflict: 'user_id,product_name' }); 
    }
    if ((state.assets || []).length > 0) { 
      const assetsData = state.assets.map(a => ({ 
        user_id: window.currentUser.id, 
        name: a.name, 
        purchase_date: a.purchaseDate, 
        time: a.time, 
        timestamp: a.timestamp, 
        cost: a.cost, 
        description: a.description || '', 
        money_source: a.moneySource || 'business' 
      })); 
      await window.supabase.from('assets').upsert(assetsData, { onConflict: 'user_id,timestamp' }); 
    }
    if ((state.maintenance || []).length > 0) { 
      const maintData = state.maintenance.map(m => ({ 
        user_id: window.currentUser.id, 
        asset_name: m.assetName, 
        amount: m.amount, 
        date: m.date, 
        time: m.time, 
        timestamp: m.timestamp, 
        description: m.description || '', 
        money_source: (m.moneySource || m.money_source || 'business') 
      })); 
      await window.supabase.from('maintenance').upsert(maintData, { onConflict: 'user_id,timestamp' }); 
    }
    if ((state.transactions || []).length > 0) { 
      const transactionsData = state.transactions.map(t => ({ 
        user_id: window.currentUser.id, 
        channel: t.channel, 
        customer_name: t.customerName, 
        type: t.type, 
        amount: t.amount, 
        date: t.date, 
        time: t.time, 
        timestamp: t.timestamp, 
        tags: (Array.isArray(t.tags) ? t.tags.join(',') : (t.tags || null)) 
      })); 
      await window.supabase.from('transactions').upsert(transactionsData, { onConflict: 'user_id,timestamp' }); 
    }
    if ((state.unpaidEntries || []).length > 0) { 
      const unpaidData = state.unpaidEntries.map(u => ({ 
        user_id: window.currentUser.id, 
        name: u.name, 
        type: u.type, 
        amount: u.amount, 
        date: u.date, 
        time: u.time, 
        timestamp: u.timestamp, 
        paid: u.paid, 
        tags: (Array.isArray(u.tags) ? u.tags.join(',') : (u.tags || null)) 
      })); 
      await window.supabase.from('unpaid_entries').upsert(unpaidData, { onConflict: 'user_id,timestamp' }); 
    }
    const floatsKeys = state.transactionFloats ? Object.keys(state.transactionFloats) : [];
    if (floatsKeys.length > 0) { 
      const floatsData = floatsKeys.map(ch => { 
        const f = state.transactionFloats[ch] || {}; 
        return { 
          user_id: window.currentUser.id, 
          channel: ch, 
          initial_account_float: (f.initialAccount != null ? f.initialAccount : (f.initial || 0)), 
          initial_cash_float: (f.initialCash != null ? f.initialCash : 0) 
        }; 
      }); 
      await window.supabase.from('transaction_floats').upsert(floatsData, { onConflict: 'user_id,channel' }); 
    }
    const cycles = (state.inventoryPurchaseCycles || []);
    if (cycles.length > 0) { 
      const periodsData = cycles.map(c => ({ 
        user_id: window.currentUser.id, 
        period_number: c.number, 
        title: c.title || '', 
        start_date: c.startDate || null, 
        end_date: c.endDate || null, 
        notes: c.notes || '' 
      })); 
      await window.supabase.from('inventory_purchase_periods').upsert(periodsData, { onConflict: 'user_id,period_number' }); 
    }
    const purchases = (state.inventoryPurchases || []);
    if (purchases.length > 0) { 
      const purchasesData = purchases.map(p => ({ 
        user_id: window.currentUser.id, 
        period_number: p.cycleNumber, 
        item_name: p.itemName, 
        quantity: p.quantity || 0, 
        unit_cost: p.unitCost || p.buyingPrice || 0, 
        total_cost: p.totalCost || p.buyingPrice || 0, 
        purchase_unit: p.purchaseUnit || null, 
        units_per_purchase: p.unitsPerPurchase || null, 
        purchase_date: p.purchaseDate, 
        supplier_name: p.supplierName || '', 
        supplier_phone: p.supplierPhone || p.supplierContact || '', 
        supplier_address: p.supplierAddress || '', 
        notes: p.notes || '', 
        timestamp: p.timestamp 
      })); 
      await window.supabase.from('inventory_purchases').upsert(purchasesData, { onConflict: 'user_id,timestamp' }); 
    }
    const loansArr = (state.loans || []).slice();
    if (loansArr.length > 0) {
      const loansData = loansArr.map(l => ({ 
        user_id: window.currentUser.id, 
        timestamp: (l.timestamp || l.id || Date.now()), 
        name: l.name, 
        type: l.type, 
        amount: Number(l.amount) || 0, 
        date: l.date, 
        notes: l.notes || '', 
        money_source: l.moneySource || null 
      }));
      await window.supabase.from('loans').upsert(loansData, { onConflict: 'user_id,timestamp' });
    }
    const loanPaymentsArr = (state.loanPayments || []);
    if (loanPaymentsArr.length > 0) {
      const paymentsData = loanPaymentsArr.map(p => ({ 
        user_id: window.currentUser.id, 
        loan_timestamp: p.loanTimestamp, 
        amount: p.amount, 
        date: p.date, 
        timestamp: p.timestamp, 
        source: p.source, 
        destination: p.destination 
      }));
      await window.supabase.from('loan_payments').upsert(paymentsData, { onConflict: 'user_id,timestamp' });
    }
    const tithingArr = (state.tithingRecords ? Object.values(state.tithingRecords) : []);
    if (tithingArr.length > 0) {
      const tithingData = tithingArr.map(t => ({ 
        user_id: window.currentUser.id, 
        month_key: t.monthKey, 
        base: t.base, 
        due: t.due, 
        paid: t.paid, 
        history: t.history, 
        updated_at: t.updatedAt 
      }));
      await window.supabase.from('tithing').upsert(tithingData, { onConflict: 'user_id,month_key' });
    }
    const tagsArr = (state.tags || []);
    if (tagsArr.length > 0) {
      const tagsData = tagsArr.map(tag => ({ 
        user_id: window.currentUser.id, 
        tag_name: tag, 
        color: (state.tagColors && state.tagColors[tag]) ? state.tagColors[tag] : '#999999' 
      }));
      await window.supabase.from('tags').upsert(tagsData, { onConflict: 'user_id,tag_name' });
    }
    showToast('Data synced successfully', 'success');
  } catch (err) {
    console.error('pushAllDataToSupabase error:', err);
    showToast('Sync failed', 'error');
  } finally {
    if (window.cloudSyncEnd) window.cloudSyncEnd();
  }
}

export async function pullDataFromSupabase() {
  if (!window.syncEnabled || !window.currentUser) return; 
  if (window.cloudSyncStart) window.cloudSyncStart(); 
  try { 
    showToast('Loading Data...', 'info', null, null, 8000); 
    const uid = window.currentUser.id; 
    const fetch = (table, cols) => window.supabase.from(table).select(cols).eq('user_id', uid);
    const [ 
      productsRes, salesRes, categoriesRes, expensesRes, incomeRes, customersRes, 
      invoicesRes, receiptsRes, inventoryRes, notesRes, assetsRes, maintenanceRes, 
      transactionsRes, unpaidRes, floatsRes, settingsRes, periodsRes, auditLogsRes, 
      purchasesRes, loansRes, loanPaymentsRes, tithingRes, tagsRes 
    ] = await Promise.all([
      fetch('products', 'name,category,cost,price,has_stock,sale_unit,purchase_unit,units_per_purchase,tags,deleted'),
      window.supabase.from('sales').select('date,time,timestamp,product_name,customer,quantity,cost_per_unit,price_per_unit,total_cost,total_price,profit,payment,status,category,has_stock,tags,deleted').eq('user_id', uid).order('timestamp', { ascending: false }),
      fetch('categories', 'name,kind,deleted'),
      fetch('expenses', 'id,date,time,timestamp,description,category,amount,payment,comment,tags,deleted'),
      fetch('income', 'date,time,timestamp,source,amount,payment,comment,as_capital,include_in_tithing,deleted'),
      fetch('customers', 'name,email,phone,address,total_purchases,tags,deleted'),
      fetch('invoices', 'number,customer,date,due_date,items,amount,status,subtotal,tax_rate,tax_amount,currency_code,currency_symbol,deleted'),
      fetch('receipts', 'number,customer,customer_email,date,time,timestamp,description,amount,payment_method,currency_code,currency_symbol,deleted'),
      fetch('inventory', 'product_name,stock,min_alert,deleted'),
      fetch('notes', 'title,content,date,time,timestamp,tags,deleted'),
      fetch('assets', 'name,purchase_date,time,timestamp,cost,description,money_source,deleted'),
      fetch('maintenance', 'asset_name,amount,date,time,timestamp,description,money_source,deleted'),
      fetch('transactions', 'channel,customer_name,type,amount,date,time,timestamp,tags,deleted'),
      fetch('unpaid_entries', 'name,type,amount,date,time,timestamp,paid,tags,deleted'),
      fetch('transaction_floats', 'channel,initial_account_float,initial_cash_float'),
      window.supabase.from('settings').select('daily_target,monthly_target,currency_code,currency_symbol,default_tax_rate,cogs_method,pin_hash,pin_updated_at').eq('user_id', uid).single(),
      fetch('inventory_purchase_periods', 'period_number,title,start_date,end_date,notes,deleted'),
      window.supabase.from('audit_logs').select('action,table_name,item_key,timestamp,created_at').eq('user_id', uid).order('timestamp', { ascending: false }).limit(50),
      fetch('inventory_purchases', 'period_number,item_name,quantity,unit_cost,total_cost,purchase_date,supplier_name,supplier_phone,supplier_address,notes,timestamp,purchase_unit,units_per_purchase,deleted'),
      fetch('loans', 'name,type,amount,date,notes,timestamp,money_source,deleted'),
      fetch('loan_payments', 'loan_timestamp,amount,date,timestamp,source,destination,deleted'),
      fetch('tithing', 'month_key,base,due,paid,history,updated_at,deleted'),
      fetch('tags', 'tag_name,color,deleted')
    ]);
    
    const products = (productsRes.data || []); 
    if (products.length) { 
      const mapped = products.map(p => ({ 
        id: `P-${(p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, 
        name: p.name, 
        category: p.category, 
        cost: parseFloat(p.cost), 
        price: parseFloat(p.price), 
        hasStock: (p.has_stock === false) ? false : true, 
        saleUnit: p.sale_unit || '', 
        purchaseUnit: p.purchase_unit || '', 
        unitsPerPurchase: (p.units_per_purchase != null ? Number(p.units_per_purchase) : null), 
        tags: (typeof p.tags === 'string' && p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : []), 
        deleted: p.deleted === true 
      })); 
      const tomb = mapped.filter(x => x.deleted === true); 
      const norm = mapped.filter(x => x.deleted !== true); 
      if (tomb.length && window.tubaDB) { 
        for (const it of tomb) { 
          try { 
            await window.tubaDB.put('products', { ...it, deleted: true }); 
          } catch {} 
          state.products = (state.products || []).filter(local => !(local && local.name === it.name && String(local.category || '') === String(it.category || ''))); 
        } 
      } 
      state.products = window.deduplicateByContent ? window.deduplicateByContent([...(state.products || []), ...norm], 'products') : [...(state.products || []), ...norm]; 
    }
    
    const sales = (salesRes.data || []); 
    if (sales.length) { 
      const mapped = sales.map(s => ({ 
        id: `S-${s.timestamp}`, 
        date: s.date, 
        time: s.time, 
        timestamp: s.timestamp, 
        productName: s.product_name, 
        customer: s.customer, 
        quantity: s.quantity, 
        costPerUnit: parseFloat(s.cost_per_unit), 
        pricePerUnit: parseFloat(s.price_per_unit), 
        totalCost: parseFloat(s.total_cost), 
        totalPrice: parseFloat(s.total_price), 
        profit: parseFloat(s.profit), 
        payment: s.payment, 
        status: s.status || 'paid', 
        category: s.category || '', 
        hasStock: (s.has_stock === false ? false : true), 
        tags: (typeof s.tags === 'string' && s.tags ? s.tags.split(',').map(t => t.trim()).filter(Boolean) : []), 
        deleted: s.deleted === true 
      })); 
      const tomb = mapped.filter(x => x.deleted === true); 
      const norm = mapped.filter(x => x.deleted !== true); 
      if (tomb.length && window.tubaDB) { 
        for (const it of tomb) { 
          try { 
            await window.tubaDB.put('sales', { ...it, deleted: true }); 
          } catch {} 
          state.sales = (state.sales || []).filter(local => (local && local.id) !== it.id); 
        } 
      } 
      state.sales = window.deduplicateByContent ? window.deduplicateByContent([...(state.sales || []), ...norm], 'sales') : [...(state.sales || []), ...norm]; 
    }
    
    const categories = (categoriesRes.data || []); 
    if (categories.length) {
      const tomb = categories.filter(c => c.deleted === true);
      const norm = categories.filter(c => c.deleted !== true);
      if (tomb.length && window.tubaDB) {
        for (const it of tomb) {
          try { 
            await window.tubaDB.put('categories', { ...it, deleted: true }); 
          } catch {}
          const nm = (it.name || '').trim();
          if (nm) { 
            state.categories = (state.categories || []).filter(x => x !== nm); 
            if (state.categoryKinds && state.categoryKinds[nm]) delete state.categoryKinds[nm]; 
          }
        }
      }
      const cloudCategories = norm.map(c => (c.name || '').trim()).filter(Boolean);
      state.categories = Array.from(new Set([...(state.categories || []), ...cloudCategories]));
      state.categoryKinds = state.categoryKinds || {};
      norm.forEach(c => { 
        const nm = (c.name || '').trim(); 
        if (nm && c.kind) state.categoryKinds[nm] = c.kind; 
      });
    }
    
    const expenses = (expensesRes.data || []); 
    if (expenses.length) { 
      const mapped = expenses.map(e => ({ 
        id: e.id || `E-${e.timestamp}`, 
        date: e.date, 
        time: e.time, 
        timestamp: e.timestamp, 
        description: e.description, 
        category: e.category, 
        amount: parseFloat(e.amount), 
        payment: e.payment, 
        comment: e.comment, 
        tags: (typeof e.tags === 'string' && e.tags ? e.tags.split(',').map(t => t.trim()).filter(Boolean) : []), 
        deleted: e.deleted === true 
      })); 
      const tomb = mapped.filter(x => x.deleted === true); 
      const norm = mapped.filter(x => x.deleted !== true); 
      if (tomb.length && window.tubaDB) { 
        for (const it of tomb) { 
          try { 
            await window.tubaDB.put('expenses', { ...it, deleted: true }); 
          } catch {} 
          state.expenses = (state.expenses || []).filter(local => (local && (local.id || local.timestamp)) !== (it.id || it.timestamp)); 
        } 
      } 
      state.expenses = window.deduplicateByContent ? window.deduplicateByContent([...(state.expenses || []), ...norm], 'expenses') : [...(state.expenses || []), ...norm]; 
    }
    
    const income = (incomeRes.data || []); 
    if (income.length) { 
      const mapped = income.map(i => ({ 
        id: `I-${i.timestamp}`, 
        date: i.date, 
        time: i.time, 
        timestamp: i.timestamp, 
        source: i.source, 
        amount: parseFloat(i.amount), 
        payment: i.payment, 
        comment: i.comment, 
        asCapital: i.as_capital === true, 
        includeTithing: i.include_in_tithing !== false, 
        deleted: i.deleted === true 
      })); 
      const tomb = mapped.filter(x => x.deleted === true); 
      const norm = mapped.filter(x => x.deleted !== true); 
      if (tomb.length && window.tubaDB) { 
        for (const it of tomb) { 
          try { 
            await window.tubaDB.put('income', { ...it, deleted: true }); 
          } catch {} 
          state.income = (state.income || []).filter(local => (local && local.id) !== it.id); 
        } 
      } 
      state.income = window.deduplicateByContent ? window.deduplicateByContent([...(state.income || []), ...norm], 'income') : [...(state.income || []), ...norm]; 
    }
    
    const customers = (customersRes.data || []); 
    if (customers.length) { 
      const mapped = customers.map(c => ({ 
        name: c.name, 
        email: c.email || '', 
        phone: c.phone || '', 
        address: c.address || '', 
        totalPurchases: c.total_purchases || 0, 
        tags: (typeof c.tags === 'string' && c.tags ? c.tags.split(',').map(t => t.trim()).filter(Boolean) : []), 
        deleted: c.deleted === true 
      })); 
      const tomb = mapped.filter(x => x.deleted === true); 
      const norm = mapped.filter(x => x.deleted !== true); 
      if (tomb.length && window.tubaDB) { 
        for (const it of tomb) { 
          try { 
            await window.tubaDB.put('customers', { ...it, deleted: true }); 
          } catch {} 
          state.customers = (state.customers || []).filter(local => !(local && local.name === it.name && String(local.email || '') === String(it.email || ''))); 
        } 
      } 
      state.customers = window.deduplicateByContent ? window.deduplicateByContent([...(state.customers || []), ...norm], 'customers') : [...(state.customers || []), ...norm]; 
    }
    
    const invoices = (invoicesRes.data || []); 
    if (invoices.length) { 
      const mapped = invoices.map(inv => ({ ...inv, deleted: inv.deleted === true })); 
      const tomb = mapped.filter(x => x.deleted === true); 
      const norm = mapped.filter(x => x.deleted !== true); 
      if (tomb.length && window.tubaDB) { 
        for (const it of tomb) { 
          try { 
            await window.tubaDB.put('invoices', { ...it, deleted: true }); 
          } catch {} 
          state.invoices = (state.invoices || []).filter(local => (local && local.number) !== it.number); 
        } 
      } 
      state.invoices = window.deduplicateByContent ? window.deduplicateByContent([...(state.invoices || []), ...norm], 'invoices') : [...(state.invoices || []), ...norm]; 
    }
    
    const receipts = (receiptsRes.data || []); 
    if (receipts.length) { 
      const mapped = receipts.map(r => ({ ...r, deleted: r.deleted === true })); 
      const tomb = mapped.filter(x => x.deleted === true); 
      const norm = mapped.filter(x => x.deleted !== true); 
      if (tomb.length && window.tubaDB) { 
        for (const it of tomb) { 
          try { 
            await window.tubaDB.put('receipts', { ...it, deleted: true }); 
          } catch {} 
          state.receipts = (state.receipts || []).filter(local => (local && local.timestamp) !== it.timestamp); 
        } 
      } 
      state.receipts = window.deduplicateByContent ? window.deduplicateByContent([...(state.receipts || []), ...norm], 'receipts') : [...(state.receipts || []), ...norm]; 
    }
    
    const inventory = (inventoryRes.data || []); 
    if (inventory.length) { 
      inventory.forEach(async (row) => { 
        const name = row.product_name; 
        if (row.deleted === true) { 
          if (window.tubaDB) { 
            try { 
              await window.tubaDB.put('inventory', { ...row, deleted: true }); 
            } catch {} 
          } 
          if (state.inventory && state.inventory[name]) delete state.inventory[name]; 
          return; 
        } 
        const inv = state.inventory[name] || { stock: 0, minAlert: 5 }; 
        inv.stock = row.stock || 0; 
        inv.minAlert = row.min_alert || inv.minAlert; 
        state.inventory[name] = inv; 
      }); 
    }
    
    const notes = (notesRes.data || []); 
    if (notes.length) { 
      const mapped = notes.map(n => ({ 
        title: n.title, 
        content: n.content, 
        date: n.date, 
        time: n.time, 
        timestamp: n.timestamp, 
        tags: (typeof n.tags === 'string' && n.tags ? n.tags.split(',').map(t => t.trim()).filter(Boolean) : (Array.isArray(n.tags) ? n.tags : [])), 
        deleted: n.deleted === true 
      })); 
      const tomb = mapped.filter(x => x.deleted === true); 
      const norm = mapped.filter(x => x.deleted !== true); 
      if (tomb.length && window.tubaDB) { 
        for (const it of tomb) { 
          try { 
            await window.tubaDB.put('notes', { ...it, deleted: true }); 
          } catch {} 
          state.notes = (state.notes || []).filter(local => (local && local.timestamp) !== it.timestamp); 
        } 
      } 
      state.notes = window.deduplicateByContent ? window.deduplicateByContent([...(state.notes || []), ...norm], 'notes') : [...(state.notes || []), ...norm]; 
    }
    
    const assets = (assetsRes.data || []); 
    if (assets.length) { 
      const mapped = assets.map(a => ({ 
        name: a.name, 
        purchaseDate: a.purchase_date, 
        time: a.time, 
        timestamp: a.timestamp, 
        cost: parseFloat(a.cost) || 0, 
        description: a.description || '', 
        moneySource: a.money_source || 'business', 
        deleted: a.deleted === true 
      })); 
      const tomb = mapped.filter(x => x.deleted === true); 
      const norm = mapped.filter(x => x.deleted !== true); 
      if (tomb.length && window.tubaDB) { 
        for (const it of tomb) { 
          try { 
            await window.tubaDB.put('assets', { ...it, deleted: true }); 
          } catch {} 
          state.assets = (state.assets || []).filter(local => (local && local.timestamp) !== it.timestamp); 
        } 
      } 
      state.assets = window.deduplicateByContent ? window.deduplicateByContent([...(state.assets || []), ...norm], 'assets') : [...(state.assets || []), ...norm]; 
    }
    
    const maintenance = (maintenanceRes.data || []); 
    if (maintenance.length) { 
      const mapped = maintenance.map(m => ({ 
        assetName: m.asset_name, 
        amount: m.amount, 
        date: m.date, 
        time: m.time, 
        timestamp: m.timestamp, 
        description: m.description || '', 
        moneySource: m.money_source || 'business', 
        deleted: m.deleted === true 
      })); 
      const tomb = mapped.filter(x => x.deleted === true); 
      const norm = mapped.filter(x => x.deleted !== true); 
      if (tomb.length && window.tubaDB) { 
        for (const it of tomb) { 
          try { 
            await window.tubaDB.put('maintenance', { ...it, deleted: true }); 
          } catch {} 
          state.maintenance = (state.maintenance || []).filter(local => (local && local.timestamp) !== it.timestamp); 
        } 
      } 
      state.maintenance = window.deduplicateByContent ? window.deduplicateByContent([...(state.maintenance || []), ...norm], 'maintenance') : [...(state.maintenance || []), ...norm]; 
    }
    
    const transactions = (transactionsRes.data || []); 
    if (transactions.length) { 
      const mapped = transactions.map(t => ({ 
        channel: t.channel, 
        customerName: t.customer_name, 
        type: t.type, 
        amount: t.amount, 
        date: t.date, 
        time: t.time, 
        timestamp: t.timestamp, 
        tags: (typeof t.tags === 'string' && t.tags ? t.tags.split(',').map(tg => tg.trim()).filter(Boolean) : []), 
        deleted: t.deleted === true 
      })); 
      const tomb = mapped.filter(x => x.deleted === true); 
      const norm = mapped.filter(x => x.deleted !== true); 
      if (tomb.length && window.tubaDB) { 
        for (const it of tomb) { 
          try { 
            await window.tubaDB.put('transactions', { ...it, deleted: true }); 
          } catch {} 
          state.transactions = (state.transactions || []).filter(local => (local && local.timestamp) !== it.timestamp); 
        } 
      } 
      state.transactions = window.deduplicateByContent ? window.deduplicateByContent([...(state.transactions || []), ...norm], 'transactions') : [...(state.transactions || []), ...norm]; 
    }
    
    const unpaid = (unpaidRes.data || []); 
    if (unpaid.length) { 
      const mapped = unpaid.map(u => ({ 
        name: u.name, 
        type: u.type, 
        amount: u.amount, 
        date: u.date, 
        time: u.time, 
        timestamp: u.timestamp, 
        paid: u.paid, 
        tags: (typeof u.tags === 'string' && u.tags ? u.tags.split(',').map(t => t.trim()).filter(Boolean) : []), 
        deleted: u.deleted === true 
      })); 
      const tomb = mapped.filter(x => x.deleted === true); 
      const norm = mapped.filter(x => x.deleted !== true); 
      if (tomb.length && window.tubaDB) { 
        for (const it of tomb) { 
          try { 
            await window.tubaDB.put('unpaid_entries', { ...it, deleted: true }); 
          } catch {} 
          state.unpaidEntries = (state.unpaidEntries || []).filter(local => (local && local.timestamp) !== it.timestamp); 
        } 
      } 
      state.unpaidEntries = window.deduplicateByContent ? window.deduplicateByContent([...(state.unpaidEntries || []), ...norm], 'unpaidEntries') : [...(state.unpaidEntries || []), ...norm]; 
    }
    
    const floats = (floatsRes.data || []); 
    if (floats.length) { 
      state.transactionFloats = state.transactionFloats || {}; 
      floats.forEach(f => { 
        state.transactionFloats[f.channel] = { 
          initialAccount: f.initial_account_float, 
          initialCash: f.initial_cash_float 
        }; 
      }); 
    }
    
    const periods = (periodsRes.data || []); 
    if (periods.length) { 
      state.inventoryPurchaseCycles = state.inventoryPurchaseCycles || []; 
      periods.forEach(p => { 
        const existing = state.inventoryPurchaseCycles.find(c => c.number === p.period_number); 
        if (existing) { 
          existing.title = p.title || ''; 
          existing.startDate = p.start_date; 
          existing.endDate = p.end_date; 
          existing.notes = p.notes || ''; 
        } else { 
          state.inventoryPurchaseCycles.push({ 
            number: p.period_number, 
            title: p.title || '', 
            startDate: p.start_date, 
            endDate: p.end_date, 
            notes: p.notes || '' 
          }); 
        } 
      }); 
    }
    
    const purchases = (purchasesRes.data || []); 
    if (purchases.length) { 
      const mapped = purchases.map(p => ({ 
        cycleNumber: p.period_number, 
        itemName: p.item_name, 
        quantity: p.quantity || 0, 
        unitCost: p.unit_cost || p.buyingPrice || 0, 
        totalCost: p.total_cost || p.buyingPrice || 0, 
        purchaseUnit: p.purchase_unit || null, 
        unitsPerPurchase: p.units_per_purchase || null, 
        purchaseDate: p.purchase_date, 
        supplierName: p.supplier_name || '', 
        supplierPhone: p.supplier_phone || p.supplierContact || '', 
        supplierAddress: p.supplier_address || '', 
        notes: p.notes || '', 
        timestamp: p.timestamp 
      })); 
      const tomb = mapped.filter(x => x.deleted === true); 
      const norm = mapped.filter(x => x.deleted !== true); 
      if (tomb.length && window.tubaDB) { 
        for (const it of tomb) { 
          try { 
            await window.tubaDB.put('inventoryPurchases', { ...it, deleted: true }); 
          } catch {} 
          state.inventoryPurchases = (state.inventoryPurchases || []).filter(local => (local && local.timestamp) !== it.timestamp); 
        } 
      } 
      state.inventoryPurchases = window.deduplicateByContent ? window.deduplicateByContent([...(state.inventoryPurchases || []), ...norm], 'inventoryPurchases') : [...(state.inventoryPurchases || []), ...norm]; 
    }
    
    const loans = (loansRes.data || []); 
    if (loans.length) { 
      const mapped = loans.map(l => ({ 
        timestamp: l.timestamp, 
        name: l.name, 
        type: l.type, 
        amount: Number(l.amount) || 0, 
        date: l.date, 
        notes: l.notes || '', 
        moneySource: l.money_source || null, 
        deleted: l.deleted === true 
      })); 
      const tomb = mapped.filter(x => x.deleted === true); 
      const norm = mapped.filter(x => x.deleted !== true); 
      if (tomb.length && window.tubaDB) { 
        for (const it of tomb) { 
          try { 
            await window.tubaDB.put('loans', { ...it, deleted: true }); 
          } catch {} 
          state.loans = (state.loans || []).filter(local => (local && local.timestamp) !== it.timestamp); 
        } 
      } 
      state.loans = window.deduplicateByContent ? window.deduplicateByContent([...(state.loans || []), ...norm], 'loans') : [...(state.loans || []), ...norm]; 
    }
    
    const loanPayments = (loanPaymentsRes.data || []); 
    if (loanPayments.length) { 
      const mapped = loanPayments.map(p => ({ 
        loanTimestamp: p.loan_timestamp, 
        amount: p.amount, 
        date: p.date, 
        timestamp: p.timestamp, 
        source: p.source, 
        destination: p.destination, 
        deleted: p.deleted === true 
      })); 
      const tomb = mapped.filter(x => x.deleted === true); 
      const norm = mapped.filter(x => x.deleted !== true); 
      if (tomb.length && window.tubaDB) { 
        for (const it of tomb) { 
          try { 
            await window.tubaDB.put('loanPayments', { ...it, deleted: true }); 
          } catch {} 
          state.loanPayments = (state.loanPayments || []).filter(local => (local && local.timestamp) !== it.timestamp); 
        } 
      } 
      state.loanPayments = window.deduplicateByContent ? window.deduplicateByContent([...(state.loanPayments || []), ...norm], 'loanPayments') : [...(state.loanPayments || []), ...norm]; 
    }
    
    const tithing = (tithingRes.data || []); 
    if (tithing.length) { 
      state.tithingRecords = state.tithingRecords || {}; 
      tithing.forEach(t => { 
        state.tithingRecords[t.month_key] = { 
          monthKey: t.month_key, 
          base: t.base, 
          due: t.due, 
          paid: t.paid, 
          history: t.history, 
          updatedAt: t.updated_at 
        }; 
      }); 
    }
    
    const tags = (tagsRes.data || []); 
    if (tags.length) { 
      state.tags = state.tags || []; 
      state.tagColors = state.tagColors || {}; 
      tags.forEach(t => { 
        const tagName = (t.tag_name || '').toLowerCase(); 
        if (!state.tags.includes(tagName)) state.tags.push(tagName); 
        if (t.color) state.tagColors[tagName] = t.color; 
      }); 
    }
    
    if (settingsRes.data) { 
      const s = settingsRes.data; 
      state.dailyTarget = s.daily_target || 0; 
      state.monthlyTarget = s.monthly_target || 0; 
      state.currencyCode = s.currency_code || 'USD'; 
      state.currencySymbol = s.currency_symbol || '$'; 
      state.defaultTaxRate = s.default_tax_rate || 0; 
      state.cogsMethod = s.cogs_method || 'average'; 
      if (s.pin_hash) { 
        state.securityPinHash = s.pin_hash; 
        state.securityPinUpdatedAt = s.pin_updated_at; 
      }
    }
    
    showToast('Data loaded successfully', 'success');
  } catch (err) {
    console.error('pullDataFromSupabase error:', err);
    showToast('Data load failed', 'error');
  } finally {
    if (window.cloudSyncEnd) window.cloudSyncEnd();
  }
}

window.getStats = getStats;
window.pushAllDataToSupabase = pushAllDataToSupabase;
window.pullDataFromSupabase = pullDataFromSupabase;