/**
 * @file maintenanceRoutes.js
 * @description Express router for the Maintenance Request module in RentEase.
 *
 * All routes are prefixed with `/api/maintenance` (configured in server.js).
 * Every route is protected by the `protect` middleware, which validates the
 * JWT token and attaches the authenticated user to `req.user`. Role-based
 * access is further enforced via `authorizeRoles`.
 *
 * Route summary:
 * ┌──────────────────────────┬────────────┬──────────────────────────────────────────┐
 * │ Endpoint                 │ Method     │ Access                                   │
 * ├──────────────────────────┼────────────┼──────────────────────────────────────────┤
 * │ /api/maintenance         │ POST       │ Private – Tenant only                    │
 * │ /api/maintenance         │ GET        │ Private – Admin only                     │
 * │ /api/maintenance/my      │ GET        │ Private – Tenant only                    │
 * │ /api/maintenance/:id     │ GET        │ Private – Admin or owning Tenant         │
 * │ /api/maintenance/:id     │ PUT        │ Private – Admin or owning Tenant         │
 * │ /api/maintenance/:id     │ DELETE     │ Private – Tenant only (SUBMITTED status) │
 * └──────────────────────────┴────────────┴──────────────────────────────────────────┘
 */

const express = require("express");
const router = express.Router();

// Import all maintenance controller handler functions
const {
  createMaintenanceRequest,
  getMyMaintenanceRequests,
  getAllMaintenanceRequests,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
} = require("../controllers/maintenanceController");

// Import authentication and authorization middleware
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// ---------------------------------------------------------------------------
// Base route: /api/maintenance
// ---------------------------------------------------------------------------

router
  .route("/")
  /**
   * @route  POST /api/maintenance
   * @desc   Submit a new maintenance request for a property.
   *         The property is resolved automatically from the tenant's approved
   *         booking(s). If the tenant holds more than one approved booking,
   *         a `propertyId` must be provided in the request body.
   * @access Private – Tenant only
   */
  .post(protect, authorizeRoles("tenant"), createMaintenanceRequest)

  /**
   * @route  GET /api/maintenance
   * @desc   Retrieve all maintenance requests across all properties and tenants.
   *         Results are sorted newest-first and include populated property and
   *         tenant details for the admin dashboard.
   * @access Private – Admin only
   */
  .get(protect, authorizeRoles("admin"), getAllMaintenanceRequests);

// ---------------------------------------------------------------------------
// Tenant self-service route: /api/maintenance/my
// NOTE: This route must be declared BEFORE /:id to prevent Express from
//       interpreting "my" as a dynamic :id parameter.
// ---------------------------------------------------------------------------

router
  .route("/my")
  /**
   * @route  GET /api/maintenance/my
   * @desc   Retrieve all maintenance requests submitted by the currently
   *         authenticated tenant. Results include populated property info
   *         and are sorted newest-first.
   * @access Private – Tenant only
   */
  .get(protect, authorizeRoles("tenant"), getMyMaintenanceRequests);

// ---------------------------------------------------------------------------
// Individual request routes: /api/maintenance/:id
// ---------------------------------------------------------------------------

router
  .route("/:id")
  /**
   * @route  GET /api/maintenance/:id
   * @desc   Retrieve a single maintenance request by its MongoDB ObjectId.
   *         Admins can view any request; tenants can only view requests they
   *         own (enforced in the controller via ownership check).
   * @access Private – Admin or owning Tenant
   */
  .get(protect, getMaintenanceRequestById)

  /**
   * @route  PUT /api/maintenance/:id
   * @desc   Update the status or admin notes of a maintenance request.
   *         - Admin: can advance status through the workflow stages and add/edit
   *           adminNotes. Cannot set status directly to "CLOSED".
   *         - Tenant: can only transition from RESOLVED → CLOSED (confirm fix)
   *           or RESOLVED → SUBMITTED (re-open if unsatisfied).
   * @access Private – Admin or Tenant (role-based field restrictions apply)
   */
  .put(protect, authorizeRoles("admin", "tenant"), updateMaintenanceRequest)

  /**
   * @route  DELETE /api/maintenance/:id
   * @desc   Permanently delete a maintenance request. Only the owning tenant
   *         may delete a request, and only while it is still in "SUBMITTED"
   *         status (i.e., before any admin action has been taken).
   * @access Private – Tenant only (SUBMITTED status required)
   */
  .delete(protect, authorizeRoles("tenant"), deleteMaintenanceRequest);

module.exports = router;
