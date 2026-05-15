import { apiClient } from "./client";
import type {
  AdminBooking,
  BookingStatus,
  ContactMessage,
  DashboardStats,
  MessageStatus,
  Package,
  PackageCategory,
  PackageType,
  Paginated,
  PaymentStatus,
  User,
  UserRole,
} from "@/types";

export type ListMessagesParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: MessageStatus;
};

export type MessagesPage = Paginated<ContactMessage> & { unread: number };

export type ListUsersParams = {
  page?: number;
  limit?: number;
  q?: string;
};

export type ListBookingsParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
};

export type PackagePayload = {
  title: string;
  description: string;
  priceNPR: number;
  gallery: string[];
  isOffer: boolean;
  category: PackageCategory;
  type: PackageType;
};

export const adminService = {
  // Users
  async listUsers(params: ListUsersParams = {}): Promise<Paginated<User>> {
    const res = await apiClient.get<{ data: Paginated<User> }>("/api/admin/users", {
      params,
    });
    return res.data.data;
  },

  async updateUserRole(id: string, role: UserRole): Promise<User> {
    const res = await apiClient.patch<{ data: { user: User } }>(
      `/api/admin/users/${id}`,
      { role }
    );
    return res.data.data.user;
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/users/${id}`);
  },

  // Packages
  async listPackages(type?: PackageType): Promise<Package[]> {
    const res = await apiClient.get<{ data: Package[] }>("/api/admin/packages", {
      params: type ? { type } : undefined,
    });
    return res.data.data;
  },

  async createPackage(payload: PackagePayload): Promise<Package> {
    const res = await apiClient.post<{ data: Package }>("/api/admin/packages", payload);
    return res.data.data;
  },

  async updatePackage(
    id: string,
    payload: PackagePayload & { regenerateSlug?: boolean }
  ): Promise<Package> {
    const res = await apiClient.patch<{ data: Package }>(
      `/api/admin/packages/${id}`,
      payload
    );
    return res.data.data;
  },

  async deletePackage(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/packages/${id}`);
  },

  // Bookings
  async listBookings(
    params: ListBookingsParams = {}
  ): Promise<Paginated<AdminBooking>> {
    const res = await apiClient.get<{ data: Paginated<AdminBooking> }>(
      "/api/admin/bookings",
      { params }
    );
    return res.data.data;
  },

  async getBooking(id: string): Promise<AdminBooking> {
    const res = await apiClient.get<{ data: AdminBooking }>(
      `/api/admin/bookings/${id}`
    );
    return res.data.data;
  },

  async updateBookingStatus(
    id: string,
    status: BookingStatus
  ): Promise<AdminBooking> {
    const res = await apiClient.patch<{ data: AdminBooking }>(
      `/api/admin/bookings/${id}/status`,
      { status }
    );
    return res.data.data;
  },

  async updateBookingPayment(
    id: string,
    paymentStatus: PaymentStatus
  ): Promise<AdminBooking> {
    const res = await apiClient.patch<{ data: AdminBooking }>(
      `/api/admin/bookings/${id}/payment`,
      { paymentStatus }
    );
    return res.data.data;
  },

  async deleteBooking(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/bookings/${id}`);
  },

  // Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await apiClient.get<{ data: DashboardStats }>(
      "/api/admin/analytics/overview"
    );
    return res.data.data;
  },

  // Messages
  async listMessages(params: ListMessagesParams = {}): Promise<MessagesPage> {
    const res = await apiClient.get<{ data: MessagesPage }>(
      "/api/admin/messages",
      { params }
    );
    return res.data.data;
  },

  async getMessage(id: string): Promise<ContactMessage> {
    const res = await apiClient.get<{ data: ContactMessage }>(
      `/api/admin/messages/${id}`
    );
    return res.data.data;
  },

  async markMessageRead(id: string): Promise<ContactMessage> {
    const res = await apiClient.patch<{ data: ContactMessage }>(
      `/api/admin/messages/${id}/read`
    );
    return res.data.data;
  },

  async replyToMessage(id: string, body: string): Promise<ContactMessage> {
    const res = await apiClient.post<{ data: ContactMessage }>(
      `/api/admin/messages/${id}/reply`,
      { body }
    );
    return res.data.data;
  },

  async deleteMessage(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/messages/${id}`);
  },
};
