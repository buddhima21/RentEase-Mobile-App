const mongoose = require("mongoose");

const maintenanceRequestSchema = new mongoose.Schema(
  {
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
    category: {
      type: String,
      enum: ["Plumbing", "Electrical", "Appliance", "General"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    entryPermission: {
      type: String,
      enum: ["GRANTED_MASTER_KEY", "CONTACT_TO_SCHEDULE"],
      required: true,
    },
    status: {
      type: String,
      enum: ["SUBMITTED", "ACTION_SCHEDULED", "AWAITING_PARTS", "RESOLVED", "CLOSED"],
      default: "SUBMITTED",
    },
    adminNotes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);
