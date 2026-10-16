import { baseApi, api } from "./axios";
import type { AuthUser, LoginRequest } from "../type/auth";

export const login = async (
  credentials: LoginRequest
): Promise<AuthUser> => {
  const response = await baseApi.post<AuthUser>(
    "/auth/login",
    credentials
  );

  return response.data;
};

export const logout = async (): Promise<void> => {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.warn(
      "Logout request failed, clearing local session anyway.",
      error
    );
  } finally {
    localStorage.removeItem("user");

    window.dispatchEvent(new CustomEvent("auth:logout"));
  }
};

export const getMe = async (): Promise<AuthUser> => {
  const response = await api.get<AuthUser>("/auth/me");

  return response.data;
};