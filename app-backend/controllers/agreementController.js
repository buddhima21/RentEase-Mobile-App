const Agreement = require("../models/Agreement");
const Property = require("../models/Property");

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

module.exports = {
  getMyAgreements,
  getAgreementById,
  createAgreement,
  acceptAgreement,
  rejectAgreement,
  requestTermination,
  acceptTermination,
  rejectTermination,
};
