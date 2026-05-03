const User = require('../models/User');
const Property = require('../models/Property');

// @desc    Toggle favorite (add or remove a property from user's favorites)
// @route   POST /api/favorites/toggle/:propertyId
// @access  Private
const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;

    // Ensure property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const user = await User.findById(userId);
    const alreadyFavorited = user.favorites.some(
      (fav) => fav.toString() === propertyId
    );

    let action;
    if (alreadyFavorited) {
      // Remove from favorites
      user.favorites = user.favorites.filter(
        (fav) => fav.toString() !== propertyId
      );
      action = 'removed';
    } else {
      // Add to favorites
      user.favorites.push(propertyId);
      action = 'added';
    }

    await user.save();

    res.status(200).json({
      message: `Property ${action} ${action === 'added' ? 'to' : 'from'} favorites`,
      action,
      isFavorited: action === 'added',
      favoritesCount: user.favorites.length,
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all favorited properties for the logged-in user
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'favorites',
      match: { status: 'approved' }, // Only show approved properties
      populate: { path: 'owner', select: 'name email phone' },
      options: { sort: { createdAt: -1 } },
    });

    // Filter out any nulls (deleted properties still in favorites)
    const favorites = (user.favorites || []).filter(Boolean);

    res.status(200).json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get the logged-in user's favorite property IDs (for quick lookup)
// @route   GET /api/favorites/ids
// @access  Private
const getFavoriteIds = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('favorites');
    res.status(200).json(user.favorites || []);
  } catch (error) {
    console.error('Error fetching favorite IDs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { toggleFavorite, getFavorites, getFavoriteIds };
