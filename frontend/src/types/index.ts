export type UserRole = "user" | "admin";

export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  isEmailVerified: boolean;
  twoFactorEnabled?: boolean;
  createdAt: string;
};

export type AuthSessionInfo = {
  id: string;
  deviceLabel: string;
  ipAddress: string;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
};

export type PackageCategory =
  | "trek"
  | "tour"
  | "adventure"
  | "cultural"
  | "wildlife";

export const PACKAGE_CATEGORIES: PackageCategory[] = [
  "trek",
  "tour",
  "adventure",
  "cultural",
  "wildlife",
];

export type PackageType = "destination" | "hotel" | "adventure";

export const PACKAGE_TYPES: PackageType[] = ["destination", "hotel", "adventure"];

export type Package = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceNPR: number;
  gallery: string[];
  isOffer: boolean;
  category: PackageCategory;
  type: PackageType;
  createdAt: string;
};

export type BookingStatus = "pending" | "confirmed" | "cancelled";
export type PaymentMethod = "advance" | "on_arrival";
export type PaymentStatus = "advance_pending" | "awaiting_arrival" | "paid";

export type Booking = {
  id: string;
  packageSlug: string;
  startDate: string;
  travelers: { adults: number; children: number };
  contact: { name: string; email: string; phone: string };
  notes?: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalNPR: number;
  packageSnapshot?: {
    title: string;
    priceNPR: number;
    coverImage?: string | null;
  };
  esewaTransactionUuid?: string | null;
  esewaTransactionCode?: string | null;
  createdAt: string;
};

export type AdminBookingUser = Pick<
  User,
  "id" | "name" | "username" | "email" | "phone"
>;

export type AdminBooking = Booking & {
  user: AdminBookingUser | null;
};

export type DashboardStats = {
  counts: {
    users: number;
    packages: number;
    bookings: number;
    bookings30d: number;
  };
  revenue: {
    lifetimeNPR: number;
    last30dNPR: number;
  };
  recentBookings: AdminBooking[];
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type PublicSettings = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
};

export type MessageStatus = "new" | "read" | "replied";

export type ContactReply = {
  body: string;
  sentAt: string;
  sentBy?: string;
};

export type ContactMessage = {
  id: string;
  user?: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  replies: ContactReply[];
  createdAt: string;
  updatedAt: string;
};

export type SiteSettings = PublicSettings & {
  id: string;
  key: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiSuccess<T> = { data: T; message?: string };
export type ApiError = { error: string; code?: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function isApiError<T>(res: ApiResponse<T>): res is ApiError {
  return "error" in res;
}

export type AIRecommendation = Package & { reason: string };

export type AIRecommendationsResponse = {
  picks: AIRecommendation[];
  personalized: boolean;
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatResponse = {
  reply: string;
  suggestedSlugs: string[];
  aiEnabled: boolean;
};

export type ItineraryDay = {
  day: number;
  title: string;
  activities: string[];
};

export type Itinerary = {
  days: ItineraryDay[];
};

export type ItineraryResponse = {
  itinerary: Itinerary;
  cached: boolean;
  aiEnabled?: boolean;
};

export type BestSeasonResponse = {
  note: string;
  cached: boolean;
  aiEnabled?: boolean;
};

export type SemanticSearchResult = Package & {
  score: number;
  reason: string;
};

export type SemanticSearchResponse = {
  results: SemanticSearchResult[];
  aiEnabled?: boolean;
};

export type SimilarPackagesResponse = {
  results: Package[];
};
