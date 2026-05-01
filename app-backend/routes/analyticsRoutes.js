const express = require("express");
const router = express.Router();
const { getAdminAnalytics, getOwnerAnalytics } = require("../controllers/analyticsController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// GET /api/analytics/admin
router.get("/admin", protect, authorizeRoles("admin"), getAdminAnalytics);

// GET /api/analytics/owner
router.get("/owner", protect, authorizeRoles("owner"), getOwnerAnalytics);

module.exports = router;
