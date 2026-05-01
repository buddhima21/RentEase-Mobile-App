const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "property_submitted",   // owner submits a property
        "property_approved",    // admin approves
        "property_rejected",    // admin rejects
        "booking_received",     // owner receives a booking request
        "booking_approved",     // tenant's booking is approved
        "booking_rejected",     // tenant's booking is rejected
        "booking_removed",      // tenant is removed from property
        "general",
      ],
      required: true,
    },
    title: { type: String, required: true },
    body:  { type: String, required: true },
    isRead: { type: Boolean, default: false },
    // Optional reference to the related document
    refId:   { type: String, default: null },
    refModel:{ type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
