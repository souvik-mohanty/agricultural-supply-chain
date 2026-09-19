import axios from 'axios';

// Axios instance
const API = axios.create({
  baseURL: 'http://localhost:8089/user', // Your Spring Boot backend
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUserDetails = async () => {
  return API.get(`/me`);
};


export const updateUser = async (userId, userData) => {
  return API.put(`/${userId}`, userData); // { username, email, password, ... }
};


export const deleteUser = async (userId) => {
  return API.delete(`/${userId}`); // Delete user by ID
}


export const getUserid = async () => {
  try {
    const res = await getUserDetails();
    const userId = res.data?.id;
    if (!userId) throw new Error('User not found');
    return userId;
  } catch (error) {
    throw new Error('Failed to fetch user ID');
  }
};