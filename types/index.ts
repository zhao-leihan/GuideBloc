export type Role = "TOURIST" | "GUIDE" | "ADMIN";
export type BookingStatus = "PENDING" | "AWAITING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "DISPUTED";
export type CryptoToken = "USDT" | "USDC";
export type MessageType = "TEXT" | "IMAGE" | "FILE" | "LOCATION" | "BOOKING_CARD" | "SYSTEM";
export type BoostType = "FEATURED_HOME" | "TOP_SEARCH" | "CATEGORY_BANNER";

export interface GigWithGuide {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  country: string;
  lat: number | null;
  lng: number | null;
  durationHours: number;
  maxGroupSize: number;
  priceUSD: number;
  images: string[];
  tags: string[];
  languages: string[];
  included: string[];
  excluded: string[];
  meetingPoint: string | null;
  isActive: boolean;
  createdAt: Date;
  guide: {
    id: string;
    name: string;
    avatar: string | null;
    country: string | null;
  };
  avgRating?: number;
  reviewCount?: number;
}

export interface BookingWithDetails {
  id: string;
  gigId: string;
  touristId: string;
  bookingDate: Date;
  groupSize: number;
  totalPriceUSD: number;
  totalPriceCrypto: number;
  cryptoToken: CryptoToken;
  status: BookingStatus;
  txHash: string | null;
  paymentNetwork: string | null;
  specialRequests: string | null;
  createdAt: Date;
  gig: GigWithGuide;
  tourist: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface ConversationWithDetails {
  id: string;
  gigId: string | null;
  bookingId: string | null;
  touristId: string;
  guideId: string;
  isArchived: boolean;
  lastMessageAt: Date | null;
  createdAt: Date;
  tourist: {
    id: string;
    name: string;
    avatar: string | null;
  };
  guide: {
    id: string;
    name: string;
    avatar: string | null;
  };
  gig?: {
    id: string;
    title: string;
    images: string[];
  } | null;
  lastMessage?: {
    content: string;
    type: MessageType;
    createdAt: Date;
  } | null;
  unreadCount?: number;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar: string | null;
  walletAddress: string | null;
}

export interface PaymentParams {
  bookingId: string;
  amountUSD: number;
  token: "USDT" | "USDC";
  network: "polygon" | "base";
  guideWalletAddress: string;
}

export interface GigFilters {
  search?: string;
  country?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  language?: string;
  sortBy?: "popular" | "price_asc" | "price_desc" | "rating" | "newest";
  page?: number;
  limit?: number;
}
