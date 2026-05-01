const MaintenanceRequest = require("../models/MaintenanceRequest");
const Agreement = require("../models/Agreement");

// @desc    Create a new maintenance request
// @route   POST /api/maintenance
// @access  Private (Tenant)
const createMaintenanceRequest = async (req, res) => {
  try {
    const { category, description, images, entryPermission, propertyId } = req.body;
    
    // Find active agreements for the tenant
    const activeAgreements = await Agreement.find({
      tenant: req.user._id,
      status: "ACTIVE",
    });

    if (activeAgreements.length === 0) {
      return res.status(400).json({ message: "No active lease agreement found." });
    }

    let selectedPropertyId;

    if (activeAgreements.length === 1) {
      selectedPropertyId = activeAgreements[0].property;
    } else {
      if (!propertyId) {
        return res.status(400).json({ message: "Please select a property for this request." });
      }
      // Ensure the provided propertyId matches an active agreement
      const matchingAgreement = activeAgreements.find(
        (a) => a.property.toString() === propertyId
      );
      if (!matchingAgreement) {
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
    console.error(error);
    res.status(500).json({ message: "Server Error: Could not create maintenance request." });
  }
};

// @desc    Get all maintenance requests for current user (Tenant)
// @route   GET /api/maintenance/my
// @access  Private (Tenant)
const getMyMaintenanceRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({ tenant: req.user._id })
      .populate("property", "name address")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error: Could not fetch requests." });
  }
};

// @desc    Get all maintenance requests (Admin)
// @route   GET /api/maintenance
// @access  Private (Admin)
const getAllMaintenanceRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({})
      .populate("property", "name address")
      .populate("tenant", "firstName lastName email phone")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error: Could not fetch all requests." });
  }
};

// @desc    Get single maintenance request
// @route   GET /api/maintenance/:id
// @access  Private
const getMaintenanceRequestById = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate("property", "name address")
      .populate("tenant", "firstName lastName email phone");

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
    console.error(error);
    res.status(500).json({ message: "Server Error: Could not fetch request details." });
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
    console.error(error);
    res.status(500).json({ message: "Server Error: Could not update request." });
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
    console.error(error);
    res.status(500).json({ message: "Server Error: Could not delete request." });
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
