import apiClient from './client';

export async function listNotices(params = {}) {
  const response = await apiClient.get('/notices', { params });
  return response.data;
}

export async function getNotice(id) {
  const response = await apiClient.get(`/notices/${id}`);
  return response.data;
}

export async function createNotice(payload) {
  const response = await apiClient.post('/admin/notices', payload);
  return response.data;
}

export async function updateNotice(id, payload) {
  const response = await apiClient.patch(`/admin/notices/${id}`, payload);
  return response.data;
}

export async function deleteNotice(id) {
  const response = await apiClient.delete(`/admin/notices/${id}`);
  return response.data;
}
