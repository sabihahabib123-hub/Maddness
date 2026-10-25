import { z } from "zod";
import { ALLERGENS, DELIVERY_PLATFORMS, DIETARY_LABELS, FEEDBACK_STATUSES } from "@/lib/types";

/* ---------- FormData helpers ---------- */

export const fd = {
  str: (f: FormData, k: string) => {
    const v = f.get(k);
    return typeof v === "string" ? v.trim() : "";
  },
  /** Checkboxes and Arc switches submit "on" when checked. */
  bool: (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true",
  /** One entry per line or comma. */
  list: (f: FormData, k: string) =>
    fd
      .str(f, k)
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean),
  all: (f: FormData, k: string) => f.getAll(k).filter((v): v is string => typeof v === "string"),
};

/* ---------- Shared pieces ---------- */

const slug = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters`)
    .transform((v) => (v ? v : null));

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^https:\/\/[^\s]+$/i.test(v) && URL.canParse(v), "Use a full https:// link");

const nullableHttpsUrl = z
  .string()
  .trim()
  .max(500)
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || (/^https:\/\/[^\s]+$/i.test(v) && URL.canParse(v)), "Use a full https:// link");

/** Site-relative path ("/images/x.webp", "/menu") or https URL. */
const imageRef = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^\/[a-z0-9/_.-]+$/i.test(v) || (/^https:\/\//i.test(v) && URL.canParse(v)), "Use a path like /images/photo.webp or an https:// link")
  .transform((v) => (v ? v : null));

const linkHref = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^\/[^\s]*$/.test(v) || (/^https:\/\//i.test(v) && URL.canParse(v)), "Use a page path like /menu or an https:// link")
  .transform((v) => (v ? v : null));

const order = z.coerce.number().int().min(0).max(9999);
const price = z.coerce.number({ error: "Enter a price" }).min(0, "Price can't be negative").max(99999).multipleOf(0.01, "Use at most 2 decimals");

/* ---------- Entities ---------- */

export const menuItemSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(120),
  slug,
  category_id: z.string().uuid("Choose a category"),
  short_description: nullableText(200),
  description: nullableText(2000),
  price,
  image_url: imageRef,
  image_alt: nullableText(200),
  ingredients: z.array(z.string().max(80)).max(40),
  allergens: z.array(z.enum(ALLERGENS)),
  allergens_verified: z.boolean(),
  dietary_labels: z.array(z.enum(DIETARY_LABELS)),
  is_available: z.boolean(),
  is_featured: z.boolean(),
  is_sample: z.boolean(),
  display_order: order,
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(80),
  slug,
  description: nullableText(300),
  display_order: order,
  is_active: z.boolean(),
});

const time = z
  .string()
  .trim()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), "Use 24-hour time, e.g. 12:00");

export const branchSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(120),
  slug,
  address: z.string().trim().min(3, "Enter the address").max(300),
  area: nullableText(120),
  city: z.string().trim().min(2).max(80),
  phone: nullableText(40).refine((v) => v === null || /^[+()\d\s-]{6,40}$/.test(v), "Enter a valid phone number"),
  email: nullableText(254).refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email"),
  hours_note: nullableText(300),
  opening_hours: z.array(z.object({ day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]), opens: time, closes: time })),
  latitude: z
    .string()
    .trim()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v >= -90 && v <= 90), "Latitude must be between -90 and 90"),
  longitude: z
    .string()
    .trim()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v >= -180 && v <= 180), "Longitude must be between -180 and 180"),
  directions_url: nullableHttpsUrl,
  google_review_url: nullableHttpsUrl,
  image_url: imageRef,
  is_active: z.boolean(),
  is_verified: z.boolean(),
  source_note: nullableText(500),
  display_order: order,
});

export const deliveryLinkSchema = z.object({
  platform: z.enum(DELIVERY_PLATFORMS),
  branch_id: z
    .string()
    .transform((v) => (v && v !== "all" ? v : null))
    .refine((v) => v === null || z.uuid().safeParse(v).success, "Choose a branch"),
  label: nullableText(60),
  url: httpsUrl,
  is_active: z.boolean(),
  display_order: order,
});

export const feedbackModerationSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES).optional(),
  internal_notes: nullableText(2000).optional(),
});

export const heroSlideSchema = z.object({
  image_url: imageRef.refine((v) => v !== null, "Add an image"),
  image_alt: z.string().trim().min(1, "Describe the image").max(200),
  heading: z.string().trim().min(1, "Enter a heading").max(80),
  subheading: nullableText(200),
  primary_label: nullableText(40),
  primary_href: linkHref,
  secondary_label: nullableText(40),
  secondary_href: linkHref,
  display_order: order,
  is_active: z.boolean(),
});

export const galleryImageSchema = z.object({
  image_url: imageRef.refine((v) => v !== null, "Add an image"),
  alt: z.string().trim().min(1, "Describe the image").max(200),
  caption: nullableText(200),
  placement: z.enum(["home", "about"]),
  display_order: order,
  is_active: z.boolean(),
});

export const homeContentSchema = z.object({
  home_about_heading: z.string().trim().min(1).max(120),
  home_about_body: z.string().trim().min(1).max(1200),
  home_about_image: imageRef,
  about_intro: z.string().trim().min(1).max(600),
  about_story: z.string().trim().min(1).max(3000),
  about_philosophy: z.string().trim().min(1).max(3000),
  about_atmosphere: z.string().trim().min(1).max(3000),
});

export const settingsSchema = z.object({
  site_name: z.string().trim().min(1).max(60),
  tagline: z.string().trim().max(120),
  footer_blurb: z.string().trim().max(300),
  instagram_url: nullableHttpsUrl,
  tiktok_url: nullableHttpsUrl,
  facebook_url: nullableHttpsUrl,
  google_reviews_url: nullableHttpsUrl,
  contact_email: nullableText(254).refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email"),
  contact_phone: nullableText(40).refine((v) => v === null || /^[+()\d\s-]{6,40}$/.test(v), "Enter a valid phone number"),
  show_sample_notice: z.boolean(),
});
