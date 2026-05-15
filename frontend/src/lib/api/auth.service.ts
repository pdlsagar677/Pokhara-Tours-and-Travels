import { apiClient } from "./client";
import type { User, AuthSessionInfo } from "@/types";

export type RegisterPayload = {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterResult = {
  user: User;
  requiresEmailVerification: boolean;
  message: string;
};

export type AuthSession = {
  user: User;
  accessToken: string;
};

export type VerifyResult = {
  user: User;
  accessToken?: string;
  verified?: boolean;
  alreadyVerified?: boolean;
};

export const authService = {
  async register(payload: RegisterPayload): Promise<RegisterResult> {
    const res = await apiClient.post<{
      data: { user: User; requiresEmailVerification: boolean; message: string };
    }>("/api/auth/register", payload);
    return res.data.data;
  },

  async login(
    payload: LoginPayload
  ): Promise<AuthSession | { require2fa: true; challengeToken: string }> {
    const res = await apiClient.post<{
      data: AuthSession | { require2fa: true; challengeToken: string };
    }>("/api/auth/login", payload);
    return res.data.data;
  },

  async loginTwoFactor(payload: {
    challengeToken: string;
    code: string;
  }): Promise<AuthSession> {
    const res = await apiClient.post<{ data: AuthSession }>(
      "/api/auth/login/2fa",
      payload
    );
    return res.data.data;
  },

  async refresh(): Promise<AuthSession> {
    const res = await apiClient.post<{ data: AuthSession }>(
      "/api/auth/refresh"
    );
    return res.data.data;
  },

  async verifyEmail(payload: { email: string; otp: string }): Promise<VerifyResult> {
    const res = await apiClient.post<{ data: VerifyResult }>(
      "/api/auth/verify-email",
      payload
    );
    return res.data.data;
  },

  async resendVerification(email: string): Promise<void> {
    await apiClient.post("/api/auth/resend-verification", { email });
  },

  async logout(): Promise<void> {
    await apiClient.post("/api/auth/logout");
  },

  async me(): Promise<User | null> {
    try {
      const res = await apiClient.get<{ data: { user: User } }>("/api/auth/me");
      return res.data.data.user;
    } catch {
      return null;
    }
  },

  async updateProfile(payload: { name: string }): Promise<User> {
    const res = await apiClient.patch<{ data: { user: User } }>(
      "/api/auth/me",
      payload
    );
    return res.data.data.user;
  },

  async deleteAccount(payload: {
    password: string;
  }): Promise<{ ok: true; deletedBookings: number }> {
    const res = await apiClient.delete<{
      data: { ok: true; deletedBookings: number };
    }>("/api/auth/me", { data: payload });
    return res.data.data;
  },

  async requestPasswordChange(payload: {
    currentPassword: string;
  }): Promise<{ ok: true; ttlMinutes: number; emailHint: string }> {
    const res = await apiClient.post<{
      data: { ok: true; ttlMinutes: number; emailHint: string };
    }>("/api/auth/change-password/request", payload);
    return res.data.data;
  },

  async confirmPasswordChange(payload: {
    otp: string;
    newPassword: string;
  }): Promise<User> {
    const res = await apiClient.post<{ data: { user: User } }>(
      "/api/auth/change-password/confirm",
      payload
    );
    return res.data.data.user;
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post("/api/auth/forgot-password", { email });
  },

  async resetPassword(payload: {
    token: string;
    id: string;
    newPassword: string;
  }): Promise<void> {
    await apiClient.post("/api/auth/reset-password", payload);
  },

  async setupTwoFactor(payload: {
    password: string;
  }): Promise<{
    otpauthUrl: string;
    secretBase32: string;
    backupCodes: string[];
    ttlMinutes: number;
  }> {
    const res = await apiClient.post<{
      data: {
        otpauthUrl: string;
        secretBase32: string;
        backupCodes: string[];
        ttlMinutes: number;
      };
    }>("/api/auth/2fa/setup", payload);
    return res.data.data;
  },

  async enableTwoFactor(payload: { code: string }): Promise<User> {
    const res = await apiClient.post<{ data: { user: User } }>(
      "/api/auth/2fa/enable",
      payload
    );
    return res.data.data.user;
  },

  async disableTwoFactor(payload: {
    password: string;
    code: string;
  }): Promise<User> {
    const res = await apiClient.post<{ data: { user: User } }>(
      "/api/auth/2fa/disable",
      payload
    );
    return res.data.data.user;
  },

  async listSessions(): Promise<AuthSessionInfo[]> {
    const res = await apiClient.get<{ data: { items: AuthSessionInfo[] } }>(
      "/api/auth/sessions"
    );
    return res.data.data.items;
  },

  async revokeSession(id: string): Promise<{ ok: true; current: boolean }> {
    const res = await apiClient.delete<{
      data: { ok: true; current: boolean };
    }>(`/api/auth/sessions/${id}`);
    return res.data.data;
  },

  async revokeOtherSessions(): Promise<{ ok: true; remaining: number }> {
    const res = await apiClient.delete<{
      data: { ok: true; remaining: number };
    }>("/api/auth/sessions");
    return res.data.data;
  },
};
