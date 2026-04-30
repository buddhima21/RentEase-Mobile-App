const { Wallet, WalletTransaction } = require('../models/Wallet');
const BankCard = require('../models/BankCard');

// ── Helper: get or create wallet ─────────────────────────────────────────────
const getOrCreate = async (ownerId) => {
  let wallet = await Wallet.findOne({ ownerId });
  if (!wallet) wallet = await Wallet.create({ ownerId, balance: 0 });
  return wallet;
};

// GET /api/wallet/:ownerId
const getWallet = async (req, res) => {
  try {
    const wallet = await getOrCreate(req.params.ownerId);
    const cards  = await BankCard.find({ ownerId: req.params.ownerId });
    res.json({
      id:      wallet._id,
      ownerId: wallet.ownerId,
      balance: wallet.balance,
      cards,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/wallet/:ownerId/withdraw
const withdraw = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { amount, cardId } = req.body;

    const wallet = await getOrCreate(ownerId);
    if (wallet.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Validate card
    const card = await BankCard.findById(cardId).catch(() => null)
      || await BankCard.findOne({ cardNumber: cardId, ownerId });
    if (!card) {
      return res.status(400).json({ success: false, message: 'Selected bank card is invalid' });
    }
    if (card.ownerId !== ownerId) {
      return res.status(400).json({ success: false, message: "Card doesn't belong to wallet owner" });
    }

    wallet.balance -= amount;
    await wallet.save();

    const last4 = (card.cardNumber || '').slice(-4);
    await WalletTransaction.create({
      walletId:    wallet._id.toString(),
      amount,
      type:        'WITHDRAWAL',
      description: `Withdrawal to card ending in ${last4}`,
      timestamp:   new Date(),
    });

    res.json({ success: true, message: 'Withdrawal successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/wallet/:ownerId/deposit  (utility for adding balance)
const deposit = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { amount, description } = req.body;

    const wallet = await getOrCreate(ownerId);
    wallet.balance = (wallet.balance || 0) + amount;
    await wallet.save();

    await WalletTransaction.create({
      walletId:    wallet._id.toString(),
      amount,
      type:        'DEPOSIT',
      description: description || 'Manual deposit',
      timestamp:   new Date(),
    });

    res.json({ success: true, message: 'Deposit successful', balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/wallet/:ownerId/transactions
const getTransactions = async (req, res) => {
  try {
    const wallet = await getOrCreate(req.params.ownerId);
    const transactions = await WalletTransaction.find({ walletId: wallet._id.toString() })
      .sort({ timestamp: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getWallet, withdraw, deposit, getTransactions };
