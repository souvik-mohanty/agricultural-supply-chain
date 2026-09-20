import apiClient from './apiClient';

// body: { cropName, farmerId, warehouseLocation, quantity }
export const storeCrop = (body) => {
  return apiClient.post('/warehouse/store', body);
};

export const getByLocation = (location) => {
  return apiClient.get(`/warehouse/location/${encodeURIComponent(location)}`);
};

export const getReadyForDelivery = () => {
  return apiClient.get('/warehouse/ready');
};

export const markReady = (id) => {
  return apiClient.put(`/warehouse/mark-ready/${id}`);
};
