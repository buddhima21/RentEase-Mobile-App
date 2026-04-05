const express = require("express");
const router = express.Router();
const {
  getApprovedProperties,
  getMyProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getAllProperties,
  updatePropertyStatus,
} = require("../controllers/propertyController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// --- Public Routes ---
// Get all APPROVED properties (for anyone browsing)
router.get("/", getApprovedProperties);

// --- Owner Routes ---
// Manage their own properties
router.post("/owner", protect, authorizeRoles("owner"), createProperty);
router.get("/owner/my-properties", protect, authorizeRoles("owner"), getMyProperties);

// Put/Delete for owner specific property
router.route("/owner/:id")
  .put(protect, authorizeRoles("owner"), updateProperty)
  .delete(protect, authorizeRoles("owner"), deleteProperty);

// --- Admin Routes ---
// Admin can view all properties regardless of status
router.get("/admin/all", protect, authorizeRoles("admin"), getAllProperties);

// Admin can approve or reject properties
router.put("/admin/:id/status", protect, authorizeRoles("admin"), updatePropertyStatus);

module.exports = router;
