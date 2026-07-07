import { apiClient } from './client';

function buildQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const postsApi = {
  listBlog: ({ limit, cursor, search } = {}) => apiClient.get(`/posts/blog${buildQuery({ limit, cursor, search })}`),
  getBlog: (postId) => apiClient.get(`/posts/blog/${postId}`),
  createBlog: (body) => apiClient.post('/posts/blog', body),
  updateBlog: (postId, body) => apiClient.put(`/posts/blog/${postId}`, body),
  deleteBlog: (postId) => apiClient.delete(`/posts/blog/${postId}`),

  listDiary: ({ limit, cursor } = {}) => apiClient.get(`/posts/diary${buildQuery({ limit, cursor })}`),
  getDiary: (postId) => apiClient.get(`/posts/diary/${postId}`),
  createDiary: (body) => apiClient.post('/posts/diary', body),
  updateDiary: (postId, body) => apiClient.put(`/posts/diary/${postId}`, body),
  deleteDiary: (postId) => apiClient.delete(`/posts/diary/${postId}`),

  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/posts/upload-image', formData);
  },
};
