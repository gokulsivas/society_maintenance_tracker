import apiClient from './client';

export async function createComplaint(payload) {
  const response = await apiClient.post('/complaints', payload);
  return response.data;
}

export async function updateComplaint(id, payload) {
  const response = await apiClient.patch(`/complaints/${id}`, payload);
  return response.data;
}

export async function getMyComplaints() {
  const response = await apiClient.get('/complaints/my');
  // Returns direct array of ComplaintRead
  return response.data;
}

export async function getComplaint(id) {
  const response = await apiClient.get(`/complaints/${id}`);
  return response.data;
}

export async function listAdminComplaints(params = {}) {
  const response = await apiClient.get('/admin/complaints', { params });
  return response.data;
}

export async function updateComplaintPriority(id, priority) {
  const response = await apiClient.patch(`/admin/complaints/${id}/priority`, { priority });
  return response.data;
}

export async function updateComplaintStatus(id, status, note = null) {
  const payload = { status };
  if (note && note.trim()) {
    payload.note = note.trim();
  }
  const response = await apiClient.patch(`/admin/complaints/${id}/status`, payload);
  return response.data;
}
