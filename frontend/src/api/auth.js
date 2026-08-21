import apiClient from './client';

export async function loginUser(email, password, options = {}) {
  const response = await apiClient.post('/auth/login', { email, password }, options);
  return response.data;
}

export async function registerResident(data, options = {}) {
  const response = await apiClient.post('/auth/register', data, options);
  return response.data;
}

export async function getMe(options = {}) {
  const response = await apiClient.get('/auth/me', options);
  return response.data;
}

