import { apiClient } from "./client";
import type { PublicSettings, SiteSettings } from "@/types";

export type UpdateSettingsPayload = {
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
};

export const settingsService = {
  async getPublic(): Promise<PublicSettings> {
    const res = await apiClient.get<{ data: PublicSettings }>("/api/settings");
    return res.data.data;
  },

  async getAdmin(): Promise<SiteSettings> {
    const res = await apiClient.get<{ data: SiteSettings }>("/api/admin/settings");
    return res.data.data;
  },

  async update(payload: UpdateSettingsPayload): Promise<SiteSettings> {
    const res = await apiClient.patch<{ data: SiteSettings }>(
      "/api/admin/settings",
      payload
    );
    return res.data.data;
  },
};
