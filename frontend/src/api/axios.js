import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3005/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});
API.interceptors.request.use((config) => {
  const role = localStorage.getItem("role") || "user";
  const token =
    role === "admin"
      ? localStorage.getItem("adminToken")
      : localStorage.getItem("userToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const url = error.config?.url || "";
      const isAuthRoute =
        url.includes("/signin") ||
        url.includes("/signup") ||
        url.includes("/verify-email");
      if (!isAuthRoute && localStorage.getItem("role")) {
        ["adminToken", "userToken", "role", "adminEmail", "userEmail"].forEach(
          (k) => localStorage.removeItem(k)
        );
        if (!window.location.pathname.startsWith("/signin")) {
          window.location.href = "/signin";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
