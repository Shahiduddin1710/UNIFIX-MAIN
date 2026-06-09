import { auth } from "../firebase/firebaseConfig";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const getToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return await user.getIdToken();
};

const request = async (
  method: string,
  endpoint: string,
  body?: object,
  requiresAuth = true
): Promise<any> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const token = await getToken();
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    data = { message: text };
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
};

const get = (endpoint: string) => request("GET", endpoint);
const post = (endpoint: string, body: object, requiresAuth = true) =>
  request("POST", endpoint, body, requiresAuth);

export const authAPI = {
  signup: (fullName: string, email: string, password: string, role: string) =>
    post("/auth/signup", { fullName, email, password, role }, false),

  verifyOtp: (email: string, otp: string, fullName: string, password: string, role: string) =>
    post("/auth/verify-otp", { email, otp, fullName, password, role }, false),

  resendOtp: (email: string, fullName: string, type: string) =>
    post("/auth/resend-otp", { email, fullName, type }, false),

  login: (email: string, password: string) =>
    post("/auth/login", { email, password }, false),

  forgotPassword: (email: string) =>
    post("/auth/forgot-password", { email }, false),

  validateResetOtp: (email: string, otp: string) =>
    post("/auth/validate-reset-otp", { email, otp }, false),

  verifyResetOtp: (email: string, otp: string, newPassword: string) =>
    post("/auth/verify-reset-otp", { email, otp, newPassword }, false),

  changePassword: (currentPassword: string, newPassword: string) =>
    post("/auth/change-password", { currentPassword, newPassword }),

  updateProfile: (fullName: string, phone?: string) =>
    post("/auth/update-profile", { fullName, phone }),

  logoutAllDevices: () => post("/auth/logout-all-devices", {}),

  deleteAccount: () => post("/auth/delete-account", {}),

  reportSecurityIssue: (issueType: string, description: string) =>
    post("/auth/report-security-issue", { issueType, description }),

  requestIdCardUpdate: (newIdCardUrl: string, newIdCardName?: string) =>
    post("/auth/request-idcard-update", { newIdCardUrl, newIdCardName }),

  myProfile: () => get("/auth/my-profile"),

 savePushToken: (expoPushToken: string) =>
    post("/auth/save-push-token", { expoPushToken }),

  reportRagging: (payload: {
    incidentDate: string;
    incidentTime: string;
    location: string;
    description: string;
    bullyDescription: string;
    isAnonymous: boolean;
  }) => post("/auth/report-ragging", payload),
};

export const complaintsAPI = {
  submit: (payload: {
    category: string;
    subIssue: string | null;
    customIssue: string | null;
    description: string;
    building: string;
    roomDetail: string;
    photoUrl: string | null;
  }) => post("/complaints/submit", payload),

  accept: (complaintId: string) =>
    post("/complaints/accept", { complaintId }),

  updateStatus: (complaintId: string, status: string) =>
    post("/complaints/update-status", { complaintId, status }),

  reject: (complaintId: string, reason: string) =>
    post("/complaints/reject", { complaintId, reason }),

  rate: (complaintId: string, rating: number, comment?: string) =>
    post("/complaints/rate", { complaintId, rating, comment }),

  myComplaints: () => get("/complaints/my-complaints"),

  staffComplaints: () => get("/complaints/staff-complaints"),
};

export const lostFoundAPI = {
  feed: (cursor?: string) =>
    get(`/lost-found/feed?limit=10${cursor ? `&after=${cursor}` : ""}`),

  myPosts: () => get("/lost-found/my-posts"),

  claims: () => get("/lost-found/claims"),

  postItem: (payload: {
    itemName: string;
    category: string;
    description: string;
    roomNumber: string;
    roomLabel: string;
    collectLocation: string;
    photoUrl: string | null;
  }) => post("/lost-found/post", payload),

  handover: (itemId: string, handedToName: string) =>
    post("/lost-found/handover", { itemId, handedToName }),
};

export const lostReportsAPI = {
  feed: (cursor?: string) =>
    get(`/lost-reports/feed?limit=10${cursor ? `&after=${cursor}` : ""}`),

  post: (payload: {
    itemName: string;
    category: string;
    description: string;
    locationLost: string;
    dateLost: string;
    howToReach: string;
    images: string[];
  }) => request("POST", "/lost-reports/post", payload),


  markFound: (id: string) => request("PATCH", `/lost-reports/${id}/found`, {}),

  deleteReport: (id: string) => request("DELETE", `/lost-reports/${id}`, undefined),
};