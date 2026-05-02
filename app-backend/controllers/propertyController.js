const Property = require("../models/Property");
const { createNotification } = require("./notificationController");

// @desc    Get all approved properties
// @route   GET /api/properties
// @access  Public
const getApprovedProperties = async (req, res) => {
  try {
    const properties = await Property.find(
      { status: "approved" },
      { images: { $slice: 1 } }
    ).populate("owner", "name email phone");
    res.status(200).json(properties);
  } catch (error) {
    console.error("Error fetching approved properties:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get logged in owner's properties
// @route   GET /api/properties/owner/my-properties
// @access  Private (Owner)
const getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find(
      { owner: req.user.id },
      { images: { $slice: 1 } }
    );
    res.status(200).json(properties);
  } catch (error) {
    console.error("Error fetching owner properties:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create a new property
// @route   POST /api/properties/owner
// @access  Private (Owner)
const createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      location,
      propertyType,
      bedrooms,
      bathrooms,
      securityDeposit,
      termsAndConditions,
      images,
      amenities,
    } = req.body;

    const property = await Property.create({
      owner: req.user.id,
      title,
      description,
      price,
      location,
      propertyType,
      bedrooms,
      bathrooms,
      securityDeposit,
      termsAndConditions,
      images,
      amenities: amenities || [],
    });

    res.status(201).json(property);

    // Notify the owner that the property is now under review
    await createNotification({
      recipient: req.user.id,
      type: "property_submitted",
      title: "Property Submitted for Review",
      body: `Your property "${property.title}" has been submitted and is awaiting admin approval.`,
      refId: property._id.toString(),
      refModel: "Property",
    });
  } catch (error) {
    console.error("Error creating property:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a property
// @route   PUT /api/properties/owner/:id
// @access  Private (Owner)
const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Ensure the logged-in user is the owner
    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this property" });
    }

    // Update fields
    const fieldsToUpdate = {
      title: req.body.title || property.title,
      description: req.body.description || property.description,
      price: req.body.price || property.price,
      location: req.body.location || property.location,
      propertyType: req.body.propertyType || property.propertyType,
      bedrooms: req.body.bedrooms || property.bedrooms,
      bathrooms: req.body.bathrooms || property.bathrooms,
      securityDeposit: req.body.securityDeposit !== undefined ? req.body.securityDeposit : property.securityDeposit,
      termsAndConditions: req.body.termsAndConditions !== undefined ? req.body.termsAndConditions : property.termsAndConditions,
      images: req.body.images || property.images,
      amenities: req.body.amenities !== undefined ? req.body.amenities : property.amenities,
      status: "pending",
      rejectionReason: null,
    };

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedProperty);
  } catch (error) {
    console.error("Error updating property:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a property
// @route   DELETE /api/properties/owner/:id
// @access  Private (Owner)
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Ensure the logged-in user is the owner
    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this property" });
    }

    await property.deleteOne();
    res.status(200).json({ message: "Property removed successfully" });
  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all properties unconditionally
// @route   GET /api/properties/admin/all
// @access  Private (Admin)
const getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find({}, { images: { $slice: 1 } })
      .populate("owner", "name email phone");
    res.status(200).json(properties);
  } catch (error) {
    console.error("Error fetching all properties for admin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update property status (Approve/Reject)
// @route   PUT /api/properties/admin/:id/status
// @access  Private (Admin)
const updatePropertyStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    // Validate valid status
    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value provided" });
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    property.status = status;
    
    // Set rejection reason if provided. It might be null/empty string if not rejected.
    if (status === "rejected") {
      property.rejectionReason = rejectionReason || "No reason provided by admin";
    } else {
      property.rejectionReason = null;
    }

    await property.save();

    // Send notification to the owner
    if (status === "approved") {
      await createNotification({
        recipient: property.owner,
        type: "property_approved",
        title: "Property Approved ✅",
        body: `Great news! Your property "${property.title}" has been approved and is now live on RentEase.`,
        refId: property._id.toString(),
        refModel: "Property",
      });
    } else if (status === "rejected") {
      await createNotification({
        recipient: property.owner,
        type: "property_rejected",
        title: "Property Rejected ❌",
        body: `Your property "${property.title}" was rejected. Reason: ${property.rejectionReason}`,
        refId: property._id.toString(),
        refModel: "Property",
      });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error("Error updating property status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get property by ID
// @route   GET /api/properties/:id
// @access  Public
const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      "owner",
      "name email phone"
    );

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error("Error fetching property by ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getApprovedProperties,
  getMyProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getAllProperties,
  updatePropertyStatus,
  getPropertyById,
};
