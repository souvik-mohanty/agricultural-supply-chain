import apiClient from './apiClient';

export const getInbox = () => {
  return apiClient.get('/notifications/me');
};

export const getUnreadCount = () => {
  return apiClient.get('/notifications/me/unread-count');
};

export const markNotificationRead = (id) => {
  return apiClient.post(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = () => {
  return apiClient.post('/notifications/read-all');
};
