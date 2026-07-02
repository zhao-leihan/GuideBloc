import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatCrypto(amount: number, token: string = "USDT"): string {
  return `${amount.toFixed(2)} ${token}`;
}

export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    adventure: "MountainIcon",
    cultural: "ColumnsIcon",
    food: "MixIcon",
    nature: "LeafIcon",
    city: "DesktopIcon",
    water: "WavesIcon",
    historical: "FileTextIcon",
    nightlife: "MoonIcon",
    photography: "CameraIcon",
    wellness: "PersonIcon",
  };
  return icons[category.toLowerCase()] || "GlobeIcon";
}

export function getCountryFlag(country: string): string {
  const codes: Record<string, string> = {
    indonesia: "ID",
    thailand: "TH",
    japan: "JP",
    france: "FR",
    italy: "IT",
    spain: "ES",
    usa: "US",
    mexico: "MX",
    brazil: "BR",
    turkey: "TR",
    egypt: "EG",
    morocco: "MA",
    peru: "PE",
    greece: "GR",
    australia: "AU",
    "south africa": "ZA",
    india: "IN",
    vietnam: "VN",
    "south korea": "KR",
    portugal: "PT",
  };
  return codes[country.toLowerCase()] || "GL";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    AWAITING_PAYMENT: "bg-orange-500/20 text-orange-400",
    CONFIRMED: "bg-blue-500/20 text-blue-400",
    COMPLETED: "bg-green-500/20 text-green-400",
    CANCELLED: "bg-red-500/20 text-red-400",
    DISPUTED: "bg-purple-500/20 text-purple-400",
  };
  return colors[status] || "bg-gray-500/20 text-gray-400";
}
