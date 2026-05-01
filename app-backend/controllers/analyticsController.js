const User = require("../models/User");
const Property = require("../models/Property");
const Review = require("../models/Review");

// @desc    Get Admin Analytics
// @route   GET /api/analytics/admin
// @access  Private (Admin)
const getAdminAnalytics = async (req, res) => {
  try {
    const { timeframe } = req.query;
    let dateFilter = {};
    if (timeframe === "last_month") {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    } else if (timeframe === "last_6_months") {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } };
    } else if (timeframe === "last_year") {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } };
    }

    const totalUsers = await User.countDocuments();
    const activeOwners = await User.countDocuments({ role: "owner" });
    const activeTenants = await User.countDocuments({ role: "tenant" });
    
    const totalProperties = await Property.countDocuments(dateFilter);
    const pendingProperties = await Property.countDocuments({ ...dateFilter, status: "pending" });
    const approvedProperties = await Property.countDocuments({ ...dateFilter, status: "approved" });

    const totalReviews = await Review.countDocuments(dateFilter);

    // Group reviews by owner for Admin Reviews Screen
    // We aggregate reviews and populate the property's owner
    const reviews = await Review.find()
      .populate("user", "name")
      .populate({
        path: "property",
        select: "title location owner",
        populate: { path: "owner", select: "name email" }
      })
      .sort({ createdAt: -1 });

    // Calculate Real Revenue (Sum of all approved property prices)
    const revenueData = await Property.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeOwners,
          activeTenants,
          totalProperties,
          pendingProperties,
          approvedProperties,
          totalReviews,
          revenue: totalRevenue,
          occupancyRate: Math.round((approvedProperties / (totalProperties || 1)) * 100),
          totalBookings: approvedProperties, // Using approved as "Active" for now
          availableCount: approvedProperties,
          bookedCount: pendingProperties
        },
        reviews
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Owner Analytics
// @route   GET /api/analytics/owner
// @access  Private (Owner)
const getOwnerAnalytics = async (req, res) => {
  try {
    const { timeframe } = req.query;
    let dateFilter = {};
    if (timeframe === "last_month") {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    } else if (timeframe === "last_6_months") {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } };
    } else if (timeframe === "last_year") {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } };
    }

    const ownerId = req.user._id;

    // Get properties owned by this user
    const properties = await Property.find({ owner: ownerId, ...dateFilter });
    const propertyIds = properties.map(p => p._id);

    const totalProperties = properties.length;
    const activeProperties = properties.filter(p => p.status === "approved").length;

    // Fetch ALL reviews in the system so any owner can see them
    const reviews = await Review.find()
      .populate("user", "name")
      .populate("property", "title location")
      .sort({ createdAt: -1 });
    
    const totalReviews = reviews.length;
    const pendingReviews = reviews.filter(r => r.status === "pending").length;
    
    // Average rating
    const acceptedReviews = reviews.filter(r => r.status === "accepted");
    const avgRating = acceptedReviews.length > 0
      ? acceptedReviews.reduce((sum, r) => sum + r.rating, 0) / acceptedReviews.length
      : 0;

    // Calculate Real Revenue for this owner
    const ownerRevenue = properties
      .filter(p => p.status === "approved")
      .reduce((sum, p) => sum + p.price, 0);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalProperties,
          activeProperties,
          totalReviews,
          pendingReviews,
          avgRating: Math.round(avgRating * 10) / 10,
          estimatedRevenue: ownerRevenue,
          systemTotalBookings: totalReviews, 
          systemAvailable: activeProperties,
          systemBooked: totalProperties - activeProperties
        },
        reviews: reviews
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAdminAnalytics, getOwnerAnalytics };
