import axios from 'axios';
import { getUserid } from './userApi';

// Axios instance with correct baseURL
const API = axios.create({
  baseURL: 'http://localhost:8089/products',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch all products
export const fetchAllProducts = async () => {
  return API.get(); // ✅ fixed
};

// Get product by ID
export const getProductById = async (id) => {
  return API.get(`/${id}`); // ✅ fixed
};

export const getProductImgById = async (id) => {
  // Path should be '/photos/' and responseType must be 'blob'
  return API.get(`/photo/${id}`, {
    responseType: 'blob',
  });
};

// Get cart for a user
export const getCart = async () => {
  const userId = await getUserid();
  return API.get(`/cart/${userId}`); // ✅ now correct
};

// Add product to cart
export const addToCart = async (productId, quantity) => {
  try {
    const userId = await getUserid();
    return API.post('/cart/add', null, {
      params: { userId, productId, quantity },
    });
  } catch (error) {
    console.error('Error in addToCart API:', error);
    throw error;
  }
};

// Remove item from cart (optional quantity)
export const removeFromCart = async (productId, quantity = null) => {
  try {
    const userId = await getUserid();

    const params = { userId, productId };
    if (quantity !== null) {
      params.quantity = quantity;
    }

    return await API.delete('/cart/remove', { params });
  } catch (error) {
    console.error('Error in removeFromCart API:', error);
    throw error;
  }
};
