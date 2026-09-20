import apiClient from './apiClient';

export const getUsers = () => {
  return apiClient.get('/admin/users');
};

export const suspendUser = (id) => {
  return apiClient.post(`/admin/suspend/${id}`);
};

export const unsuspendUser = (id) => {
  return apiClient.post(`/admin/unsuspend/${id}`);
};

export const changeUserRole = (id, role) => {
  return apiClient.put(`/admin/users/${id}/role`, { role });
};

export const getComplaints = () => {
  return apiClient.get('/admin/complaints');
};

export const resolveComplaint = (id) => {
  return apiClient.post(`/admin/complaints/${id}/resolve`);
};

// type: 'pdf' | 'excel'. Resolves with a Blob; the token travels in a header, so a plain link would not work.
export const downloadReport = (type) => {
  return apiClient.get(`/admin/report/${type}`, { responseType: 'blob' });
};

// Any logged-in user can file a complaint: { against, message }.
export const fileComplaint = (body) => {
  return apiClient.post('/complaints', body);
};
