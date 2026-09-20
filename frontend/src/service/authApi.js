import apiClient from './apiClient';

export const loginUser = (credentials) => {
  return apiClient.post('/auth/login', credentials); // { username, password }
};

export const registerUser = (userData) => {
  return apiClient.post('/auth/register', userData); // { username, password, email, role, ... }
};

// Passwordless demo login. The backend returns an empty list unless DEMO_LOGIN_ENABLED=true.
export const getDemoRoles = () => {
  return apiClient.get('/auth/demo-login');
};

export const demoLogin = (role) => {
  return apiClient.post(`/auth/demo-login/${role}`);
};
