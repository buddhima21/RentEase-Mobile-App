import API from './api';

// ── Invoice APIs ──────────────────────────────────────────────────────────────
export const getInvoicesByTenant = (tenantId) =>
  API.get(`/invoices/tenant/${tenantId}`);

export const getAllInvoices = () =>
  API.get('/invoices');

export const sendInvoice = (invoiceDTO) =>
  API.post('/invoices/send', invoiceDTO);

export const saveInvoice = (invoiceDTO) =>
  API.post('/invoices/save', invoiceDTO);

export const updateInvoiceStatus = (id, status) =>
  API.put(`/invoices/${id}/status?status=${status}`);

export const deleteInvoiceByTenant = (id) =>
  API.delete(`/invoices/${id}/tenant`);

export const deleteInvoiceByOwner = (id) =>
  API.delete(`/invoices/${id}/owner`);

export const submitExternalPayment = (id, slipImage) =>
  API.post(`/invoices/${id}/external-payment`, { slipImage });

export const updateExternalPaymentStatus = (id, status) =>
  API.put(`/invoices/${id}/external-status`, { status });

// ── Payment APIs ──────────────────────────────────────────────────────────────
export const getDuePayments = (tenantId) =>
  API.get(`/payments/due/${tenantId}`);

export const getPaymentHistory = (tenantId) =>
  API.get(`/payments/history/${tenantId}`);

export const createPayment = (paymentData) =>
  API.post('/payments', paymentData);

// ── Wallet APIs ───────────────────────────────────────────────────────────────
export const getWallet = (ownerId) =>
  API.get(`/wallet/${ownerId}`);

export const withdrawFromWallet = (ownerId, amount, cardId) =>
  API.post(`/wallet/${ownerId}/withdraw`, { amount, cardId });

export const depositToWallet = (ownerId, amount, description) =>
  API.post(`/wallet/${ownerId}/deposit`, { amount, description });

export const getWalletTransactions = (ownerId) =>
  API.get(`/wallet/${ownerId}/transactions`);

// ── Bank Card APIs ─────────────────────────────────────────────────────────────
export const getBankCards = (ownerId) =>
  API.get(`/bank-cards/${ownerId}`);

export const saveBankCard = (cardData) =>
  API.post('/bank-cards', cardData);

export const updateBankCard = (id, cardData) =>
  API.put(`/bank-cards/${id}`, cardData);

export const deleteBankCard = (id) =>
  API.delete(`/bank-cards/${id}`);

// ── Owner Tenants ──────────────────────────────────────────────────────────────
export const getOwnerTenants = (ownerId) =>
  API.get(`/owner-tenants/${ownerId}`);
