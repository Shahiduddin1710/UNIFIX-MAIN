import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../firebase/firebaseConfig";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const getToken = async (forceRefresh = false): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return await user.getIdToken(forceRefresh);
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

  // Token expired — force refresh and retry once
  if (res.status === 401 && requiresAuth) {
    try {
      const freshToken = await getToken(true);
      headers["Authorization"] = `Bearer ${freshToken}`;
      const retry = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Still 401 after refresh — session is dead, force logout
      if (retry.status === 401) {
        await auth.signOut();
        await AsyncStorage.multiRemove([
          "unifix_cached_user",
          "unifix_active_tab",
          "unifix_staff_active_tab",
          "unifix_admin_active_tab",
        ]);
        throw new Error("SESSION_EXPIRED");
      }

      let retryData: any;
      const retryType = retry.headers.get("content-type");
      if (retryType && retryType.includes("application/json")) {
        retryData = await retry.json();
      } else {
        retryData = { message: await retry.text() };
      }

      if (!retry.ok) {
        throw new Error(retryData?.error || retryData?.message || "Request failed");
      }

      return retryData;
    } catch (err: any) {
      throw err;
    }
  }

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
  myComplaintsSince: (since: number | null) =>
    get(`/complaints/my-complaints${since ? `?since=${since}` : ''}`),
  getHash: () => get("/complaints/my-complaints/hash"),
  allComplaintsSince: (since: number | null) =>
    get(`/admin/all-complaints${since ? `?since=${since}` : ''}`),
  getAdminHash: () => get("/admin/all-complaints/hash"),

 staffComplaints: () => get("/complaints/staff-complaints"),
  staffComplaintsSince: (since: number | null) =>
    get(`/complaints/staff-complaints${since ? `?since=${since}` : ''}`),
getStaffHash: () => get("/complaints/staff-complaints/hash"),
  getById: (id: string) => get(`/complaints/${id}`),
};

export const lostFoundAPI = {
  feed: (cursor?: string) =>
    get(`/lost-found/feed?limit=10${cursor ? `&after=${cursor}` : ""}`),
  feedSince: (since: number | null) =>
    get(`/lost-found/feed${since ? `?since=${since}` : ""}`),
  getFeedHash: () => get("/lost-found/feed/hash"),

  myPosts: () => get("/lost-found/my-posts"),
  myPostsSince: (since: number | null) =>
    get(`/lost-found/my-posts${since ? `?since=${since}` : ""}`),

  claims: () => get("/lost-found/claims"),
  claimsSince: (since: number | null) =>
    get(`/lost-found/claims${since ? `?since=${since}` : ""}`),
  getClaimsHash: () => get("/lost-found/claims/hash"),

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

  deletePost: (itemId: string) =>
    request("DELETE", `/lost-found/${itemId}`, undefined),
};
export const lostReportsAPI = {
  feed: (cursor?: string) =>
    get(`/lost-reports/feed?limit=10${cursor ? `&after=${cursor}` : ""}`),
  feedSince: (since: number | null) =>
    get(`/lost-reports/feed${since ? `?since=${since}` : ""}`),
  getFeedHash: () => get("/lost-reports/feed/hash"),

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