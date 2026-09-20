import apiClient from './apiClient';

// The cart always belongs to the logged-in user (identified by the token), so no user id is sent.

export const getCart = () => {
  return apiClient.get('/cart');
};

export const addToCart = (productId, quantity) => {
  return apiClient.post('/cart/add', null, { params: { productId, quantity } });
};

// Omit `quantity` to remove the whole line.
export const removeFromCart = (productId, quantity = null) => {
  const params = { productId };
  if (quantity !== null) {
    params.quantity = quantity;
  }
  return apiClient.delete('/cart/remove', { params });
};
