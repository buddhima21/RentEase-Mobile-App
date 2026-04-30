const BankCard = require('../models/BankCard');

// GET /api/cards/:ownerId
const getCards = async (req, res) => {
  try {
    const cards = await BankCard.find({ ownerId: req.params.ownerId });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/cards
const saveCard = async (req, res) => {
  try {
    const { ownerId, cardHolderName, cardNumber, expiryDate } = req.body;
    // Remove spaces from card number before saving
    const cleanNumber = (cardNumber || '').replace(/\s/g, '');
    const card = await BankCard.create({ ownerId, cardHolderName, cardNumber: cleanNumber, expiryDate });
    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/cards/:id
const updateCard = async (req, res) => {
  try {
    const { cardHolderName, cardNumber, expiryDate } = req.body;
    const cleanNumber = (cardNumber || '').replace(/\s/g, '');
    const card = await BankCard.findByIdAndUpdate(
      req.params.id,
      { cardHolderName, cardNumber: cleanNumber, expiryDate },
      { new: true }
    );
    if (!card) return res.status(404).json({ message: 'Card not found' });
    res.json(card);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/cards/:id
const deleteCard = async (req, res) => {
  try {
    await BankCard.findByIdAndDelete(req.params.id);
    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCards, saveCard, updateCard, deleteCard };
