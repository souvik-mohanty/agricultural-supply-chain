import apiClient from './apiClient';

export const getUserDetails = () => {
  return apiClient.get('/users/me');
};

export const updateUser = (userId, userData) => {
  return apiClient.put(`/users/${userId}`, userData);
};

export const deleteUser = (userId) => {
  return apiClient.delete(`/users/${userId}`);
};
