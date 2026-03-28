import axios from 'axios'

const BASE_URL = process.env.REACT_APP_API_URL || 'http://10.212.220.32:3000'

const getToken = () => localStorage.getItem('unifix_admin_token')

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  'Content-Type': 'application/json',
})

export const adminAPI = {
  login: (email, password) =>
    axios.post(`${BASE_URL}/admin/login`, { email, password }),

  getAllStaff: () =>
    axios.get(`${BASE_URL}/admin/all-staff?_=${Date.now()}`, { headers: authHeaders() }),

  getStaff: (uid) =>
    axios.get(`${BASE_URL}/admin/staff/${uid}`, { headers: authHeaders() }),

  getStats: () =>
    axios.get(`${BASE_URL}/admin/stats?_=${Date.now()}`, { headers: authHeaders() }),

  getAllComplaints: () =>
    axios.get(`${BASE_URL}/admin/all-complaints?_=${Date.now()}`, { headers: authHeaders() }),

  getAllUsers: () =>
    axios.get(`${BASE_URL}/admin/all-users?_=${Date.now()}`, { headers: authHeaders() }),

  getUserIdCard: (uid) =>
    axios.get(`${BASE_URL}/admin/user/${uid}/idcard`, { headers: authHeaders() }),

  approveStaff: (uid) =>
    axios.post(`${BASE_URL}/admin/approve-staff`, { uid }, { headers: authHeaders() }),

  rejectStaff: (uid, rejectionMessage) =>
    axios.post(`${BASE_URL}/admin/reject-staff`, { uid, rejectionMessage }, { headers: authHeaders() }),

  getIdCardRequests: () =>
    axios.get(`${BASE_URL}/admin/idcard-requests?_=${Date.now()}`, { headers: authHeaders() }),

  approveIdCard: (requestId) =>
    axios.post(`${BASE_URL}/admin/approve-idcard`, { requestId }, { headers: authHeaders() }),

  rejectIdCard: (requestId, reason) =>
    axios.post(`${BASE_URL}/admin/reject-idcard`, { requestId, reason }, { headers: authHeaders() }),

  getDeletionRequests: () =>
    axios.get(`${BASE_URL}/admin/deletion-requests?_=${Date.now()}`, { headers: authHeaders() }),

  approveDeletion: (requestId) =>
    axios.post(`${BASE_URL}/admin/approve-deletion`, { requestId }, { headers: authHeaders() }),

  rejectDeletion: (requestId, reason) =>
    axios.post(`${BASE_URL}/admin/reject-deletion`, { requestId, reason }, { headers: authHeaders() }),

  getSecurityIssues: () =>
    axios.get(`${BASE_URL}/admin/security-issues?_=${Date.now()}`, { headers: authHeaders() }),

  resolveSecurityIssue: (issueId, resolution) =>
    axios.post(`${BASE_URL}/admin/resolve-security-issue`, { issueId, resolution }, { headers: authHeaders() }),

  getAllLostFound: () =>
    axios.get(`${BASE_URL}/admin/all-lost-found?_=${Date.now()}`, { headers: authHeaders() }),
}