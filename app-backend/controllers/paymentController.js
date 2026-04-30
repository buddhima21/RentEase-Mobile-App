const Payment = require('../models/Payment');

const mapToDTO = (p) => ({
  id:        p._id,
  bookingId: p.bookingId,
  tenantId:  p.tenantId,
  ownerId:   p.ownerId,
  amount:    p.amount,
  dueDate:   p.dueDate,
  paidDate:  p.paidDate,
  status:    p.status,
  createdAt: p.createdAt,
});

// GET /api/payments/due/:tenantId
const getDuePayments = async (req, res) => {
  try {
    const payments = await Payment.find({ tenantId: req.params.tenantId, status: 'PENDING' });
    res.json(payments.map(mapToDTO));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payments/history/:tenantId
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ tenantId: req.params.tenantId }).sort({ createdAt: -1 });
    res.json(payments.map(mapToDTO));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/payments  — record a manual payment
const createPayment = async (req, res) => {
  try {
    const { bookingId, tenantId, ownerId, amount, dueDate, paidDate, status } = req.body;
    const payment = await Payment.create({ bookingId, tenantId, ownerId, amount, dueDate, paidDate, status });
    res.status(201).json(mapToDTO(payment));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDuePayments, getPaymentHistory, createPayment };
