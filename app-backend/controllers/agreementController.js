const Agreement = require("../models/Agreement");
const Property = require("../models/Property");
const path = require("path");
const fs = require("fs");

// ─── Helper: standard error response ─────────────────────────────────────────
const sendError = (res, status, message) =>
  res.status(status).json({ message });

// ─── GET /api/agreements/my ───────────────────────────────────────────────────
// Returns agreements for the logged-in user (tenant OR owner)
const getMyAgreements = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let query = {};
    if (role === "tenant") query.tenant = userId;
    else if (role === "owner") query.owner = userId;
    else return sendError(res, 403, "Admins cannot access this endpoint");

    const agreements = await Agreement.find(query)
      .populate("property", "title location price images propertyType bedrooms bathrooms")
      .populate("tenant", "name email phone")
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    res.json(agreements);
  } catch (err) {
    console.error("getMyAgreements error:", err);
    sendError(res, 500, "Server error fetching agreements");
  }
};

// ─── GET /api/agreements/:id ──────────────────────────────────────────────────
// Returns a single agreement — only accessible by tenant or owner of the agreement
const getAgreementById = async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id)
      .populate("property", "title location price images propertyType bedrooms bathrooms description termsAndConditions")
      .populate("tenant", "name email phone")
      .populate("owner", "name email phone");

    if (!agreement) return sendError(res, 404, "Agreement not found");

    const userId = req.user._id.toString();
    const isTenant = agreement.tenant._id.toString() === userId;
    const isOwner = agreement.owner._id.toString() === userId;

    if (!isTenant && !isOwner) {
      return sendError(res, 403, "Not authorised to view this agreement");
    }

    res.json(agreement);
  } catch (err) {
    console.error("getAgreementById error:", err);
    sendError(res, 500, "Server error fetching agreement");
  }
};

// ─── POST /api/agreements ─────────────────────────────────────────────────────
// Create a new agreement (owner initiates after booking approval)
const createAgreement = async (req, res) => {
  try {
    const {
      propertyId,
      tenantId,
      leaseStartDate,
      leaseEndDate,
      rentAmount,
      securityDeposit,
      notes,
    } = req.body;

    if (!propertyId || !tenantId || !leaseStartDate || !leaseEndDate || !rentAmount) {
      return sendError(res, 400, "Missing required fields");
    }

    const property = await Property.findById(propertyId);
    if (!property) return sendError(res, 404, "Property not found");

    // Only the owner of the property can create an agreement for it
    if (property.owner.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Only the property owner can create an agreement");
    }

    const agreement = await Agreement.create({
      property: propertyId,
      tenant: tenantId,
      owner: req.user._id,
      leaseStartDate,
      leaseEndDate,
      rentAmount,
      securityDeposit: securityDeposit || 0,
      notes: notes || null,
      status: "PENDING",
    });

    const populated = await agreement.populate([
      { path: "property", select: "title location price images propertyType bedrooms bathrooms" },
      { path: "tenant", select: "name email phone" },
      { path: "owner", select: "name email phone" },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    console.error("createAgreement error:", err);
    sendError(res, 500, "Server error creating agreement");
  }
};

// ─── PUT /api/agreements/:id/accept ──────────────────────────────────────────
// Tenant accepts a PENDING agreement → status becomes ACTIVE
const acceptAgreement = async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return sendError(res, 404, "Agreement not found");

    if (agreement.tenant.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Only the tenant can accept this agreement");
    }
    if (agreement.status !== "PENDING") {
      return sendError(res, 400, `Cannot accept an agreement with status '${agreement.status}'`);
    }

    agreement.status = "ACTIVE";
    await agreement.save();

    res.json({ message: "Agreement accepted successfully", agreement });
  } catch (err) {
    console.error("acceptAgreement error:", err);
    sendError(res, 500, "Server error accepting agreement");
  }
};

// ─── PUT /api/agreements/:id/reject ──────────────────────────────────────────
// Tenant rejects a PENDING agreement → status becomes CANCELLED
const rejectAgreement = async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return sendError(res, 404, "Agreement not found");

    if (agreement.tenant.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Only the tenant can reject this agreement");
    }
    if (agreement.status !== "PENDING") {
      return sendError(res, 400, `Cannot reject an agreement with status '${agreement.status}'`);
    }

    agreement.status = "CANCELLED";
    await agreement.save();

    res.json({ message: "Agreement rejected successfully", agreement });
  } catch (err) {
    console.error("rejectAgreement error:", err);
    sendError(res, 500, "Server error rejecting agreement");
  }
};

// ─── PUT /api/agreements/:id/terminate ───────────────────────────────────────
// Tenant requests early termination of an ACTIVE agreement
const requestTermination = async (req, res) => {
  try {
    const { reason } = req.body;
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return sendError(res, 404, "Agreement not found");

    if (agreement.tenant.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Only the tenant can request termination");
    }
    if (agreement.status !== "ACTIVE") {
      return sendError(res, 400, "Can only request termination of an ACTIVE agreement");
    }

    // Calculate penalty: 1 month's rent if more than 30 days remain
    const today = new Date();
    const endDate = new Date(agreement.leaseEndDate);
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    const penalty = daysRemaining > 30 ? agreement.rentAmount : 0;

    agreement.status = "TERMINATION_REQUESTED";
    agreement.terminationReason = reason || "Requested by tenant";
    agreement.terminationPenalty = penalty;
    await agreement.save();

    res.json({
      message: "Termination request submitted",
      terminationPenalty: penalty,
      agreement,
    });
  } catch (err) {
    console.error("requestTermination error:", err);
    sendError(res, 500, "Server error requesting termination");
  }
};

// ─── PUT /api/agreements/:id/terminate/accept ─────────────────────────────────
// Owner accepts a termination request → status becomes TERMINATED
const acceptTermination = async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return sendError(res, 404, "Agreement not found");

    if (agreement.owner.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Only the owner can accept termination");
    }
    if (agreement.status !== "TERMINATION_REQUESTED") {
      return sendError(res, 400, "No pending termination request on this agreement");
    }

    agreement.status = "TERMINATED";
    await agreement.save();

    res.json({ message: "Termination accepted", agreement });
  } catch (err) {
    console.error("acceptTermination error:", err);
    sendError(res, 500, "Server error accepting termination");
  }
};

// ─── PUT /api/agreements/:id/terminate/reject ─────────────────────────────────
// Owner rejects a termination request → status reverts to ACTIVE
const rejectTermination = async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return sendError(res, 404, "Agreement not found");

    if (agreement.owner.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Only the owner can reject termination");
    }
    if (agreement.status !== "TERMINATION_REQUESTED") {
      return sendError(res, 400, "No pending termination request on this agreement");
    }

    agreement.status = "ACTIVE";
    agreement.terminationReason = null;
    agreement.terminationPenalty = 0;
    await agreement.save();

    res.json({ message: "Termination rejected, agreement remains active", agreement });
  } catch (err) {
    console.error("rejectTermination error:", err);
    sendError(res, 500, "Server error rejecting termination");
  }
};

// ─── PUT /api/agreements/:id/upload-signature ─────────────────────────────────
// Tenant uploads their signed image. status: CREATED → SIGNED_BY_TENANT
const uploadSignature = async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return sendError(res, 404, "Agreement not found");

    if (agreement.tenant.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Only the tenant can upload a signature");
    }
    if (!["CREATED", "PENDING"].includes(agreement.status)) {
      return sendError(
        res,
        400,
        `Cannot upload signature for an agreement with status '${agreement.status}'`
      );
    }
    if (!req.file) {
      return sendError(res, 400, "No image file uploaded");
    }

    // Remove old signature file if it exists
    if (agreement.signatureImagePath) {
      const oldPath = path.join(__dirname, "..", agreement.signatureImagePath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    agreement.signatureImagePath = `uploads/signatures/${req.file.filename}`;
    agreement.status = "SIGNED_BY_TENANT";
    await agreement.save();

    res.json({
      message: "Signature uploaded successfully",
      signatureImagePath: agreement.signatureImagePath,
      status: agreement.status,
    });
  } catch (err) {
    console.error("uploadSignature error:", err);
    sendError(res, 500, "Server error uploading signature");
  }
};

// ─── PUT /api/agreements/:id/owner-approve ────────────────────────────────────
// Owner approves. status: SIGNED_BY_TENANT → APPROVED_BY_OWNER
const ownerApproveAgreement = async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id)
      .populate("property", "title location price images propertyType bedrooms bathrooms")
      .populate("tenant", "name email phone")
      .populate("owner", "name email phone");

    if (!agreement) return sendError(res, 404, "Agreement not found");

    if (agreement.owner._id.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Only the property owner can approve this agreement");
    }
    if (agreement.status !== "SIGNED_BY_TENANT") {
      return sendError(
        res,
        400,
        `Cannot approve — expected SIGNED_BY_TENANT, got '${agreement.status}'`
      );
    }

    agreement.status = "APPROVED_BY_OWNER";
    await agreement.save();

    res.json({ message: "Agreement approved by owner", agreement });
  } catch (err) {
    console.error("ownerApproveAgreement error:", err);
    sendError(res, 500, "Server error approving agreement");
  }
};

// ─── PUT /api/agreements/:id/owner-reject ─────────────────────────────────────
// Owner rejects. status: SIGNED_BY_TENANT → REJECTED_BY_OWNER
const ownerRejectAgreement = async (req, res) => {
  try {
    const { reason } = req.body;
    const agreement = await Agreement.findById(req.params.id);

    if (!agreement) return sendError(res, 404, "Agreement not found");

    if (agreement.owner.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Only the property owner can reject this agreement");
    }
    if (agreement.status !== "SIGNED_BY_TENANT") {
      return sendError(
        res,
        400,
        `Cannot reject — expected SIGNED_BY_TENANT, got '${agreement.status}'`
      );
    }

    agreement.status = "REJECTED_BY_OWNER";
    agreement.ownerRejectReason = reason || "No reason provided";
    await agreement.save();

    res.json({ message: "Agreement rejected by owner", agreement });
  } catch (err) {
    console.error("ownerRejectAgreement error:", err);
    sendError(res, 500, "Server error rejecting agreement");
  }
};

// ─── GET /api/agreements/:id/pdf ──────────────────────────────────────────────
// Returns HTML string for client-side PDF rendering via expo-print
// Only available when status === APPROVED_BY_OWNER
const generateAgreementPDF = async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id)
      .populate("property", "title location price images propertyType bedrooms bathrooms description termsAndConditions")
      .populate("tenant", "name email phone")
      .populate("owner", "name email phone");

    if (!agreement) return sendError(res, 404, "Agreement not found");

    const userId = req.user._id.toString();
    const isTenant = agreement.tenant._id.toString() === userId;
    const isOwner = agreement.owner._id.toString() === userId;
    if (!isTenant && !isOwner) {
      return sendError(res, 403, "Not authorised to access this agreement");
    }
    if (agreement.status !== "APPROVED_BY_OWNER") {
      return sendError(res, 400, "PDF is only available for APPROVED_BY_OWNER agreements");
    }

    const property = agreement.property || {};
    const tenant = agreement.tenant || {};
    const owner = agreement.owner || {};

    const fmt = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "—";

    // Embed signature image as base64 if available
    let signatureHtml = '<p style="color:#888">No signature on file.</p>';
    if (agreement.signatureImagePath) {
      const absPath = path.join(__dirname, "..", agreement.signatureImagePath);
      if (fs.existsSync(absPath)) {
        const ext = path.extname(absPath).slice(1).toLowerCase();
        const mimeMap = { jpg: "jpeg", jpeg: "jpeg", png: "png", gif: "gif", webp: "webp" };
        const mime = mimeMap[ext] || "png";
        const b64 = fs.readFileSync(absPath).toString("base64");
        signatureHtml = `<img src="data:image/${mime};base64,${b64}" style="max-width:260px;max-height:120px;border:1px solid #ccc;border-radius:6px;" alt="Tenant Signature" />`;
      }
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a2e; margin: 0; padding: 0; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px 48px; }
  h1 { font-size: 26px; color: #006591; margin-bottom: 4px; }
  .subtitle { font-size: 13px; color: #555; margin-bottom: 28px; }
  .badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 28px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #006591; border-bottom: 2px solid #e0f2fe; padding-bottom: 6px; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 10px; font-size: 13px; vertical-align: top; }
  td:first-child { color: #555; font-weight: 600; width: 40%; }
  tr:nth-child(even) td { background: #f8fafc; }
  .sig-box { border: 1px dashed #aaa; border-radius: 8px; padding: 16px; background: #fafafa; display: inline-block; min-width: 260px; min-height: 80px; }
  .footer { margin-top: 40px; border-top: 1px solid #e0e0e0; padding-top: 18px; font-size: 11px; color: #888; text-align: center; }
  .agr-num { font-size: 12px; font-weight: 700; color: #888; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
</style>
</head>
<body>
<div class="page">
  <p class="agr-num">${agreement.agreementNumber || ""}</p>
  <h1>Rental Agreement</h1>
  <p class="subtitle">Generated on ${fmt(new Date())} &bull; RentEase Platform</p>
  <span class="badge">APPROVED BY OWNER</span>

  <div class="section">
    <div class="section-title">Property Details</div>
    <table>
      <tr><td>Property</td><td>${property.title || "—"}</td></tr>
      <tr><td>Location</td><td>${property.location || "—"}</td></tr>
      <tr><td>Type</td><td>${property.propertyType || "—"}</td></tr>
      <tr><td>Bedrooms</td><td>${property.bedrooms ?? "—"}</td></tr>
      <tr><td>Bathrooms</td><td>${property.bathrooms ?? "—"}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Lease Terms</div>
    <table>
      <tr><td>Start Date</td><td>${fmt(agreement.leaseStartDate)}</td></tr>
      <tr><td>End Date</td><td>${fmt(agreement.leaseEndDate)}</td></tr>
      <tr><td>Monthly Rent</td><td>LKR ${Number(agreement.rentAmount || 0).toLocaleString()}</td></tr>
      <tr><td>Security Deposit</td><td>LKR ${Number(agreement.securityDeposit || 0).toLocaleString()}</td></tr>
      ${agreement.notes ? `<tr><td>Notes</td><td>${agreement.notes}</td></tr>` : ""}
    </table>
  </div>

  ${property.termsAndConditions ? `
  <div class="section">
    <div class="section-title">Terms &amp; Conditions</div>
    <div style="font-size: 12px; color: #444; background: #fafafa; padding: 12px; border-radius: 6px; border: 1px solid #eee; white-space: pre-wrap;">${property.termsAndConditions}</div>
  </div>
  ` : ""}

  <div class="section">
    <div class="section-title">Tenant Details</div>
    <table>
      <tr><td>Name</td><td>${tenant.name || "—"}</td></tr>
      <tr><td>Email</td><td>${tenant.email || "—"}</td></tr>
      <tr><td>Phone</td><td>${tenant.phone || "—"}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Owner Details</div>
    <table>
      <tr><td>Name</td><td>${owner.name || "—"}</td></tr>
      <tr><td>Email</td><td>${owner.email || "—"}</td></tr>
      <tr><td>Phone</td><td>${owner.phone || "—"}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Tenant Signature</div>
    <div class="sig-box">${signatureHtml}</div>
    <p style="font-size:12px;color:#555;margin-top:8px;">Signed by: <strong>${tenant.name || "—"}</strong></p>
  </div>

  <div class="footer">
    This is a legally binding document generated by the RentEase platform.<br/>
    Agreement #${agreement.agreementNumber || "N/A"} &bull; Approved on ${fmt(agreement.updatedAt)}
  </div>
</div>
</body>
</html>`;

    res.json({ html });
  } catch (err) {
    console.error("generateAgreementPDF error:", err);
    sendError(res, 500, "Server error generating PDF");
  }
};

module.exports = {
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
};
