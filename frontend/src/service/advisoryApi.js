import apiClient from './apiClient';

export const getArticles = () => {
  return apiClient.get('/advisory/all');
};

// body: { type, title, content } (ADVISOR / ADMIN); the author is the logged-in user.
export const postArticle = (body) => {
  return apiClient.post('/advisory/post', body);
};

export const submitQuery = (question) => {
  return apiClient.post('/query/submit', { question });
};

export const getMyQueries = () => {
  return apiClient.get('/query/mine');
};

// ADVISOR / ADMIN only.
export const getAllQueries = () => {
  return apiClient.get('/query/all');
};

export const respondToQuery = (id, response) => {
  return apiClient.post(`/query/respond/${id}`, { response });
};
