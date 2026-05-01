import API from './api';

export const getMyNotifications = async () => {
  const res = await API.get('/notifications');
  return res.data;
};

export const getUnreadCount = async () => {
  const res = await API.get('/notifications/unread-count');
  return res.data.count;
};

export const markAsRead = async (id) => {
  const res = await API.put(`/notifications/${id}/read`);
  return res.data;
};

export const markAllRead = async () => {
  const res = await API.put('/notifications/mark-all-read');
  return res.data;
};

export const deleteNotification = async (id) => {
  const res = await API.delete(`/notifications/${id}`);
  return res.data;
};
