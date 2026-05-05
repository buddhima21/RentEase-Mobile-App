const Booking = require("../models/Booking");
const Property = require("../models/Property");
const Agreement = require("../models/Agreement");
const { createNotification } = require("./notificationController");

// @desc    Create a new booking request
// @route   POST /api/bookings
// @access  Private (Tenant)
const createBooking = async (req, res) => {
  try {
    const { propertyId, preferredDate, idDocument, idDocumentName } = req.body;

    // Validate required fields
    if (!propertyId) {
      return res.status(400).json({ message: "Property ID is required" });
    }
    if (!preferredDate) {
      return res.status(400).json({ message: "Preferred date is required" });
    }


    // Validate preferred date is in the future
    const selectedDate = new Date(preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({ message: "Preferred date must be today or in the future" });
    }

    // Check property exists and is approved
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    if (property.status !== "approved") {
      return res.status(400).json({ message: "This property is not available for booking" });
    }

    // Check tenant hasn't already booked this property (pending or approved)
    const existingBooking = await Booking.findOne({
      property: propertyId,
      tenant: req.user.id,
      status: { $in: ["pending", "approved"] },
    });
    if (existingBooking) {
      return res.status(400).json({
        message:
          existingBooking.status === "pending"
            ? "You already have a pending booking request for this property"
            : "You are already allocated to this property",
      });
    }

    // Check bedroom capacity
    const approvedBookingsCount = await Booking.countDocuments({
      property: propertyId,
      status: "approved",
    });
    if (approvedBookingsCount >= property.bedrooms) {
      return res.status(400).json({
        message: "This property is fully booked. All bedrooms are occupied.",
      });
    }

    // Create booking
    const booking = await Booking.create({
      property: propertyId,
      tenant: req.user.id,
      owner: property.owner,
      preferredDate: selectedDate,
      idDocument,
      idDocumentName: idDocumentName || "document",
      status: "pending",
    });

    // Populate and return
    const populatedBooking = await Booking.findById(booking._id)
      .populate("property", "title location price bedrooms bathrooms images propertyType")
      .populate("tenant", "name email phone")
      .populate("owner", "name email phone");

    res.status(201).json(populatedBooking);

    // Notify the tenant: booking submitted
    await createNotification({
      recipient: req.user.id,
      type: "booking_received",
      title: "Booking Request Submitted",
      body: `Your booking request for "${property.title}" has been sent to the owner and is awaiting approval.`,
      refId: booking._id.toString(),
      refModel: "Booking",
    });

    // Notify the owner: new booking received
    await createNotification({
      recipient: property.owner,
      type: "booking_received",
      title: "New Booking Request 📬",
      body: `You have a new booking request for "${property.title}". Review it in your dashboard.`,
      refId: booking._id.toString(),
      refModel: "Booking",
    });
  } catch (error) {
    console.error("Create Booking Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a pending booking's preferred date
// @route   PUT /api/bookings/:id
// @access  Private (Tenant)
const updateBookingDate = async (req, res) => {
  try {
    const { preferredDate } = req.body;

    if (!preferredDate) {
      return res.status(400).json({ message: "Preferred date is required" });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify ownership
    if (booking.tenant.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this booking" });
    }

    // Can only edit pending bookings
    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Only pending bookings can be edited" });
    }

    // Validate preferred date is in the future
    const selectedDate = new Date(preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({ message: "Preferred date must be today or in the future" });
    }

    booking.preferredDate = selectedDate;
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("property", "title location price bedrooms bathrooms images propertyType")
      .populate("owner", "name email phone");

    res.status(200).json(populatedBooking);
  } catch (error) {
    console.error("Update Booking Date Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all bookings for the logged-in tenant
// @route   GET /api/bookings/my-bookings
// @access  Private (Tenant)
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ tenant: req.user.id })
      .populate("property", "title location price bedrooms bathrooms images propertyType")
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Get My Bookings Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all booking requests for properties owned by logged-in owner
// @route   GET /api/bookings/owner/requests
// @access  Private (Owner)
const getOwnerBookingRequests = async (req, res) => {
  try {
    // Get only pending bookings for this owner's properties
    const bookings = await Booking.find({
      owner: req.user.id,
      status: "pending",
    })
      .populate("property", "title location price bedrooms bathrooms images propertyType")
      .populate("tenant", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Get Owner Booking Requests Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Approve a booking request
// @route   PUT /api/bookings/owner/:id/approve
// @access  Private (Owner)
const approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("property");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify this owner owns the property
    if (booking.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to approve this booking" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ message: "This booking is no longer pending" });
    }

    // Re-check bedroom capacity before approving
    const approvedBookingsCount = await Booking.countDocuments({
      property: booking.property._id,
      status: "approved",
    });

    if (approvedBookingsCount >= booking.property.bedrooms) {
      return res.status(400).json({
        message: "Cannot approve — all bedrooms in this property are already allocated.",
      });
    }

    booking.status = "approved";
    await booking.save();

    // ── Auto-create Agreement on booking approval ──────────────────────────
    try {
      const leaseStart = new Date(booking.preferredDate);
      const leaseEnd = new Date(leaseStart);
      leaseEnd.setFullYear(leaseEnd.getFullYear() + 1);

      // Only create if no agreement already exists for this booking
      const existingAgreement = await Agreement.findOne({ booking: booking._id });
      if (!existingAgreement) {
        await Agreement.create({
          booking: booking._id,
          property: booking.property._id,
          tenant: booking.tenant,
          owner: booking.owner,
          leaseStartDate: leaseStart,
          leaseEndDate: leaseEnd,
          rentAmount: booking.property.price || 0,
          securityDeposit: 0,
          status: "CREATED",
          notes: "Auto-generated on booking approval",
        });
      }
    } catch (agrErr) {
      // Non-critical: log but don't fail the booking approval
      console.error("Auto-create agreement error:", agrErr.message);
    }
    // ─────────────────────────────────────────────────────────────────────────

    const populatedBooking = await Booking.findById(booking._id)
      .populate("property", "title location price bedrooms bathrooms images propertyType")
      .populate("tenant", "name email phone")
      .populate("owner", "name email phone");

    res.status(200).json(populatedBooking);

    // Notify the tenant that their booking was approved
    await createNotification({
      recipient: booking.tenant,
      type: "booking_approved",
      title: "Booking Approved 🎉",
      body: `Your booking for "${populatedBooking.property?.title}" has been approved by the owner. Welcome home!`,
      refId: booking._id.toString(),
      refModel: "Booking",
    });
  } catch (error) {
    console.error("Approve Booking Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Reject a booking request
// @route   PUT /api/bookings/owner/:id/reject
// @access  Private (Owner)
const rejectBooking = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify this owner owns the property
    if (booking.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to reject this booking" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ message: "This booking is no longer pending" });
    }

    booking.status = "rejected";
    booking.rejectionReason = rejectionReason || "No reason provided";
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("property", "title location price bedrooms bathrooms images propertyType")
      .populate("tenant", "name email phone")
      .populate("owner", "name email phone");

    res.status(200).json(populatedBooking);

    // Notify the tenant that their booking was rejected
    await createNotification({
      recipient: booking.tenant,
      type: "booking_rejected",
      title: "Booking Request Declined",
      body: `Your booking for "${populatedBooking.property?.title}" was declined by the owner. Reason: ${booking.rejectionReason}`,
      refId: booking._id.toString(),
      refModel: "Booking",
    });
  } catch (error) {
    console.error("Reject Booking Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Remove an allocated tenant from a property (frees up bedroom slot)
// @route   PUT /api/bookings/owner/:id/remove
// @access  Private (Owner)
const removeTenant = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify this owner owns the property
    if (booking.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to remove this tenant" });
    }

    if (booking.status !== "approved") {
      return res.status(400).json({ message: "Only allocated tenants can be removed" });
    }

    booking.status = "removed";
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("property", "title location price bedrooms bathrooms images propertyType")
      .populate("tenant", "name email phone")
      .populate("owner", "name email phone");

    res.status(200).json(populatedBooking);

    // Notify the tenant they have been removed
    await createNotification({
      recipient: booking.tenant,
      type: "booking_removed",
      title: "Tenancy Ended",
      body: `Your tenancy for "${populatedBooking.property?.title}" has ended. You have been removed from the property.`,
      refId: booking._id.toString(),
      refModel: "Booking",
    });
  } catch (error) {
    console.error("Remove Tenant Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get allocation history for owner's properties
// @route   GET /api/bookings/owner/history
// @access  Private (Owner)
const getOwnerAllocationHistory = async (req, res) => {
  try {
    const bookings = await Booking.find({
      owner: req.user.id,
    })
      .populate("property", "title location price bedrooms bathrooms images propertyType")
      .populate("tenant", "name email phone")
      .sort({ updatedAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Get Owner Allocation History Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get available bedroom count for a property
// @route   GET /api/bookings/availability/:propertyId
// @access  Public
const getPropertyAvailability = async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const approvedBookingsCount = await Booking.countDocuments({
      property: req.params.propertyId,
      status: "approved",
    });

    const availableBedrooms = Math.max(0, property.bedrooms - approvedBookingsCount);

    res.status(200).json({
      totalBedrooms: property.bedrooms,
      occupiedBedrooms: approvedBookingsCount,
      availableBedrooms,
      isFullyBooked: availableBedrooms === 0,
    });
  } catch (error) {
    console.error("Get Property Availability Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createBooking,
  updateBookingDate,
  getMyBookings,
  getOwnerBookingRequests,
  approveBooking,
  rejectBooking,
  removeTenant,
  getOwnerAllocationHistory,
  getPropertyAvailability,
};
