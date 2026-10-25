/**
 * Domain types shared by the public site, admin dashboard and both data
 * backends (Supabase and the local demo store). Field names mirror the SQL
 * columns in supabase/migrations so mapping stays one-to-one.
 */

export type UUID = string;

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface OpeningHoursEntry {
  day: Weekday;
  /** "12:00". Null when closed. */
  opens: string | null;
  /** "01:00" (may be past midnight). Null when closed. */
  closes: string | null;
}

export interface Branch {
  id: UUID;
  name: string;
  slug: string;
  address: string;
  area: string | null;
  city: string;
  phone: string | null;
  email: string | null;
  /** Free-text hours shown when structured hours are not confirmed. */
  hours_note: string | null;
  opening_hours: OpeningHoursEntry[];
  latitude: number | null;
  longitude: number | null;
  directions_url: string | null;
  google_review_url: string | null;
  image_url: string | null;
  is_active: boolean;
  /** True once the business has confirmed the details. Unverified branches show a notice. */
  is_verified: boolean;
  /** Where the details came from, for whoever verifies them. Never shown publicly. */
  source_note: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ALLERGENS = [
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "peanuts",
  "soy",
  "milk",
  "tree_nuts",
  "celery",
  "mustard",
  "sesame",
  "sulphites",
  "lupin",
  "molluscs",
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const DIETARY_LABELS = ["vegetarian", "vegan", "spicy", "gluten_free", "halal"] as const;
export type DietaryLabel = (typeof DIETARY_LABELS)[number];

export interface MenuItem {
  id: UUID;
  category_id: UUID | null;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  /** AED, stored as NUMERIC(10,2); kept as a string-safe number in the app. */
  price: number;
  image_url: string | null;
  image_alt: string | null;
  gallery_urls: string[];
  ingredients: string[];
  /** Only filled once allergens have been verified by the kitchen. */
  allergens: Allergen[];
  allergens_verified: boolean;
  dietary_labels: DietaryLabel[];
  is_available: boolean;
  is_featured: boolean;
  is_archived: boolean;
  /** Sample entries are demo content and must be replaced before launch. */
  is_sample: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface BranchMenuItem {
  id: UUID;
  branch_id: UUID;
  menu_item_id: UUID;
  /** Overrides the base price at this branch. Null uses the base price. */
  price_override: number | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export const DELIVERY_PLATFORMS = ["talabat", "noon_food", "deliveroo", "careem", "other"] as const;
export type DeliveryPlatform = (typeof DELIVERY_PLATFORMS)[number];

export interface DeliveryLink {
  id: UUID;
  branch_id: UUID | null;
  platform: DeliveryPlatform;
  label: string | null;
  url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const FEEDBACK_STATUSES = ["pending", "reviewed", "published", "rejected"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const VISIT_TYPES = ["dine_in", "takeaway", "delivery"] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

/** Full record. Only ever loaded on the server for authorised staff. */
export interface CustomerFeedback {
  id: UUID;
  branch_id: UUID | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  country: string;
  visit_type: VisitType;
  rating_overall: number;
  rating_food: number | null;
  rating_service: number | null;
  rating_atmosphere: number | null;
  message: string;
  consent_to_contact: boolean;
  status: FeedbackStatus;
  internal_notes: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** The only shape of feedback that ever leaves the server for the public. */
export interface PublicReview {
  id: UUID;
  display_name: string;
  rating_overall: number;
  message: string;
  branch_name: string | null;
  published_at: string | null;
}

export const ENQUIRY_TOPICS = ["general", "events", "feedback", "careers", "press", "other"] as const;
export type EnquiryTopic = (typeof ENQUIRY_TOPICS)[number];

/** Contact-page enquiry. Private: staff only. */
export interface ContactEnquiry {
  id: UUID;
  name: string;
  email: string | null;
  phone: string | null;
  topic: EnquiryTopic;
  branch_id: UUID | null;
  message: string;
  status: "new" | "handled";
  created_at: string;
  updated_at: string;
}

export type AdminRole = "owner" | "admin" | "branch_editor";

export interface AdminUser {
  id: UUID;
  email: string;
  display_name: string | null;
  role: AdminRole;
  /** Branches a branch_editor may manage. Ignored for owner/admin. */
  branch_ids: UUID[];
  is_active: boolean;
}

export interface HeroSlide {
  id: UUID;
  image_url: string;
  image_alt: string;
  heading: string;
  subheading: string | null;
  primary_label: string | null;
  primary_href: string | null;
  secondary_label: string | null;
  secondary_href: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: UUID;
  image_url: string;
  alt: string;
  caption: string | null;
  placement: "home" | "about";
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Key/value website settings. Every key is optional; UI falls back gracefully. */
export interface SiteSettings {
  site_name: string;
  tagline: string;
  footer_blurb: string;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  google_reviews_url: string | null;
  home_about_heading: string;
  home_about_body: string;
  home_about_image: string | null;
  about_intro: string;
  about_story: string;
  about_philosophy: string;
  about_atmosphere: string;
  /** Shown site-wide while content is still sample data. */
  show_sample_notice: boolean;
}

export interface DashboardStats {
  activeMenuItems: number;
  activeBranches: number;
  pendingFeedback: number;
  newEnquiries: number;
  recentlyUpdated: Pick<MenuItem, "id" | "name" | "updated_at">[];
}

/** Menu item resolved for a branch (price/availability overrides applied). */
export interface ResolvedMenuItem extends MenuItem {
  category: Pick<MenuCategory, "id" | "name" | "slug"> | null;
  effective_price: number;
  effective_available: boolean;
}

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[] | undefined> };
