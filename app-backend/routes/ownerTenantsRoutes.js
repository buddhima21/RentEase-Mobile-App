const express = require('express');
const router  = express.Router();
const { getOwnerTenants } = require('../controllers/ownerTenantsController');

// GET /api/owner-tenants/:ownerId
router.get('/:ownerId', getOwnerTenants);

module.exports = router;
