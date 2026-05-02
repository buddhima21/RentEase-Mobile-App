const User = require("../models/User");
const Property = require("../models/Property");
const Review = require("../models/Review");

// @desc    Get Admin Analytics
// @route   GET /api/analytics/admin
// @access  Private (Admin)
const getAdminAnalytics = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'last_month';
    let dateLimit = new Date(0);
    if (timeframe === 'last_month') dateLimit = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    else if (timeframe === 'last_6_months') dateLimit = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    else if (timeframe === 'last_year') dateLimit = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const totalUsers = await User.countDocuments();
    const activeOwners = await User.countDocuments({ role: "owner" });
    const activeTenants = await User.countDocuments({ role: "tenant" });
    
    const totalProperties = await Property.countDocuments();
    const pendingProperties = await Property.countDocuments({ status: "pending" });
    const approvedProperties = await Property.countDocuments({ status: "approved" });

    // Fetch ALL reviews for Admin
    const allReviews = await Review.find()
      .populate("user", "name")
      .populate({
        path: "property",
        select: "title location owner",
        populate: { path: "owner", select: "name email" }
      })
      .sort({ createdAt: -1 });

    const pendingReviews = allReviews.filter(r => r.status === "pending");
    const allAccepted = allReviews.filter(r => r.status === "accepted");
    
    // Filter reviews for UI (same logic as owner but for ALL properties)
    const uiReviews = allReviews.filter(r => 
      r.status === 'pending' || new Date(r.createdAt) >= dateLimit
    );
    
    const visibleAccepted = uiReviews.filter(r => r.status === "accepted");

    // Calculate Real Revenue
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
          totalReviews: allReviews.length,
          pendingReviews: pendingReviews.length,
          acceptedCount: visibleAccepted.length,
          allTimeAcceptedCount: allAccepted.length,
          revenue: totalRevenue,
          occupancyRate: Math.round((approvedProperties / (totalProperties || 1)) * 100),
          totalBookings: allAccepted.length,
          availableCount: approvedProperties,
          bookedCount: pendingProperties
        },
        reviews: uiReviews
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
    const ownerId = req.user._id.toString();

    // 1. Get ALL properties for this owner (for stats)
    const allProperties = await Property.find();
    const myProperties = allProperties.filter(p => p.owner && p.owner.toString() === ownerId);

    // 2. Fetch ALL reviews in the system (per user request)
    const allReviews = await Review.find()
      .populate("user", "name")
      .populate("property", "title location owner")
      .sort({ createdAt: -1 });
    
    // 3. Define date limit for filtered stats
    let dateLimit = new Date(0); 
    const timeframe = req.query.timeframe || 'last_month';
    if (timeframe === 'last_month') dateLimit = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    else if (timeframe === 'last_6_months') dateLimit = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    else if (timeframe === 'last_year') dateLimit = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    // 4. Filter reviews for UI (Show ALL system reviews to owners)
    const uiReviews = allReviews.filter(r => 
      r.status === 'pending' || new Date(r.createdAt) >= dateLimit
    );

    const pendingReviews = allReviews.filter(r => r.status === "pending");
    const visibleAccepted = uiReviews.filter(r => r.status === "accepted");
    const allAccepted = allReviews.filter(r => r.status === "accepted");

    const avgRating = allAccepted.length > 0
      ? allAccepted.reduce((sum, r) => sum + r.rating, 0) / allAccepted.length
      : 0;

    const ownerRevenue = myProperties
      .filter(p => p.status === "approved")
      .reduce((sum, p) => sum + p.price, 0);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalProperties: myProperties.length,
          activeProperties: myProperties.filter(p => p.status === "approved").length,
          totalReviews: allReviews.length, // Show system total
          pendingReviews: pendingReviews.length, // Show system pending
          acceptedCount: visibleAccepted.length, 
          allTimeAcceptedCount: allAccepted.length,
          avgRating: Math.round(avgRating * 10) / 10,
          estimatedRevenue: ownerRevenue,
          systemTotalBookings: allAccepted.length, 
          systemAvailable: myProperties.filter(p => p.status === "approved").length,
          systemBooked: myProperties.filter(p => p.status !== "approved").length
        },
        reviews: uiReviews
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAdminAnalytics, getOwnerAnalytics };
