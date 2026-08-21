import apiClient from './client';

export async function loginUser(email, password) {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
}

export async function registerResident(data) {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
}

export async function getMe() {
  const response = await apiClient.get('/auth/me');
  return response.data;
}
