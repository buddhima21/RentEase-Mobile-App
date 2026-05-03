const express = require('express');
const router = express.Router();
const {
  toggleFavorite,
  getFavorites,
  getFavoriteIds,
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/authMiddleware');

// All favorite routes require authentication
router.use(protect);

// GET /api/favorites       — full favorite property objects (for Saved screen)
router.get('/', getFavorites);

// GET /api/favorites/ids   — just IDs array (for heart icon state check)
router.get('/ids', getFavoriteIds);

// POST /api/favorites/toggle/:propertyId  — add or remove
router.post('/toggle/:propertyId', toggleFavorite);

module.exports = router;
