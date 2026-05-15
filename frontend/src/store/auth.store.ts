"use client";

import { create } from "zustand";
import {
  authService,
  type AuthSession,
  type LoginPayload,
  type RegisterPayload,
  type RegisterResult,
  type VerifyResult,
} from "@/lib/api/auth.service";
import type { User } from "@/types";

export type LoginResult =
  | { type: "session"; user: User }
  | { type: "twoFactorRequired"; challengeToken: string };

type AuthState = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  hydrate: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<LoginResult>;
  loginTwoFactor: (payload: {
    challengeToken: string;
    code: string;
  }) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  verifyEmail: (params: { token: string; id: string }) => Promise<VerifyResult>;
  resendVerification: (email: string) => Promise<void>;
  updateProfile: (payload: { name: string }) => Promise<User>;
  deleteAccount: (payload: { password: string }) => Promise<{
    ok: true;
    deletedBookings: number;
  }>;
  requestPasswordChange: (payload: { currentPassword: string }) => Promise<{
    ok: true;
    ttlMinutes: number;
    emailHint: string;
  }>;
  confirmPasswordChange: (payload: {
    otp: string;
    newPassword: string;
  }) => Promise<void>;
  setSession: (session: AuthSession) => void;
  clear: () => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrating: true,

  hydrate: async () => {
    set({ isHydrating: true });
    try {
      const { user, accessToken } = await authService.refresh();
      set({ user, accessToken, isAuthenticated: true });
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false });
    } finally {
      set({ isHydrating: false });
    }
  },

  login: async (payload) => {
    const result = await authService.login(payload);
    if ("require2fa" in result) {
      return {
        type: "twoFactorRequired",
        challengeToken: result.challengeToken,
      };
    }
    set({
      user: result.user,
      accessToken: result.accessToken,
      isAuthenticated: true,
    });
    return { type: "session", user: result.user };
  },

  loginTwoFactor: async (payload) => {
    const { user, accessToken } = await authService.loginTwoFactor(payload);
    set({ user, accessToken, isAuthenticated: true });
    return user;
  },

  register: async (payload) => {
    return authService.register(payload);
  },

  verifyEmail: async (params) => {
    const result = await authService.verifyEmail(params);
    if (result.user && !result.alreadyVerified && result.accessToken) {
      set({
        user: result.user,
        accessToken: result.accessToken,
        isAuthenticated: true,
      });
    }
    return result;
  },

  resendVerification: async (email) => {
    await authService.resendVerification(email);
  },

  updateProfile: async (payload) => {
    const user = await authService.updateProfile(payload);
    set({ user });
    return user;
  },

  deleteAccount: async (payload) => {
    const result = await authService.deleteAccount(payload);
    set({ user: null, accessToken: null, isAuthenticated: false });
    return result;
  },

  requestPasswordChange: async (payload) => {
    return authService.requestPasswordChange(payload);
  },

  confirmPasswordChange: async (payload) => {
    await authService.confirmPasswordChange(payload);
  },

  setSession: ({ user, accessToken }) => {
    set({ user, accessToken, isAuthenticated: true });
  },

  clear: () => {
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  logout: async () => {
    // Kill the access token + user immediately so the UI flips to logged-out
    // synchronously. Don't wait for the backend round-trip.
    set({ user: null, accessToken: null, isAuthenticated: false });
    // Then tell the backend to clear the refresh cookie + DB hash. Fire and
    // forget — local state is already correct, and the cookie/hash will also
    // expire on their own.
    try {
      await authService.logout();
    } catch {
      // ignore — local state is already cleared
    }
  },
}));
