const mongoose = require("mongoose");

const agreementSchema = new mongoose.Schema(
  {
    agreementNumber: {
      type: String,
      unique: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaseStartDate: {
      type: Date,
      required: true,
    },
    leaseEndDate: {
      type: Date,
      required: true,
    },
    rentAmount: {
      type: Number,
      required: true,
    },
    securityDeposit: {
      type: Number,
      default: 0,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    signatureImagePath: {
      type: String,
      default: null,
    },
    ownerRejectReason: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: [
        // Legacy statuses (kept for backward compatibility)
        "PENDING",
        "ACTIVE",
        "CANCELLED",
        "EXPIRED",
        "TERMINATION_REQUESTED",
        "TERMINATED",
        // New signature-based flow statuses
        "CREATED",
        "SIGNED_BY_TENANT",
        "APPROVED_BY_OWNER",
        "REJECTED_BY_OWNER",
      ],
      default: "CREATED",
    },
    terminationReason: {
      type: String,
      default: null,
    },
    terminationPenalty: {
      type: Number,
      default: 0,
    },
    pdfUrl: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate agreement number before saving
agreementSchema.pre("save", async function () {
  if (!this.agreementNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Agreement").countDocuments();
    const seq = String(count + 1).padStart(4, "0");
    this.agreementNumber = `AGR-${year}-${seq}`;
  }
});

module.exports = mongoose.model("Agreement", agreementSchema);
