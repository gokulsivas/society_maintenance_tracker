import apiClient from './client';

export async function createComplaint(payload, options = {}) {
  const response = await apiClient.post('/complaints', payload, options);
  return response.data;
}

export async function updateComplaint(id, payload, options = {}) {
  const response = await apiClient.patch(`/complaints/${id}`, payload, options);
  return response.data;
}

export async function getMyComplaints(options = {}) {
  const response = await apiClient.get('/complaints/my', options);
  // Returns direct array of ComplaintRead
  return response.data;
}

export async function getComplaint(id, options = {}) {
  const response = await apiClient.get(`/complaints/${id}`, options);
  return response.data;
}

export async function listAdminComplaints(params = {}, options = {}) {
  const response = await apiClient.get('/admin/complaints', { ...options, params });
  return response.data;
}

export async function updateComplaintPriority(id, priority, options = {}) {
  const response = await apiClient.patch(`/admin/complaints/${id}/priority`, { priority }, options);
  return response.data;
}

export async function updateComplaintStatus(id, status, note = null, options = {}) {
  const payload = { status };
  if (note && note.trim()) {
    payload.note = note.trim();
  }
  const response = await apiClient.patch(`/admin/complaints/${id}/status`, payload, options);
  return response.data;
}
