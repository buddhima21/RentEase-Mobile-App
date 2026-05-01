const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    bookingId: { type: String },
    tenantId:  { type: String, required: true },
    ownerId:   { type: String },
    amount:    { type: Number, required: true },
    dueDate:   { type: Date },
    paidDate:  { type: Date },
    status:    { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);
