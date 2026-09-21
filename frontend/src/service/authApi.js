import apiClient from './apiClient';

export const loginUser = (credentials) => {
  return apiClient.post('/auth/login', credentials); // { username, password }
};

export const registerUser = (userData) => {
  return apiClient.post('/auth/register', userData); // { username, password, email, role, ... }
};

// Dummy accounts with their passwords, for the login page. The backend returns an empty list unless it runs in
// demo mode (DEMO_LOGIN_ENABLED=true). Signing in with them uses the normal loginUser call.
export const getDemoAccounts = () => {
  return apiClient.get('/auth/demo-accounts');
};
