import apiClient from './apiClient';

export const listRfqs = () => {
  return apiClient.get('/rfqs');
};

export const getRfq = (id) => {
  return apiClient.get(`/rfqs/${id}`);
};

// body: { productId, quantity, unit, targetPricePerUnit, deliveryLocation, requiredDeliveryDate, requirements, deadline }
export const createRfq = (body) => {
  return apiClient.post('/rfqs', body);
};

// body: { pricePerUnit, quantity, deliveryDate, notes }
export const submitQuote = (id, body) => {
  return apiClient.post(`/rfqs/${id}/quote`, body);
};

export const acceptQuote = (id) => {
  return apiClient.post(`/rfqs/${id}/accept`);
};

export const rejectQuote = (id) => {
  return apiClient.post(`/rfqs/${id}/reject`);
};

export const cancelRfq = (id) => {
  return apiClient.post(`/rfqs/${id}/cancel`);
};

// Creates the order for an accepted quote; resolves with what Razorpay Checkout needs.
export const createRfqOrder = (id) => {
  return apiClient.post(`/rfqs/${id}/order`);
};
