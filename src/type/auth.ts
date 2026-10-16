import type { Address } from "./user";

export type UserRole = "buyer" | "seller" | "admin";
export type UserStatus = "active" | "suspended";

export interface LoginRequest {
  identifier: string;
  password: string;
  remember: boolean;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
  addresses?: Address[];
}

export interface AuthRefreshResponse {
  user?: AuthUser;
  expiresAt?: string;
}

export interface CsrfToken {
  token: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
