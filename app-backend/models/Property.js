const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "Please add a property title"],
    },
    description: {
      type: String,
      required: [true, "Please add a property description"],
    },
    price: {
      type: Number,
      required: [true, "Please add a rental price"],
    },
    location: {
      type: String,
      required: [true, "Please add a location"],
    },
    propertyType: {
      type: String,
      required: [true, "Please add a property type (e.g. Apartment, House)"],
    },
    bedrooms: {
      type: Number,
      required: [true, "Please add number of bedrooms"],
    },
    bathrooms: {
      type: Number,
      required: [true, "Please add number of bathrooms"],
    },
    securityDeposit: {
      type: Number,
      required: [true, "Please add a security deposit fee"],
    },
    termsAndConditions: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Property", propertySchema);
