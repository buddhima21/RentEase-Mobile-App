const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Please add a rating"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, "Please add a comment"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    images: {
      type: [String],
      default: [],
    },
    ownerReply: {
      type: String,
      default: null,
      trim: true
    },
  },
  {
    timestamps: true,
  }
);

// Multiple reviews per user per property are now allowed.

module.exports = mongoose.model("Review", reviewSchema);