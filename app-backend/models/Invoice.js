const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
}, { _id: false });

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true },
    tenantName:    { type: String },
    tenantId:      { type: String },
    ownerId:       { type: String },
    tenantEmail:   { type: String },
    unit:          { type: String },
    dueDate:       { type: String },
    items:         { type: [InvoiceItemSchema], default: [] },
    total:         { type: Number, default: 0 },
    overdueFee:    { type: Number, default: 0 },
    status:        { type: String, enum: ['SENT', 'PAID', 'PENDING', 'OVERDUE'], default: 'PENDING' },
    deletedByTenant: { type: Boolean, default: false },
    deletedByOwner:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', InvoiceSchema);
