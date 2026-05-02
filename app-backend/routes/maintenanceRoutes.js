const express = require("express");
const router = express.Router();
const {
  createMaintenanceRequest,
  getMyMaintenanceRequests,
  getAllMaintenanceRequests,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
} = require("../controllers/maintenanceController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Routes
router.route("/")
  .post(protect, authorizeRoles("tenant"), createMaintenanceRequest)
  .get(protect, authorizeRoles("admin"), getAllMaintenanceRequests);

router.route("/my")
  .get(protect, authorizeRoles("tenant"), getMyMaintenanceRequests);

router.route("/:id")
  .get(protect, getMaintenanceRequestById)
  .put(protect, updateMaintenanceRequest)
  .delete(protect, authorizeRoles("tenant"), deleteMaintenanceRequest);

module.exports = router;
