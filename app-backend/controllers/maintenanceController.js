const MaintenanceRequest = require("../models/MaintenanceRequest");
const Booking = require("../models/Booking");

const isInvalidObjectIdError = (error) =>
  error?.name === "CastError" && error?.kind === "ObjectId";

const handleMaintenanceError = (res, error, fallbackMessage) => {
  if (isInvalidObjectIdError(error)) {
    return res.status(400).json({ message: "Invalid maintenance request id." });
  }

  if (error?.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: fallbackMessage });
};

// @desc    Create a new maintenance request
// @route   POST /api/maintenance
// @access  Private (Tenant)
const createMaintenanceRequest = async (req, res) => {
  try {
    const { category, description, images, entryPermission, propertyId } = req.body;
    
    // Find approved bookings for the tenant (allocated to a property)
    const approvedBookings = await Booking.find({
      tenant: req.user._id,
      status: "approved",
    });

    if (approvedBookings.length === 0) {
      return res.status(400).json({ message: "No approved booking found. You must be allocated to a property to submit a maintenance request." });
    }

    let selectedPropertyId;

    if (approvedBookings.length === 1) {
      selectedPropertyId = approvedBookings[0].property;
    } else {
      if (!propertyId) {
        return res.status(400).json({ message: "Please select a property for this request." });
      }
      // Ensure the provided propertyId matches an approved booking
      const matchingBooking = approvedBookings.find(
        (b) => b.property.toString() === propertyId
      );
      if (!matchingBooking) {
        return res.status(400).json({ message: "Invalid property selected." });
      }
      selectedPropertyId = propertyId;
    }

    const newRequest = await MaintenanceRequest.create({
      property: selectedPropertyId,
      tenant: req.user._id,
      category,
      description,
      images: images || [],
      entryPermission,
      status: "SUBMITTED",
    });

    res.status(201).json(newRequest);
  } catch (error) {
    return handleMaintenanceError(
      res,
      error,
      "Server Error: Could not create maintenance request."
    );
  }
};

// @desc    Get all maintenance requests for current user (Tenant)
// @route   GET /api/maintenance/my
// @access  Private (Tenant)
const getMyMaintenanceRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({ tenant: req.user._id })
      .populate("property", "title location")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    return handleMaintenanceError(
      res,
      error,
      "Server Error: Could not fetch requests."
    );
  }
};

// @desc    Get all maintenance requests (Admin)
// @route   GET /api/maintenance
// @access  Private (Admin)
const getAllMaintenanceRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({})
      .populate("property", "title location")
      .populate("tenant", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    return handleMaintenanceError(
      res,
      error,
      "Server Error: Could not fetch all requests."
    );
  }
};

// @desc    Get single maintenance request
// @route   GET /api/maintenance/:id
// @access  Private
const getMaintenanceRequestById = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate("property", "title location")
      .populate("tenant", "name email phone");

    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found." });
    }

    // Check ownership if not admin
    if (
      req.user.role !== "admin" &&
      request.tenant._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to view this request." });
    }

    res.status(200).json(request);
  } catch (error) {
    return handleMaintenanceError(
      res,
      error,
      "Server Error: Could not fetch request details."
    );
  }
};

// @desc    Update maintenance request status (Admin or Tenant depending on state)
// @route   PUT /api/maintenance/:id
// @access  Private
const updateMaintenanceRequest = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found." });
    }

    // Admin updates
    if (req.user.role === "admin") {
      if (status) {
        // Admin cannot move to CLOSED
        if (status === "CLOSED") {
          return res.status(400).json({ message: "Admin cannot close the ticket directly." });
        }
        request.status = status;
      }
      if (adminNotes !== undefined) {
        request.adminNotes = adminNotes;
      }
    } 
    // Tenant updates
    else if (req.user.role === "tenant") {
      // Check ownership
      if (request.tenant.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to update this request." });
      }

      if (status) {
        // Tenant can only resolve -> closed, or resolved -> submitted
        if (request.status === "RESOLVED" && (status === "CLOSED" || status === "SUBMITTED")) {
          request.status = status;
        } else {
          return res.status(400).json({ message: "Invalid status transition for tenant." });
        }
      }
    }

    const updatedRequest = await request.save();
    res.status(200).json(updatedRequest);
  } catch (error) {
    return handleMaintenanceError(
      res,
      error,
      "Server Error: Could not update request."
    );
  }
};

// @desc    Delete maintenance request
// @route   DELETE /api/maintenance/:id
// @access  Private (Tenant only, if SUBMITTED)
const deleteMaintenanceRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found." });
    }

    // Only tenant can delete, and only if status is SUBMITTED
    if (req.user.role === "tenant") {
      if (request.tenant.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to delete this request." });
      }
      if (request.status !== "SUBMITTED") {
        return res.status(400).json({ message: "Cannot delete request after it has been processed." });
      }
    } else {
       return res.status(403).json({ message: "Admins cannot delete maintenance requests directly." });
    }

    await MaintenanceRequest.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Maintenance request deleted." });
  } catch (error) {
    return handleMaintenanceError(
      res,
      error,
      "Server Error: Could not delete request."
    );
  }
};

module.exports = {
  createMaintenanceRequest,
  getMyMaintenanceRequests,
  getAllMaintenanceRequests,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
};
