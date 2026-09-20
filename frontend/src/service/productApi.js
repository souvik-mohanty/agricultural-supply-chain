import apiClient from './apiClient';

export const fetchAllProducts = () => {
  return apiClient.get('/products');
};

export const getProductById = (id) => {
  return apiClient.get(`/products/${id}`);
};

// Returns the first photo of the product as a Blob.
export const getProductImgById = (id) => {
  return apiClient.get(`/products/photo/${id}`, { responseType: 'blob' });
};
