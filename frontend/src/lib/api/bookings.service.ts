import { apiClient } from "./client";
import type { Booking, PaymentMethod } from "@/types";

export type CreateBookingPayload = {
  packageSlug: string;
  startDate: string;
  travelers: { adults: number; children: number };
  contact: { name: string; email: string; phone: string };
  paymentMethod: PaymentMethod;
  notes?: string;
};

export const bookingsService = {
  async listMine(): Promise<Booking[]> {
    const res = await apiClient.get<{ data: Booking[] }>("/api/bookings/me");
    return res.data.data;
  },

  async getMine(id: string): Promise<Booking> {
    const res = await apiClient.get<{ data: Booking }>(`/api/bookings/me/${id}`);
    return res.data.data;
  },

  async create(payload: CreateBookingPayload): Promise<Booking> {
    const res = await apiClient.post<{ data: Booking }>("/api/bookings", payload);
    return res.data.data;
  },

  async cancelMine(id: string): Promise<Booking> {
    const res = await apiClient.patch<{ data: Booking }>(
      `/api/bookings/me/${id}/cancel`
    );
    return res.data.data;
  },

  async initEsewa(
    id: string
  ): Promise<{ url: string; fields: Record<string, string | number> }> {
    const res = await apiClient.post<{
      data: { url: string; fields: Record<string, string | number> };
    }>(`/api/bookings/${id}/esewa-init`);
    return res.data.data;
  },

  async verifyEsewa(data: string): Promise<Booking> {
    const res = await apiClient.post<{ data: Booking }>(
      "/api/bookings/esewa-verify",
      { data }
    );
    return res.data.data;
  },
};
