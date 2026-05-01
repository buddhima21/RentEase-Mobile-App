const express = require("express");
const router = express.Router();
const {
  createBooking,
  updateBookingDate,
  getMyBookings,
  getOwnerBookingRequests,
  approveBooking,
  rejectBooking,
  removeTenant,
  getOwnerAllocationHistory,
  getPropertyAvailability,
} = require("../controllers/bookingController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// --- Public Routes ---
// Check property bedroom availability
router.get("/availability/:propertyId", getPropertyAvailability);

// --- Tenant Routes ---
router.post("/", protect, authorizeRoles("tenant"), createBooking);
router.put("/:id", protect, authorizeRoles("tenant"), updateBookingDate);
router.get("/my-bookings", protect, authorizeRoles("tenant"), getMyBookings);

// --- Owner Routes ---
router.get("/owner/requests", protect, authorizeRoles("owner"), getOwnerBookingRequests);
router.get("/owner/history", protect, authorizeRoles("owner"), getOwnerAllocationHistory);
router.put("/owner/:id/approve", protect, authorizeRoles("owner"), approveBooking);
router.put("/owner/:id/reject", protect, authorizeRoles("owner"), rejectBooking);
router.put("/owner/:id/remove", protect, authorizeRoles("owner"), removeTenant);

module.exports = router;
