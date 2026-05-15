import { apiClient } from "./client";
import type { Package, PackageType } from "@/types";

export const packagesService = {
  async list(type?: PackageType): Promise<Package[]> {
    const res = await apiClient.get<{ data: Package[] }>("/api/packages", {
      params: type ? { type } : undefined,
    });
    return res.data.data;
  },

  async getBySlug(slug: string): Promise<Package> {
    const res = await apiClient.get<{ data: Package }>(`/api/packages/${slug}`);
    return res.data.data;
  },
};
