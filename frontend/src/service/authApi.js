import axios from 'axios';

// Axios instance
const API = axios.create({
  baseURL: 'http://localhost:8089/user', // Your Spring Boot backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API calls

export const loginUser = async (credentials) => {
  return API.post('/auth/login', credentials); // { username, password }
};

export const registerUser = async (userData) => {
  return API.post('/auth/register', userData); // { username, email, password, ... }
};


export const forgotPassword = async (email) => {
  return API.post('/forgot-password', { email }); // { email }
};

export const resetPassword = async (token, password) => {
  return API.post('/reset-password', { token, password }); // { token, password }
};


