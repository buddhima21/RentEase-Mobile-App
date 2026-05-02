const express = require("express");
const router = express.Router();
const {
  getReviews,
  addReview,
  updateReview,
  deleteReview,
  getAllReviews,
  getOwnerReviews,
  updateReviewStatus,
  addOwnerReply,
  deleteReviewByOwner,
} = require("../controllers/reviewController");
const { protect, authorizeRoles, protectOptional } = require("../middleware/authMiddleware");

// Admin - get all reviews
router.get("/admin/all", protect, authorizeRoles("admin"), getAllReviews);

// Owner - get reviews and moderate
router.get("/owner/me", protect, authorizeRoles("owner"), getOwnerReviews);
router.put("/owner/:id/status", protect, authorizeRoles("owner"), updateReviewStatus);
router.put("/owner/:id/reply", protect, authorizeRoles("owner"), addOwnerReply);
router.delete("/owner/:id", protect, authorizeRoles("owner"), deleteReviewByOwner);

// Get reviews for a property / Add review
router.route("/:propertyId")
  .get(protectOptional, getReviews)
  .post(protect, addReview);

// Update / Delete a specific review
router.route("/:id")
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;