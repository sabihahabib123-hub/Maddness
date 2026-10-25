/**
 * Static, non-sensitive site configuration. Business facts (addresses, phone
 * numbers, menu, links) live in the database and are edited in /admin, not here.
 */
export const siteConfig = {
  name: "MADNESS",
  /** Used for canonical URLs, sitemap and Open Graph. Set NEXT_PUBLIC_SITE_URL in production. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_AE",
  currency: "AED",
  /** Official account supplied in the project brief. */
  instagramUrl: "https://www.instagram.com/madness.uae/",
  defaultOgImage: "/images/interior-joker-mural.webp",
} as const;

export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About us" },
  { href: "/locations", label: "Locations" },
  { href: "/reviews", label: "Reviews" },
] as const;

export const deliveryPlatformMeta: Record<string, { name: string; color: string; text: string }> = {
  talabat: { name: "talabat", color: "#FF5A00", text: "#ffffff" },
  noon_food: { name: "noon Food", color: "#FEEE00", text: "#101010" },
  deliveroo: { name: "Deliveroo", color: "#00CCBC", text: "#101010" },
  careem: { name: "Careem", color: "#1BA650", text: "#ffffff" },
  other: { name: "Order online", color: "#F7F4EE", text: "#101010" },
};

export const COUNTRIES = [
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman", "Egypt", "Jordan",
  "Lebanon", "India", "Pakistan", "Philippines", "United Kingdom", "United States", "France", "Germany",
  "Italy", "Spain", "Russia", "Poland", "China", "Other",
] as const;
