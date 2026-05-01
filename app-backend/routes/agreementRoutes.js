const express = require("express");
const router = express.Router();
const {
  getMyAgreements,
  getAgreementById,
  createAgreement,
  acceptAgreement,
  rejectAgreement,
  requestTermination,
  acceptTermination,
  rejectTermination,
} = require("../controllers/agreementController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// All agreement routes require authentication
router.use(protect);

// ── Tenant & Owner: view their own agreements ──────────────────────────────
router.get("/my", authorizeRoles("tenant", "owner"), getMyAgreements);
router.get("/:id", authorizeRoles("tenant", "owner"), getAgreementById);

// ── Owner: create a new agreement ─────────────────────────────────────────
router.post("/", authorizeRoles("owner"), createAgreement);

// ── Tenant: accept / reject a PENDING agreement ────────────────────────────
router.put("/:id/accept", authorizeRoles("tenant"), acceptAgreement);
router.put("/:id/reject", authorizeRoles("tenant"), rejectAgreement);

// ── Tenant: request early termination ─────────────────────────────────────
router.put("/:id/terminate", authorizeRoles("tenant"), requestTermination);

// ── Owner: accept / reject a termination request ──────────────────────────
router.put("/:id/terminate/accept", authorizeRoles("owner"), acceptTermination);
router.put("/:id/terminate/reject", authorizeRoles("owner"), rejectTermination);

module.exports = router;
