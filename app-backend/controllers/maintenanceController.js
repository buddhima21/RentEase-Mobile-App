/**
 * @file maintenanceController.js
 * @description Controller functions for the Maintenance Request module in RentEase.
 *
 * This module handles the full lifecycle of a maintenance request, from initial
 * submission by a tenant through admin triage and resolution to final closure.
 *
 * Business Rules:
 *  - A tenant must have at least one approved booking to submit a request.
 *  - If a tenant has multiple approved bookings, they must specify which property.
 *  - Admins manage status transitions; tenants can only confirm resolution or re-open.
 *  - Admins cannot directly close a ticket — that action belongs to the tenant.
 *  - Tenants can only delete a request while it is still in "SUBMITTED" status.
 *  - Admins cannot delete maintenance requests.
 *
 * Status Lifecycle:
 *   SUBMITTED → ACTION_SCHEDULED → AWAITING_PARTS → RESOLVED → CLOSED
 *   RESOLVED  → SUBMITTED  (tenant re-open)
 */

const MaintenanceRequest = require("../models/MaintenanceRequest");
const Booking = require("../models/Booking");

// ---------------------------------------------------------------------------
// Utility / Helper Functions
// ---------------------------------------------------------------------------

/**
 * Determines whether a given Mongoose error is an invalid ObjectId cast error.
 *
 * This occurs when a route parameter (e.g., `/:id`) cannot be cast to a valid
 * MongoDB ObjectId, typically because the client supplied a malformed ID string.
 *
 * @param {Error} error - The error object thrown by a Mongoose operation.
 * @returns {boolean} `true` if the error is an ObjectId cast error, otherwise `false`.
 */
const isInvalidObjectIdError = (error) =>
  error?.name === "CastError" && error?.kind === "ObjectId";

/**
 * Centralised error handler for all maintenance controller functions.
 *
 * Inspects the error type and sends the appropriate HTTP response:
 *  - 400 Bad Request  → Invalid ObjectId (malformed `:id` parameter)
 *  - 400 Bad Request  → Mongoose ValidationError (schema constraint violated)
 *  - 500 Internal     → Any other unexpected server-side error
 *
 * Unexpected errors are also logged to the server console for debugging.
 *
 * @param {import("express").Response} res             - The Express response object.
 * @param {Error}                      error           - The caught error instance.
 * @param {string}                     fallbackMessage - Human-readable message for unhandled 500 errors.
 * @returns {import("express").Response} The HTTP response sent to the client.
 */
const handleMaintenanceError = (res, error, fallbackMessage) => {
  // Handle malformed MongoDB ObjectId in route parameters
  if (isInvalidObjectIdError(error)) {
    return res.status(400).json({ message: "Invalid maintenance request id." });
  }

  // Handle Mongoose schema validation failures (e.g., missing required fields, bad enum values)
  if (error?.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  // Log and return a generic 500 for any other unexpected error
  console.error(error);
  return res.status(500).json({ message: fallbackMessage });
};

// ---------------------------------------------------------------------------
// Controller Functions
// ---------------------------------------------------------------------------

/**
 * @desc    Create a new maintenance request on behalf of the authenticated tenant.
 * @route   POST /api/maintenance
 * @access  Private – Tenant only
 *
 * Logic:
 *  1. Verify the tenant has at least one approved booking (i.e., is allocated to a property).
 *  2. If only one approved booking exists, auto-select its property.
 *  3. If multiple approved bookings exist, require `propertyId` in the request body and
 *     validate that it matches one of the tenant's approved bookings.
 *  4. Create and persist the new MaintenanceRequest document with status "SUBMITTED".
 *
 * @param {import("express").Request}  req - Express request. Expected body fields:
 *   @param {string}   req.body.category        - Issue category (Plumbing | Electrical | Appliance | General).
 *   @param {string}   req.body.description     - Detailed description of the issue.
 *   @param {string[]} [req.body.images]        - Optional array of image URLs/base64 strings.
 *   @param {string}   req.body.entryPermission - Access permission (GRANTED_MASTER_KEY | CONTACT_TO_SCHEDULE).
 *   @param {string}   [req.body.propertyId]   - Required when the tenant has multiple approved bookings.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} 201 with the new request document, or an error response.
 */
const createMaintenanceRequest = async (req, res) => {
  try {
    const { category, description, images, entryPermission, propertyId } = req.body;

    // Step 1: Check that the tenant has at least one approved (allocated) booking.
    // An approved booking confirms the tenant is currently residing in a property.
    const approvedBookings = await Booking.find({
      tenant: req.user._id,
      status: "approved",
    });

    if (approvedBookings.length === 0) {
      return res.status(400).json({
        message:
          "No approved booking found. You must be allocated to a property to submit a maintenance request.",
      });
    }

    let selectedPropertyId;

    if (approvedBookings.length === 1) {
      // Step 2: Only one booking — use its property automatically
      selectedPropertyId = approvedBookings[0].property;
    } else {
      // Step 3: Multiple bookings — tenant must specify which property
      if (!propertyId) {
        return res.status(400).json({
          message: "Please select a property for this request.",
        });
      }

      // Validate that the provided propertyId belongs to one of the tenant's approved bookings
      const matchingBooking = approvedBookings.find(
        (b) => b.property.toString() === propertyId
      );

      if (!matchingBooking) {
        return res.status(400).json({ message: "Invalid property selected." });
      }

      selectedPropertyId = propertyId;
    }

    // Step 4: Persist the new maintenance request document
    const newRequest = await MaintenanceRequest.create({
      property: selectedPropertyId,
      tenant: req.user._id,
      category,
      description,
      images: images || [],        // Default to empty array if no images provided
      entryPermission,
      status: "SUBMITTED",         // All new requests begin at the SUBMITTED stage
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

/**
 * @desc    Retrieve all maintenance requests submitted by the authenticated tenant.
 * @route   GET /api/maintenance/my
 * @access  Private – Tenant only
 *
 * Results are:
 *  - Filtered to only the currently authenticated tenant's documents.
 *  - Populated with property `title` and `location` for display purposes.
 *  - Sorted by creation date descending (newest first).
 *
 * @param {import("express").Request}  req - Express request (user injected by `protect` middleware).
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} 200 with an array of MaintenanceRequest documents.
 */
const getMyMaintenanceRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({ tenant: req.user._id })
      .populate("property", "title location") // Join property name and location for UI display
      .sort({ createdAt: -1 });               // Newest requests appear first

    res.status(200).json(requests);
  } catch (error) {
    return handleMaintenanceError(
      res,
      error,
      "Server Error: Could not fetch requests."
    );
  }
};

/**
 * @desc    Retrieve all maintenance requests across all tenants and properties (Admin view).
 * @route   GET /api/maintenance
 * @access  Private – Admin only
 *
 * Results are:
 *  - Unrestricted (all documents in the collection).
 *  - Populated with property `title` and `location`.
 *  - Populated with tenant `name`, `email`, and `phone` for admin triage.
 *  - Sorted by creation date descending (newest first).
 *
 * @param {import("express").Request}  req - Express request.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} 200 with an array of all MaintenanceRequest documents.
 */
const getAllMaintenanceRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({})
      .populate("property", "title location")       // Property details for admin dashboard
      .populate("tenant", "name email phone")        // Tenant contact info for admin triage
      .sort({ createdAt: -1 });                      // Newest requests appear first

    res.status(200).json(requests);
  } catch (error) {
    return handleMaintenanceError(
      res,
      error,
      "Server Error: Could not fetch all requests."
    );
  }
};

/**
 * @desc    Retrieve a single maintenance request by its MongoDB ObjectId.
 * @route   GET /api/maintenance/:id
 * @access  Private – Admin (any request) or Tenant (own requests only)
 *
 * Ownership check:
 *  - If the authenticated user is NOT an admin, the controller verifies that
 *    the `tenant` field on the document matches `req.user._id`. Mismatches
 *    are rejected with 403 Forbidden.
 *
 * @param {import("express").Request}  req            - Express request.
 *   @param {string} req.params.id - The MongoDB ObjectId of the maintenance request.
 * @param {import("express").Response} res            - Express response.
 * @returns {Promise<void>} 200 with the populated MaintenanceRequest document, or an error response.
 */
const getMaintenanceRequestById = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate("property", "title location") // Include property details
      .populate("tenant", "name email phone"); // Include tenant contact details

    // Return 404 if the document does not exist in the collection
    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found." });
    }

    // Ownership check: non-admin users can only view their own requests
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

/**
 * @desc    Update the status or admin notes of an existing maintenance request.
 * @route   PUT /api/maintenance/:id
 * @access  Private – Admin or Tenant (with role-specific restrictions)
 *
 * Admin update rules:
 *  - Can set `status` to any value EXCEPT "CLOSED" (closing is a tenant action).
 *  - Can add or overwrite `adminNotes` at any time.
 *
 * Tenant update rules:
 *  - Can only act on requests they own (ownership enforced in controller).
 *  - Can only change `status` when the current status is "RESOLVED":
 *      → "CLOSED"    : Tenant confirms the fix is satisfactory.
 *      → "SUBMITTED" : Tenant re-opens the request if unsatisfied with the resolution.
 *  - Any other status transition by the tenant is rejected with 400.
 *
 * @param {import("express").Request}  req - Express request.
 *   @param {string} req.params.id         - The MongoDB ObjectId of the request to update.
 *   @param {string} [req.body.status]     - New status value to apply.
 *   @param {string} [req.body.adminNotes] - Notes to record (admin only).
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} 200 with the updated MaintenanceRequest document, or an error response.
 */
const updateMaintenanceRequest = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id);

    // Return 404 if the document does not exist
    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found." });
    }

    // -----------------------------------------------------------------------
    // Admin update path
    // -----------------------------------------------------------------------
    if (req.user.role === "admin") {
      if (status) {
        // Admins are not permitted to close a ticket — that right belongs to the tenant
        if (status === "CLOSED") {
          return res.status(400).json({
            message: "Admin cannot close the ticket directly.",
          });
        }
        request.status = status;
      }

      // Update admin notes if provided (allow empty string to clear notes)
      if (adminNotes !== undefined) {
        request.adminNotes = adminNotes;
      }
    }

    // -----------------------------------------------------------------------
    // Tenant update path
    // -----------------------------------------------------------------------
    else if (req.user.role === "tenant") {
      // Ownership check: tenants can only update their own requests
      if (request.tenant.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "Not authorized to update this request.",
        });
      }

      if (status) {
        // Tenants may only act when the request is in RESOLVED state:
        //  - CLOSED    → confirms the repair is complete and satisfactory
        //  - SUBMITTED → re-opens the request if the fix was inadequate
        if (
          request.status === "RESOLVED" &&
          (status === "CLOSED" || status === "SUBMITTED")
        ) {
          request.status = status;
        } else {
          return res.status(400).json({
            message: "Invalid status transition for tenant.",
          });
        }
      }
    }

    // Persist the changes to the database
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

/**
 * @desc    Permanently delete a maintenance request from the database.
 * @route   DELETE /api/maintenance/:id
 * @access  Private – Tenant only (request must be in "SUBMITTED" status)
 *
 * Deletion rules:
 *  - Only the tenant who owns the request may delete it.
 *  - Deletion is only permitted while the request is still in "SUBMITTED" status,
 *    meaning no admin has yet taken action on it. This prevents data loss of
 *    in-progress or resolved maintenance records.
 *  - Admins are explicitly blocked from deleting maintenance requests to preserve
 *    the audit trail.
 *
 * @param {import("express").Request}  req - Express request.
 *   @param {string} req.params.id - The MongoDB ObjectId of the request to delete.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} 200 with a success message, or an error response.
 */
const deleteMaintenanceRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);

    // Return 404 if the document does not exist
    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found." });
    }

    // Only tenants can delete — admins are rejected to preserve the audit trail
    if (req.user.role === "tenant") {
      // Ownership check: tenant must own this request
      if (request.tenant.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "Not authorized to delete this request.",
        });
      }

      // Status check: can only delete if no admin action has been taken yet
      if (request.status !== "SUBMITTED") {
        return res.status(400).json({
          message: "Cannot delete request after it has been processed.",
        });
      }
    } else {
      // Admins are not permitted to delete maintenance requests
      return res.status(403).json({
        message: "Admins cannot delete maintenance requests directly.",
      });
    }

    // Permanently remove the document from the collection
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

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  createMaintenanceRequest,
  getMyMaintenanceRequests,
  getAllMaintenanceRequests,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
};
