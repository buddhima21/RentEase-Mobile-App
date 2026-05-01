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
    status: {
      type: String,
      enum: [
        "PENDING",
        "ACTIVE",
        "CANCELLED",
        "EXPIRED",
        "TERMINATION_REQUESTED",
        "TERMINATED",
      ],
      default: "PENDING",
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
agreementSchema.pre("save", async function (next) {
  if (!this.agreementNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Agreement").countDocuments();
    const seq = String(count + 1).padStart(4, "0");
    this.agreementNumber = `AGR-${year}-${seq}`;
  }
  next();
});

module.exports = mongoose.model("Agreement", agreementSchema);
