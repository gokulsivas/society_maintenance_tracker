import apiClient from './client';

export async function getOverdueThreshold() {
  const response = await apiClient.get('/admin/settings/overdue-threshold');
  return response.data; // { overdue_threshold_days }
}

export async function updateOverdueThreshold(days) {
  const response = await apiClient.patch('/admin/settings/overdue-threshold', {
    overdue_threshold_days: parseInt(days, 10),
  });
  return response.data;
}
