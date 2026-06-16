import axios from "axios";
import { loader } from "../components/Loader";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3005/api/v1",
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use(
  (config) => {
    loader.start();
    const role = localStorage.getItem("role") || "user";
    const token =
      role === "admin"
        ? localStorage.getItem("adminToken")
        : localStorage.getItem("userToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    loader.done();
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (res) => {
    loader.done();
    return res;
  },
  (error) => {
    loader.done();
    const status = error.response?.status;
    const data = error.response?.data;

    const isSessionExpired =
      status === 401 ||
      (status === 403 && !data?.requiresEmailVerification);

    if (isSessionExpired) {
      const url = error.config?.url || "";
      const isAuthRoute =
        url.includes("/signin") ||
        url.includes("/signup") ||
        url.includes("/verify-email") ||
        url.includes("/resend-verification-code");

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
