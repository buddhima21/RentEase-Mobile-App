const Invoice = require('../models/Invoice');
const { Wallet, WalletTransaction } = require('../models/Wallet');

// ── Helpers ──────────────────────────────────────────────────────────────────

const checkAndApplyOverdue = async (invoice) => {
  if (invoice.status === 'PAID' || !invoice.dueDate) return invoice;
  try {
    const due = new Date(invoice.dueDate);
    const now = new Date();
    if (now > due) {
      if (!invoice.overdueFee || invoice.overdueFee === 0) {
        const penalty = (invoice.total || 0) * 0.05;
        invoice.overdueFee = penalty;
        invoice.total = (invoice.total || 0) + penalty;
        invoice.status = 'OVERDUE';
        await Invoice.findByIdAndUpdate(invoice._id, {
          overdueFee: invoice.overdueFee,
          total: invoice.total,
          status: 'OVERDUE',
        });
      } else {
        invoice.status = 'OVERDUE';
        await Invoice.findByIdAndUpdate(invoice._id, { status: 'OVERDUE' });
      }
    }
  } catch (e) {
    console.error('Overdue check error:', e.message);
  }
  return invoice;
};

const mapToDTO = (inv) => ({
  id:             inv._id,
  invoiceNo:      inv.invoiceNumber,
  tenantName:     inv.tenantName,
  tenantId:       inv.tenantId,
  ownerId:        inv.ownerId,
  tenantEmail:    inv.tenantEmail,
  unit:           inv.unit,
  dueDate:        inv.dueDate,
  items:          inv.items,
  total:          inv.total,
  overdueFee:     inv.overdueFee,
  status:         inv.status,
  externalPaymentSlip: inv.externalPaymentSlip,
  externalPaymentStatus: inv.externalPaymentStatus,
  deletedByTenant: inv.deletedByTenant,
  deletedByOwner:  inv.deletedByOwner,
  createdAt:      inv.createdAt,
});

// ── Controllers ───────────────────────────────────────────────────────────────

// GET /api/invoices — all invoices (owner view)
const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ deletedByOwner: false }).sort({ createdAt: -1 });
    const result = await Promise.all(invoices.map(checkAndApplyOverdue));
    res.json(result.map(mapToDTO));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/invoices/tenant/:tenantId
const getInvoicesByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const invoices = await Invoice.find({ tenantId, deletedByTenant: false }).sort({ createdAt: -1 });
    const result = await Promise.all(invoices.map(checkAndApplyOverdue));
    res.json(result.map(mapToDTO));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/invoices/send
const sendInvoice = async (req, res) => {
  try {
    const dto = req.body;
    if (!dto.invoiceNo) return res.status(400).json({ message: 'Invoice number required' });

    let invoice = await Invoice.findOne({ invoiceNumber: dto.invoiceNo });
    if (!invoice) invoice = new Invoice();

    invoice.invoiceNumber = dto.invoiceNo;
    invoice.tenantName    = dto.tenantName;
    invoice.tenantId      = dto.tenantId;
    invoice.ownerId       = dto.ownerId;
    invoice.tenantEmail   = dto.tenantEmail;
    invoice.unit          = dto.unit;
    invoice.dueDate       = dto.dueDate;
    invoice.items         = dto.items || [];
    invoice.total         = dto.total;
    invoice.status        = 'SENT';

    await invoice.save();
    res.json({ message: 'Invoice sent successfully', invoice: mapToDTO(invoice) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/invoices/save
const saveInvoice = async (req, res) => {
  try {
    const dto = req.body;
    if (!dto.invoiceNo) return res.status(400).json({ message: 'Invoice number required' });

    let invoice = await Invoice.findOne({ invoiceNumber: dto.invoiceNo });
    if (!invoice) invoice = new Invoice();

    invoice.invoiceNumber = dto.invoiceNo;
    invoice.tenantName    = dto.tenantName;
    invoice.tenantId      = dto.tenantId;
    invoice.ownerId       = dto.ownerId;
    invoice.tenantEmail   = dto.tenantEmail;
    invoice.unit          = dto.unit;
    invoice.dueDate       = dto.dueDate;
    invoice.items         = dto.items || [];
    invoice.total         = dto.total;
    if (!invoice.status) invoice.status = dto.status || 'PENDING';

    await invoice.save();
    res.json({ message: 'Invoice saved', invoice: mapToDTO(invoice) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/invoices/:id/status?status=PAID
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    // Find by _id or invoiceNumber
    let invoice = await Invoice.findById(id).catch(() => null);
    if (!invoice) invoice = await Invoice.findOne({ invoiceNumber: id });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const wasPaid = invoice.status === 'PAID';
    invoice.status = status;
    await invoice.save();

    // Credit wallet if newly marked PAID
    if (status === 'PAID' && !wasPaid && invoice.ownerId) {
      let wallet = await Wallet.findOne({ ownerId: invoice.ownerId });
      if (!wallet) wallet = new Wallet({ ownerId: invoice.ownerId, balance: 0 });
      wallet.balance = (wallet.balance || 0) + (invoice.total || 0);
      await wallet.save();

      await WalletTransaction.create({
        walletId:    wallet._id.toString(),
        amount:      invoice.total,
        type:        'DEPOSIT',
        description: `Rent payment for unit ${invoice.unit}`,
        timestamp:   new Date(),
      });
    }

    res.json({ message: 'Status updated', invoice: mapToDTO(invoice) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/invoices/:id/external-payment
const submitExternalPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { slipImage } = req.body;

    let invoice = await Invoice.findById(id).catch(() => null);
    if (!invoice) invoice = await Invoice.findOne({ invoiceNumber: id });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    invoice.externalPaymentSlip = slipImage;
    invoice.externalPaymentStatus = 'PENDING';
    await invoice.save();

    res.json({ message: 'External payment submitted', invoice: mapToDTO(invoice) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/invoices/:id/external-status
const updateExternalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // ACCEPTED or REJECTED

    let invoice = await Invoice.findById(id).catch(() => null);
    if (!invoice) invoice = await Invoice.findOne({ invoiceNumber: id });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    invoice.externalPaymentStatus = status;

    if (status === 'ACCEPTED') {
      const wasPaid = invoice.status === 'PAID';
      invoice.status = 'PAID';

      if (!wasPaid && invoice.ownerId) {
        let wallet = await Wallet.findOne({ ownerId: invoice.ownerId });
        if (!wallet) wallet = new Wallet({ ownerId: invoice.ownerId, balance: 0 });
        wallet.balance = (wallet.balance || 0) + (invoice.total || 0);
        await wallet.save();

        await WalletTransaction.create({
          walletId:    wallet._id.toString(),
          amount:      invoice.total,
          type:        'DEPOSIT',
          description: `External rent payment for unit ${invoice.unit || 'Unknown'}`,
          timestamp:   new Date(),
        });
      }
    } else if (status === 'REJECTED') {
      // Revert invoice status to SENT or PENDING if it was somehow paid incorrectly
      if (invoice.status === 'PAID') {
         invoice.status = 'SENT';
      }
    }

    await invoice.save();
    res.json({ message: `External payment ${status.toLowerCase()}`, invoice: mapToDTO(invoice) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/invoices/:id/tenant
const deleteByTenant = async (req, res) => {
  try {
    const { id } = req.params;
    let invoice = await Invoice.findById(id).catch(() => null);
    if (!invoice) invoice = await Invoice.findOne({ invoiceNumber: id });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    invoice.deletedByTenant = true;
    if (invoice.deletedByOwner) {
      await invoice.deleteOne();
    } else {
      await invoice.save();
    }
    res.json({ message: 'Invoice hidden from your dashboard' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/invoices/:id/owner
const deleteByOwner = async (req, res) => {
  try {
    const { id } = req.params;
    let invoice = await Invoice.findById(id).catch(() => null);
    if (!invoice) invoice = await Invoice.findOne({ invoiceNumber: id });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    invoice.deletedByOwner = true;
    if (invoice.deletedByTenant) {
      await invoice.deleteOne();
    } else {
      await invoice.save();
    }
    res.json({ message: 'Invoice hidden from your dashboard' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/invoices/generate-pdf  (simplified — returns JSON, no PDF binary in Node)
const generateInvoicePdf = async (req, res) => {
  try {
    const dto = req.body;
    if (!dto.invoiceNo) return res.status(400).json({ message: 'Invoice number required' });

    let invoice = await Invoice.findOne({ invoiceNumber: dto.invoiceNo });
    if (!invoice) invoice = new Invoice();

    invoice.invoiceNumber = dto.invoiceNo;
    invoice.tenantName    = dto.tenantName;
    invoice.tenantId      = dto.tenantId;
    invoice.ownerId       = dto.ownerId;
    invoice.tenantEmail   = dto.tenantEmail;
    invoice.unit          = dto.unit;
    invoice.dueDate       = dto.dueDate;
    invoice.items         = dto.items || [];
    invoice.total         = dto.total;
    if (!invoice.status) invoice.status = dto.status || 'PENDING';
    await invoice.save();

    res.json({ message: 'Invoice saved (PDF generation not available in mobile backend)', invoice: mapToDTO(invoice) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllInvoices,
  getInvoicesByTenant,
  sendInvoice,
  saveInvoice,
  updateStatus,
  submitExternalPayment,
  updateExternalStatus,
  deleteByTenant,
  deleteByOwner,
  generateInvoicePdf,
};
