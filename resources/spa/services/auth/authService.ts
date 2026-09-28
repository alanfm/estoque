import type { ApiResource } from "../../types/api";
import type {
  ChangePasswordData,
  ForgotPasswordData,
  LoginCredentials,
  ResetPasswordData,
  SessionUser,
} from "../../types/auth";
import { apiRequest } from "../api/client";

export const authService = {
  async login(credentials: LoginCredentials): Promise<SessionUser> {
    const response = await apiRequest<ApiResource<SessionUser>>("/auth/login", {
      method: "POST",
      body: credentials,
    });

    return response.data;
  },

  async logout(): Promise<void> {
    await apiRequest<void>("/auth/logout", { method: "POST" });
  },

  async currentUser(signal?: AbortSignal): Promise<SessionUser> {
    const response = await apiRequest<ApiResource<SessionUser>>("/auth/user", {
      signal,
    });

    return response.data;
  },

  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    await apiRequest<void>("/auth/forgot-password", {
      method: "POST",
      body: data,
    });
  },

  async resetPassword(data: ResetPasswordData): Promise<void> {
    await apiRequest<void>("/auth/reset-password", {
      method: "POST",
      body: data,
    });
  },

  async changePassword(data: ChangePasswordData): Promise<void> {
    await apiRequest<void>("/auth/password", { method: "PUT", body: data });
  },
};
