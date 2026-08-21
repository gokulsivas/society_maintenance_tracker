import apiClient from './client';

export async function getAdminDashboard(params = {}) {
  const response = await apiClient.get('/admin/dashboard', { params });
  return response.data;
}
