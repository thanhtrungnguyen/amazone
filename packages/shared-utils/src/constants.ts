export const APP_NAME = "Amazone";
export const APP_DESCRIPTION = "Your one-stop e-commerce platform";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const PRODUCT_IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  card: { width: 300, height: 300 },
  detail: { width: 600, height: 600 },
  full: { width: 1200, height: 1200 },
} as const;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SUPPORTED_LOCALES = ["en", "vi"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en";

export const RATING_MIN = 1;
export const RATING_MAX = 5;
