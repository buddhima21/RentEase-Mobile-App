const mongoose = require('mongoose');

const BankCardSchema = new mongoose.Schema(
  {
    ownerId:        { type: String, required: true },
    cardHolderName: { type: String, required: true },
    cardNumber:     { type: String, required: true },
    expiryDate:     { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BankCard', BankCardSchema);
