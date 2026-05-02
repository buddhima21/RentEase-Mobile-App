const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Property",
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    preferredDate: {
      type: Date,
      required: [true, "Please select a preferred date"],
    },
    idDocument: {
      type: String,
    },
    idDocumentName: {
      type: String,
      default: "document",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "removed"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", bookingSchema);
