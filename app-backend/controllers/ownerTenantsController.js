const mongoose = require('mongoose');
const Agreement = require('../models/Agreement');
const Booking = require('../models/Booking');
const User = require('../models/User');

/**
 * GET /api/owner-tenants/:ownerId
 * Returns list of tenants who have ACTIVE/PENDING agreements OR APPROVED bookings (allocations)
 */
const getOwnerTenants = async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ success: false, message: 'Invalid Owner ID' });
    }

    // 1. Fetch formal agreements
    const agreements = await Agreement.find({
      owner: ownerId,
      status: { $in: ['ACTIVE', 'PENDING', 'TERMINATION_REQUESTED'] },
    })
      .populate('tenant', 'name email')
      .populate('property', 'title price'); // Changed rentalPrice to price

    // 2. Fetch approved bookings (allocations)
    const bookings = await Booking.find({
      owner: ownerId,
      status: 'approved'
    })
      .populate('tenant', 'name email')
      .populate('property', 'title price');

    const tenantsList = [];

    // Process Agreements
    agreements.forEach((agr) => {
      if (!agr.tenant || !agr.property) return;
      
      tenantsList.push({
        tenantId:    agr.tenant._id.toString(),
        tenantName:  agr.tenant.name || 'Unknown',
        tenantEmail: agr.tenant.email || '',
        propertyId:  agr.property._id.toString(),
        propertyTitle: agr.property.title || 'Unknown Property',
        rentalFee:   agr.rentAmount || agr.property.price || 0,
        agreementId: agr._id.toString(),
        status:      agr.status,
      });
    });

    // Process Bookings
    bookings.forEach((b) => {
      if (!b.tenant || !b.property) return;
      
      const tIdStr = b.tenant._id.toString();
      const pIdStr = b.property._id.toString();

      // Check if this tenant-property pair is already covered by an agreement
      const exists = tenantsList.some(
        (item) => item.tenantId === tIdStr && item.propertyId === pIdStr
      );

      if (!exists) {
        tenantsList.push({
          tenantId:    tIdStr,
          tenantName:  b.tenant.name || 'Unknown',
          tenantEmail: b.tenant.email || '',
          propertyId:  pIdStr,
          propertyTitle: b.property.title || 'Unknown Property',
          rentalFee:   b.property.price || 0,
          bookingId:   b._id.toString(),
          status:      'ALLOCATED',
        });
      }
    });

    res.json({ success: true, data: tenantsList });
  } catch (err) {
    console.error('getOwnerTenants error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getOwnerTenants };
