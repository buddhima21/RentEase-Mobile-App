/**
 * @file MaintenanceRequest.js
 * @description Mongoose model for tenant maintenance requests in RentEase.
 *
 * This model represents a maintenance ticket raised by a tenant against a
 * property they are currently allocated to (via an approved booking). It
 * supports a multi-stage status lifecycle managed collaboratively by tenants
 * and admins, and stores optional image evidence as an array of URLs/base64
 * strings.
 *
 * Status lifecycle:
 *   SUBMITTED → ACTION_SCHEDULED → AWAITING_PARTS → RESOLVED → CLOSED
 *                                                             ↑ (tenant only)
 *   RESOLVED → SUBMITTED  (tenant can re-open if unsatisfied)
 */

const mongoose = require("mongoose");

/**
 * Schema definition for a maintenance request document.
 *
 * @typedef {Object} MaintenanceRequestSchema
 * @property {mongoose.Types.ObjectId} property      - Reference to the Property being reported.
 * @property {mongoose.Types.ObjectId} tenant        - Reference to the User (tenant) who raised the request.
 * @property {string}                  category      - Category of the maintenance issue.
 * @property {string}                  description   - Detailed description of the problem provided by the tenant.
 * @property {string[]}                images        - Array of image URLs or base64 strings attached as evidence.
 * @property {string}                  entryPermission - How the technician is permitted to access the unit.
 * @property {string}                  status        - Current lifecycle stage of the request (default: SUBMITTED).
 * @property {string|null}             adminNotes    - Internal notes added by the admin for tracking/resolution details.
 * @property {Date}                    createdAt     - Auto-generated timestamp when the document was created.
 * @property {Date}                    updatedAt     - Auto-generated timestamp of the last document update.
 */
const maintenanceRequestSchema = new mongoose.Schema(
  {
    /**
     * The property this maintenance request is associated with.
     * Populated from the `Property` collection on query via .populate().
     */
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    /**
     * The tenant who submitted this maintenance request.
     * References the `User` collection. Only tenants with an approved booking
     * for the related property are permitted to create a request.
     */
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /**
     * The category/type of the maintenance issue.
     * Constrained to a predefined set to allow consistent filtering and triage.
     *
     * Allowed values:
     *  - "Plumbing"    – Leaks, blockages, pipe issues, etc.
     *  - "Electrical"  – Wiring, power outages, socket/switch faults.
     *  - "Appliance"   – Built-in appliance malfunctions.
     *  - "General"     – Any other issue not covered by the above categories.
     */
    category: {
      type: String,
      enum: ["Plumbing", "Electrical", "Appliance", "General"],
      required: true,
    },

    /**
     * Free-text description of the maintenance issue written by the tenant.
     * This is the primary narrative that guides the admin and technician.
     */
    description: {
      type: String,
      required: true,
    },

    /**
     * Optional array of image references (URLs or base64 strings) provided by
     * the tenant to visually document the issue. Defaults to an empty array
     * when no images are supplied.
     */
    images: {
      type: [String],
      default: [],
    },

    /**
     * Indicates whether the tenant grants access to their unit for repairs.
     *
     * Allowed values:
     *  - "GRANTED_MASTER_KEY"     – Admin/technician may enter without scheduling.
     *  - "CONTACT_TO_SCHEDULE"    – Entry must be arranged with the tenant first.
     */
    entryPermission: {
      type: String,
      enum: ["GRANTED_MASTER_KEY", "CONTACT_TO_SCHEDULE"],
      required: true,
    },

    /**
     * Current stage of the maintenance request in its lifecycle.
     *
     * Allowed values and their meanings:
     *  - "SUBMITTED"         – Newly created request, awaiting admin review.
     *  - "ACTION_SCHEDULED"  – Admin has scheduled a technician visit.
     *  - "AWAITING_PARTS"    – Repair is on hold pending parts/materials.
     *  - "RESOLVED"          – Admin has marked the issue as fixed.
     *  - "CLOSED"            – Tenant has confirmed the resolution and closed the ticket.
     *
     * Transition rules (enforced in the controller):
     *  - Admin can transition: SUBMITTED → ACTION_SCHEDULED → AWAITING_PARTS → RESOLVED
     *  - Admin CANNOT set status to CLOSED directly.
     *  - Tenant can transition: RESOLVED → CLOSED (confirm fix) or RESOLVED → SUBMITTED (re-open).
     */
    status: {
      type: String,
      enum: ["SUBMITTED", "ACTION_SCHEDULED", "AWAITING_PARTS", "RESOLVED", "CLOSED"],
      default: "SUBMITTED",
    },

    /**
     * Internal notes written by the admin to document actions taken,
     * technician assignments, or any relevant administrative observations.
     * Defaults to null when no notes have been added.
     */
    adminNotes: {
      type: String,
      default: null,
    },
  },
  {
    /**
     * Automatically adds `createdAt` and `updatedAt` fields to each document,
     * managed by Mongoose on create and save operations respectively.
     */
    timestamps: true,
  }
);

/**
 * Mongoose model compiled from the maintenanceRequestSchema.
 * Maps to the "maintenancerequests" collection in MongoDB.
 *
 * @type {mongoose.Model<MaintenanceRequestSchema>}
 */
module.exports = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);
