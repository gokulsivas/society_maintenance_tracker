import apiClient from './client';

export async function getAdminDashboard(params = {}, options = {}) {
  const response = await apiClient.get('/admin/dashboard', { ...options, params });
  return response.data;
}
