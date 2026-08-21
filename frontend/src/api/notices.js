import apiClient from './client';

export async function listNotices(params = {}, options = {}) {
  const response = await apiClient.get('/notices', { ...options, params });
  return response.data;
}

export async function getNotice(id, options = {}) {
  const response = await apiClient.get(`/notices/${id}`, options);
  return response.data;
}

export async function createNotice(payload, options = {}) {
  const response = await apiClient.post('/admin/notices', payload, options);
  return response.data;
}

export async function updateNotice(id, payload, options = {}) {
  const response = await apiClient.patch(`/admin/notices/${id}`, payload, options);
  return response.data;
}

export async function deleteNotice(id, options = {}) {
  const response = await apiClient.delete(`/admin/notices/${id}`, options);
  return response.data;
}
