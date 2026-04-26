const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const WalletTransactionSchema = new mongoose.Schema(
  {
    walletId:    { type: String, required: true },
    amount:      { type: Number, required: true },
    type:        { type: String, enum: ['DEPOSIT', 'WITHDRAWAL'], required: true },
    description: { type: String },
    timestamp:   { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Wallet            = mongoose.model('Wallet', WalletSchema);
const WalletTransaction = mongoose.model('WalletTransaction', WalletTransactionSchema);

module.exports = { Wallet, WalletTransaction };
