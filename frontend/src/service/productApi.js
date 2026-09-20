import apiClient, { API_BASE_URL } from './apiClient';

export const fetchAllProducts = (category) => {
  return apiClient.get('/products', { params: category ? { category } : {} });
};

export const getProductById = (id) => {
  return apiClient.get(`/products/${id}`);
};

// The photo endpoint is public, so an <img> can load it directly (and the browser caches it).
export const productImageUrl = (product) => {
  return product?.photoIds?.length ? `${API_BASE_URL}/products/photo/${product.id}` : null;
};

// Products are sent as multipart form data (fields + optional image files).
export const buildProductFormData = (values, images = []) => {
  const data = new FormData();
  ['name', 'category', 'pricePerUnit', 'quantityAvailable', 'qualityTag', 'cropInfo'].forEach((key) => {
    if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
      data.append(key, values[key]);
    }
  });
  images.forEach((file) => data.append('images', file));
  return data;
};

export const createProduct = (formData) => {
  return apiClient.post('/products', formData);
};

export const updateProduct = (id, formData) => {
  return apiClient.put(`/products/${id}`, formData);
};

export const deleteProduct = (id) => {
  return apiClient.delete(`/products/${id}`);
};
