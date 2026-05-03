import API from './api';

/**
 * Toggle a property as favorite/unfavorite
 * @param {string} propertyId
 */
export const toggleFavorite = async (propertyId) => {
  const response = await API.post(`/favorites/toggle/${propertyId}`);
  return response.data; // { action, isFavorited, favoritesCount }
};

/**
 * Get full favorite property objects for the Saved tab
 */
export const getFavorites = async () => {
  const response = await API.get('/favorites');
  return response.data;
};

/**
 * Get just the IDs of favorited properties (fast, for heart icon state)
 */
export const getFavoriteIds = async () => {
  const response = await API.get('/favorites/ids');
  return response.data; // array of property ID strings
};
