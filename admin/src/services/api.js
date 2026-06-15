import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem('unifix_admin_token')

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  'Content-Type': 'application/json',
})

export const adminAPI = {
  login: (email, password) =>
    axios.post(`${BASE_URL}/admin/login`, { email, password }),

 getAllStaff: (clientHash) =>
    axios.get(`${BASE_URL}/admin/all-staff`, { headers: { ...authHeaders(), ...(clientHash ? { 'x-client-hash': clientHash } : {}) } }),

  getStaff: (uid) =>
    axios.get(`${BASE_URL}/admin/staff/${uid}`, { headers: authHeaders() }),

  getStats: () =>
    axios.get(`${BASE_URL}/admin/stats?_=${Date.now()}`, { headers: authHeaders() }),

getAllComplaints: (clientHash) =>
    axios.get(`${BASE_URL}/admin/all-complaints`, { headers: { ...authHeaders(), ...(clientHash ? { 'x-client-hash': clientHash } : {}) } }),

  getAllUsers: (clientHash) =>
    axios.get(`${BASE_URL}/admin/all-users`, { headers: { ...authHeaders(), ...(clientHash ? { 'x-client-hash': clientHash } : {}) } }),

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

getAllLostFound: (clientHash) =>
    axios.get(`${BASE_URL}/admin/all-lost-found`, { headers: { ...authHeaders(), ...(clientHash ? { 'x-client-hash': clientHash } : {}) } }),

getAllLostReports: (clientHash) =>
    axios.get(`${BASE_URL}/admin/all-lost-reports`, { headers: { ...authHeaders(), ...(clientHash ? { 'x-client-hash': clientHash } : {}) } }),

  // getComplaintsHash: () =>
  //   axios.get(`${BASE_URL}/admin/complaints-hash`, { headers: authHeaders() }),

  // getStaffHash: () =>
  //   axios.get(`${BASE_URL}/admin/staff-hash`, { headers: authHeaders() }),

  // getStatsHash: () =>
  //   axios.get(`${BASE_URL}/admin/stats-hash`, { headers: authHeaders() }),

  // getUsersHash: () =>
  //   axios.get(`${BASE_URL}/admin/users-hash`, { headers: authHeaders() }),

  // getLostFoundHash: () =>
  //   axios.get(`${BASE_URL}/admin/lost-found-hash`, { headers: authHeaders() }),

  // getLostReportsHash: () =>
  //   axios.get(`${BASE_URL}/admin/lost-reports-hash`, { headers: authHeaders() }),

  iwillHandle: (complaintId) =>
    axios.post(`${BASE_URL}/admin/iwillhandle`, { complaintId }, { headers: authHeaders() }),

  markFlagResolved: (complaintId) =>
    axios.post(`${BASE_URL}/admin/mark-flag-resolved`, { complaintId }, { headers: authHeaders() }),
}