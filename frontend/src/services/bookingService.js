import API from './api';

/**
 * Create a booking request (tenant)
 * @param {Object} bookingData - { propertyId, preferredDate, idDocument, idDocumentName }
 */
export const createBooking = async (bookingData) => {
  const response = await API.post('/bookings', bookingData);
  return response.data;
};

/**
 * Update a pending booking's preferred date (tenant)
 * @param {string} bookingId
 * @param {string} preferredDate
 */
export const updateBookingDate = async (bookingId, preferredDate) => {
  const response = await API.put(`/bookings/${bookingId}`, { preferredDate });
  return response.data;
};

/**
 * Get all bookings for the logged-in tenant
 */
export const getMyBookings = async () => {
  const response = await API.get('/bookings/my-bookings');
  return response.data;
};

/**
 * Get pending booking requests for the owner's properties
 */
export const getOwnerBookingRequests = async () => {
  const response = await API.get('/bookings/owner/requests');
  return response.data;
};

/**
 * Approve a booking request (owner)
 * @param {string} bookingId
 */
export const approveBooking = async (bookingId) => {
  const response = await API.put(`/bookings/owner/${bookingId}/approve`);
  return response.data;
};

/**
 * Reject a booking request (owner)
 * @param {string} bookingId
 * @param {string} rejectionReason
 */
export const rejectBooking = async (bookingId, rejectionReason = '') => {
  const response = await API.put(`/bookings/owner/${bookingId}/reject`, { rejectionReason });
  return response.data;
};

/**
 * Remove an allocated tenant from a property (owner)
 * @param {string} bookingId
 */
export const removeAllocatedTenant = async (bookingId) => {
  const response = await API.put(`/bookings/owner/${bookingId}/remove`);
  return response.data;
};

/**
 * Get all allocation history for the owner's properties
 */
export const getOwnerAllocationHistory = async () => {
  const response = await API.get('/bookings/owner/history');
  return response.data;
};

/**
 * Get available bedroom count for a specific property
 * @param {string} propertyId
 */
export const getPropertyAvailability = async (propertyId) => {
  const response = await API.get(`/bookings/availability/${propertyId}`);
  return response.data;
};
