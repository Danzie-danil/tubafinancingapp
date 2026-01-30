export const state = {
  products: [],
  sales: [],
  expenses: [],
  income: [],
  customers: [],
  invoices: [],
  receipts: [],
  inventory: {},
  notes: [],
  assets: [],
  maintenance: [],
  transactions: [],
  unpaidEntries: [],
  transactionFloats: {},
  inventoryPurchaseCycles: [],
  inventoryPurchases: [],
  loans: [],
  tithingRecords: {},
  tags: [],
  tagColors: {},
  userProfile: {},
  currencyCode: 'TZS',
  currencySymbol: 'Tsh',
  // UI flags
  showSalesHistory: false,
  profileLoaded: false,
  lastInteractionInProgress: false
};

// Expose to window for legacy compatibility
window.state = state;
