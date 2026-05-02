import API from './api';

/**
 * Fetch all approved properties (public browsing)
 */
export const getApprovedProperties = async () => {
  const response = await API.get('/properties');
  return response.data;
};

/**
 * Fetch a single property by ID
 */
export const getPropertyById = async (id) => {
  const response = await API.get(`/properties/${id}`);
  return response.data;
};

/**
 * Fetch the logged-in owner's properties

 * Requires auth token (owner role)
 */
export const getMyProperties = async () => {
  const response = await API.get('/properties/owner/my-properties');
  return response.data;
};

/**
 * Create a new property listing
 * @param {Object} propertyData
 * Requires auth token (owner role)
 */
export const createProperty = async (propertyData) => {
  const response = await API.post('/properties/owner', propertyData);
  return response.data;
};

/**
 * Update an existing property
 * @param {string} propertyId
 * @param {Object} propertyData
 * Requires auth token (owner role)
 */
export const updateProperty = async (propertyId, propertyData) => {
  const response = await API.put(`/properties/owner/${propertyId}`, propertyData);
  return response.data;
};

/**
 * Delete a property
 * @param {string} propertyId
 * Requires auth token (owner role)
 */
export const deleteProperty = async (propertyId) => {
  const response = await API.delete(`/properties/owner/${propertyId}`);
  return response.data;
};

/**
 * Fetch all properties unconditionally
 * Requires auth token (admin role)
 */
export const getAllPropertiesForAdmin = async () => {
  const response = await API.get('/properties/admin/all');
  return response.data;
};

/**
 * Update the status of a property (approve/reject)
 * @param {string} propertyId 
 * @param {string} status - 'approved', 'rejected', etc.
 * @param {string} rejectionReason 
 * Requires auth token (admin role)
 */
export const updatePropertyStatus = async (propertyId, status, rejectionReason = null) => {
  const response = await API.put(`/properties/admin/${propertyId}/status`, {
    status,
    rejectionReason
  });
  return response.data;
};

/**
 * Helper: format a raw property from API into a display-ready object
 * @param {Object} p - raw property from API
 */
export const formatProperty = (p) => ({
  id: p._id,
  title: p.title,
  location: p.location,
  price: `LKR ${Number(p.price).toLocaleString()}`,
  priceRaw: p.price,
  beds: p.bedrooms,
  baths: p.bathrooms,
  propertyType: p.propertyType,
  description: p.description,
  amenities: p.amenities || [],
  images: p.images || [],
  imageUri: (p.images && p.images.length > 0) ? p.images[0] : null,
  securityDeposit: p.securityDeposit,
  termsAndConditions: p.termsAndConditions,
  owner: p.owner,
  status: p.status,
  rejectionReason: p.rejectionReason || null,
  createdAt: p.createdAt,
});
