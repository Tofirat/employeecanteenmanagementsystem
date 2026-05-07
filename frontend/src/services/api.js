import axios from "axios";

const ACCESS_TOKEN_KEY = "canteen_access_token";
const REFRESH_TOKEN_KEY = "canteen_refresh_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
});

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens) {
  if (tokens?.access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    api.defaults.headers.common.Authorization = `Bearer ${tokens.access}`;
  }
  if (tokens?.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  delete api.defaults.headers.common.Authorization;
}

const existingToken = getAccessToken();
if (existingToken) {
  api.defaults.headers.common.Authorization = `Bearer ${existingToken}`;
}

export const login = async (payload) => {
  const { data } = await api.post("/auth/login/", payload);
  setTokens(data.tokens);
  return data;
};

export const register = async (payload) => {
  const { data } = await api.post("/auth/register/", payload);
  setTokens(data.tokens);
  return data;
};

export const logout = async () => {
  try {
    const refresh = getRefreshToken();
    await api.post("/auth/logout/", { refresh });
  } finally {
    clearTokens();
  }
};

export const fetchProfile = async () => (await api.get("/auth/profile/")).data;
export const fetchEmployees = async () => (await api.get("/employees/")).data;
export const fetchMyEmployeeProfile = async () => (await api.get("/employees/me/")).data;
export const updateMyEmployeeProfile = async (payload) => (await api.patch("/employees/me/", payload)).data;
export const createEmployee = async (payload) => (await api.post("/employees/", payload)).data;
export const fetchDepartments = async () => (await api.get("/departments/")).data;
export const createDepartment = async (payload) => (await api.post("/departments/", payload)).data;
export const fetchMenuItems = async () => (await api.get("/menu/")).data;
export const createMenuItem = async (payload) => (await api.post("/menu/", payload)).data;
export const updateMenuItem = async (menuItemId, payload) => (await api.patch(`/menu/${menuItemId}/`, payload)).data;
export const deleteMenuItem = async (menuItemId) => (await api.delete(`/menu/${menuItemId}/`)).data;
export const fetchOrders = async () => (await api.get("/orders/")).data;
export const createOrder = async (payload) => (await api.post("/orders/", payload)).data;
export const updateOrderStatus = async (orderId, payload) => (await api.patch(`/orders/${orderId}/status/`, payload)).data;
export const cancelOrder = async (orderId) => (await api.patch(`/orders/${orderId}/cancel/`)).data;
export const fetchPayments = async () => (await api.get("/payments/")).data;
export const updatePayment = async (paymentId, payload) => (await api.patch(`/payments/${paymentId}/`, payload)).data;
export const createPayment = async (payload) => (await api.post("/payments/", payload)).data;
export const initiateSslPayment = async (paymentId) => (await api.post(`/payments/${paymentId}/sslcommerz/initiate/`)).data;
export const fetchDashboardStats = async () => (await api.get("/reports/dashboard/stats/")).data;
export const fetchDailyReport = async () => (await api.get("/reports/daily/")).data;
export const fetchMonthlyReport = async () => (await api.get("/reports/monthly/")).data;
export const fetchWeeklyTrends = async () => (await api.get("/reports/trends/weekly/")).data;
export const fetchConsumptionReport = async (days = 7) => (await api.get(`/reports/consumption/?days=${days}`)).data;
export const fetchAdminOrderReports = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return (await api.get(`/admin/reports/orders/${suffix}`)).data;
};
export const getInvoiceUrl = (paymentId) => `${api.defaults.baseURL}/payments/${paymentId}/invoice/`;
export const getPublicInvoiceUrl = (paymentId, token) => `${api.defaults.baseURL}/payments/${paymentId}/invoice/public/?token=${encodeURIComponent(token)}`;

export default api;
