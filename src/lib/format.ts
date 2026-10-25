import type { Branch, OpeningHoursEntry, Weekday } from "@/lib/types";

const aed = new Intl.NumberFormat("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** "AED 68" or "AED 12.50". Prices are always AED. */
export function formatPrice(value: number): string {
  return `AED ${aed.format(value)}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dubai" }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai",
  }).format(new Date(iso));
}

export const WEEKDAYS: { key: Weekday; label: string; schema: string }[] = [
  { key: "mon", label: "Monday", schema: "Monday" },
  { key: "tue", label: "Tuesday", schema: "Tuesday" },
  { key: "wed", label: "Wednesday", schema: "Wednesday" },
  { key: "thu", label: "Thursday", schema: "Thursday" },
  { key: "fri", label: "Friday", schema: "Friday" },
  { key: "sat", label: "Saturday", schema: "Saturday" },
  { key: "sun", label: "Sunday", schema: "Sunday" },
];

function to12h(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}

export function formatHoursRange(e: OpeningHoursEntry): string {
  if (!e.opens || !e.closes) return "Closed";
  return `${to12h(e.opens)} to ${to12h(e.closes)}`;
}

/**
 * Collapses identical days: "Daily, 12 PM to 1 AM" or one line per group.
 * Returns [] when structured hours are not set.
 */
export function summariseHours(hours: OpeningHoursEntry[]): { days: string; hours: string }[] {
  if (!hours.length) return [];
  const ordered = WEEKDAYS.map((d) => hours.find((h) => h.day === d.key) ?? { day: d.key, opens: null, closes: null });
  const groups: { from: number; to: number; text: string }[] = [];
  ordered.forEach((h, i) => {
    const text = formatHoursRange(h);
    const last = groups.at(-1);
    if (last && last.text === text) last.to = i;
    else groups.push({ from: i, to: i, text });
  });
  if (groups.length === 1) return [{ days: "Daily", hours: groups[0].text }];
  return groups.map((g) => ({
    days: g.from === g.to ? WEEKDAYS[g.from].label.slice(0, 3) : `${WEEKDAYS[g.from].label.slice(0, 3)} to ${WEEKDAYS[g.to].label.slice(0, 3)}`,
    hours: g.text,
  }));
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function directionsHref(branch: Pick<Branch, "directions_url" | "latitude" | "longitude" | "address">): string {
  if (branch.directions_url) return branch.directions_url;
  if (branch.latitude !== null && branch.longitude !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const labelise = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
