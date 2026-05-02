import API from './api';

export const createMaintenanceRequest = async (requestData) => {
  const response = await API.post('/maintenance', requestData);
  return response.data;
};

export const getMyMaintenanceRequests = async () => {
  const response = await API.get('/maintenance/my');
  return response.data;
};

export const getAllMaintenanceRequests = async () => {
  const response = await API.get('/maintenance');
  return response.data;
};

export const getMaintenanceRequestById = async (id) => {
  const response = await API.get(`/maintenance/${id}`);
  return response.data;
};

export const updateMaintenanceRequest = async (id, updateData) => {
  const response = await API.put(`/maintenance/${id}`, updateData);
  return response.data;
};

export const deleteMaintenanceRequest = async (id) => {
  const response = await API.delete(`/maintenance/${id}`);
  return response.data;
};
