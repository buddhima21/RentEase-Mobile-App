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
  // ── New signature-based workflow ──
  uploadSignature,
  ownerApproveAgreement,
  ownerRejectAgreement,
  generateAgreementPDF,
} = require("../controllers/agreementController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { uploadSignature: multerUpload } = require("../middleware/uploadMiddleware");

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

// ── NEW: Tenant: upload signature image ───────────────────────────────────
router.put(
  "/:id/upload-signature",
  authorizeRoles("tenant"),
  multerUpload.single("signature"),
  uploadSignature
);

// ── NEW: Owner: approve / reject signed agreement ─────────────────────────
router.put("/:id/owner-approve", authorizeRoles("owner"), ownerApproveAgreement);
router.put("/:id/owner-reject", authorizeRoles("owner"), ownerRejectAgreement);

// ── NEW: Tenant & Owner: get HTML for PDF download ────────────────────────
router.get("/:id/pdf", authorizeRoles("tenant", "owner"), generateAgreementPDF);

module.exports = router;
