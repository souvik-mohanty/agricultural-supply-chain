import apiClient from './apiClient';

// items: [{ productId, quantity }]. Prices and the buyer come from the server.
export const createOrder = (items) => {
  return apiClient.post('/orders', { items });
};

export const checkoutCart = () => {
  return apiClient.post('/orders/checkout');
};

// paymentResult: { razorpayPaymentId, razorpaySignature }
export const verifyPayment = (orderId, paymentResult) => {
  return apiClient.post(`/orders/${orderId}/verify`, paymentResult);
};

export const cancelOrder = (orderId) => {
  return apiClient.post(`/orders/${orderId}/cancel`);
};

export const getMyOrders = () => {
  return apiClient.get('/orders');
};

export const getOrder = (orderId) => {
  return apiClient.get(`/orders/${orderId}`);
};

// Orders that contain the caller's products (FARMER / ADMIN), showing only the caller's lines.
export const getSellerOrders = () => {
  return apiClient.get('/orders/seller');
};
