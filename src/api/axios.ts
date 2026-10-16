import axios from "axios";
import type { AuthRefreshResponse, CsrfToken } from "../type/auth";

const baseConfig = {
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
};

export const baseApi = axios.create(baseConfig);
export const api = axios.create(baseConfig);

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
let refreshPromise: Promise<void> | null = null;

const clearAuthAndRedirect = () => {
  localStorage.removeItem("user");
  window.location.href = "/login";
};

const getCsrfToken = async (): Promise<string> => {
  const response = await baseApi.get<CsrfToken>("/auth/csrf");
  return response.data.token;
};

const refreshSession = async (): Promise<void> => {
  const csrfToken = await getCsrfToken();
  await baseApi.post<AuthRefreshResponse>("/auth/refresh", undefined, {
    headers: {
      "X-CSRF-Token": csrfToken,
    },
  });
};

api.interceptors.request.use(async (config) => {
  if (!safeMethods.has((config.method ?? "GET").toUpperCase())) {
    const csrfToken = await getCsrfToken();
    config.headers["X-CSRF-Token"] = csrfToken;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config as
      | (NonNullable<typeof error.config> & { _retry?: boolean })
      | undefined;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshSession();
      }
      await refreshPromise;
      return api(originalRequest);
    } catch (refreshError) {
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  }
);

export default api;
