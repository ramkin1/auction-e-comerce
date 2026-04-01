export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "artwork", label: "Artwork" },
  { value: "antique", label: "Antiques" },
  { value: "jewelry", label: "Jewelry" },
  { value: "furniture", label: "Furniture" },
  { value: "collectible", label: "Collectibles" },
  { value: "other", label: "Other" },
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  artwork: "Artwork",
  antique: "Antiques",
  jewelry: "Jewelry",
  furniture: "Furniture",
  collectible: "Collectibles",
  other: "Other",
};

export const DOC_TYPE_LABELS: Record<string, string> = {
  certificate_of_authenticity: "Certificate of Authenticity",
  appraisal: "Appraisal Report",
  provenance: "Provenance Record",
  other: "Other Document",
};

export function formatKES(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `KES ${num.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatCountdown(endTime: number): {
  display: string;
  isUrgent: boolean;
  isEnded: boolean;
} {
  const now = Date.now();
  const diff = endTime - now;
  if (diff <= 0) return { display: "Ended", isUrgent: false, isEnded: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const isUrgent = diff < 3600000;
  if (days > 0) return { display: `${days}d ${hours}h`, isUrgent, isEnded: false };
  if (hours > 0) return { display: `${hours}h ${minutes}m`, isUrgent, isEnded: false };
  return { display: `${minutes}m ${seconds}s`, isUrgent, isEnded: false };
}

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
