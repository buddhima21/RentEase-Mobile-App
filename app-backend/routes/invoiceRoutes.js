const express = require('express');
const router  = express.Router();
const {
  getAllInvoices,
  getInvoicesByTenant,
  sendInvoice,
  saveInvoice,
  updateStatus,
  deleteByTenant,
  deleteByOwner,
  generateInvoicePdf,
} = require('../controllers/invoiceController');

router.get('/',                    getAllInvoices);
router.get('/tenant/:tenantId',    getInvoicesByTenant);
router.post('/send',               sendInvoice);
router.post('/save',               saveInvoice);
router.post('/generate-pdf',       generateInvoicePdf);
router.put('/:id/status',          updateStatus);
router.delete('/:id/tenant',       deleteByTenant);
router.delete('/:id/owner',        deleteByOwner);

module.exports = router;
