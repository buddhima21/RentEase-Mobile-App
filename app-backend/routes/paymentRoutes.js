const express = require('express');
const router  = express.Router();
const {
  getDuePayments,
  getPaymentHistory,
  createPayment,
} = require('../controllers/paymentController');

router.get('/due/:tenantId',     getDuePayments);
router.get('/history/:tenantId', getPaymentHistory);
router.post('/',                 createPayment);

module.exports = router;
