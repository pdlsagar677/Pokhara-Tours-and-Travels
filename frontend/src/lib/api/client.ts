import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth.store";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const AUTH_PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/resend-verification",
  "/api/auth/verify-email",
];

function isAuthPublic(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_PUBLIC_ROUTES.some((r) => url.includes(r));
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (isAuthPublic(config.url)) return config;
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RefreshResult = { user: import("@/types").User; accessToken: string };
let refreshing: Promise<RefreshResult> | null = null;

async function refreshSession(): Promise<RefreshResult> {
  if (!refreshing) {
    refreshing = apiClient
      .post<{ data: RefreshResult }>("/api/auth/refresh")
      .then((res) => res.data.data)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";

    if (status === 401 && original && !original._retry && !isAuthPublic(url)) {
      original._retry = true;
      try {
        const { user, accessToken } = await refreshSession();
        useAuthStore.getState().setSession({ user, accessToken });
        original.headers = original.headers || {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
        return apiClient.request(original);
      } catch {
        useAuthStore.getState().clear();
      }
    }
    return Promise.reject(error);
  }
);

export function extractApiError(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
