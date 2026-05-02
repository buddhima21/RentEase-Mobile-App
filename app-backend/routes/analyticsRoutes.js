const express = require("express");
const router = express.Router();
const { getAdminAnalytics, getOwnerAnalytics } = require("../controllers/analyticsController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Routes
router.get("/admin", protect, authorizeRoles("admin"), getAdminAnalytics);
router.get("/owner", protect, authorizeRoles("owner"), getOwnerAnalytics);

module.exports = router;
