const express = require('express');
const router  = express.Router();
const {
  getWallet,
  withdraw,
  deposit,
  getTransactions,
} = require('../controllers/walletController');

router.get('/:ownerId',               getWallet);
router.post('/:ownerId/withdraw',     withdraw);
router.post('/:ownerId/deposit',      deposit);
router.get('/:ownerId/transactions',  getTransactions);

module.exports = router;
