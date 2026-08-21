import apiClient from './client';

export async function uploadComplaintPhoto(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/uploads/complaint-photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data; // { secure_url, public_id }
}
