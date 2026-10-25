import type {
  Branch,
  ContactEnquiry,
  BranchMenuItem,
  CustomerFeedback,
  DashboardStats,
  DeliveryLink,
  FeedbackStatus,
  GalleryImage,
  HeroSlide,
  MenuCategory,
  MenuItem,
  PublicReview,
  SiteSettings,
} from "@/lib/types";

type Editable<T> = Omit<T, "id" | "created_at" | "updated_at">;

export type MenuItemInput = Editable<MenuItem>;
export type CategoryInput = Editable<MenuCategory>;
export type BranchInput = Editable<Branch>;
export type DeliveryLinkInput = Editable<DeliveryLink>;
export type HeroSlideInput = Editable<HeroSlide>;
export type GalleryImageInput = Editable<GalleryImage>;
export type BranchOverrideInput = Pick<BranchMenuItem, "branch_id" | "price_override" | "is_available">;

export type NewFeedback = Omit<CustomerFeedback, "id" | "status" | "internal_notes" | "published_at" | "created_at" | "updated_at"> & {
  dedupe_hash: string;
};

export type NewEnquiry = Omit<ContactEnquiry, "id" | "status" | "created_at" | "updated_at"> & { dedupe_hash: string };

export interface FeedbackFilters {
  status?: FeedbackStatus;
  branchId?: string;
  search?: string;
  /** Limit to these branches (branch editors). Undefined means all. */
  branchScope?: string[];
}

/**
 * Every read and write the app performs. The Supabase implementation relies on
 * RLS as the final gate; server actions also check permissions before calling.
 */
export interface Repository {
  // Public reads
  getSettings(): Promise<SiteSettings>;
  listHeroSlides(opts?: { includeInactive?: boolean }): Promise<HeroSlide[]>;
  listGallery(placement?: GalleryImage["placement"], opts?: { includeInactive?: boolean }): Promise<GalleryImage[]>;
  listCategories(opts?: { includeInactive?: boolean }): Promise<MenuCategory[]>;
  listMenuItems(opts?: { includeArchived?: boolean }): Promise<MenuItem[]>;
  getMenuItemBySlug(slug: string): Promise<MenuItem | null>;
  getMenuItemById(id: string): Promise<MenuItem | null>;
  listBranchMenuItems(opts?: { branchId?: string; menuItemId?: string }): Promise<BranchMenuItem[]>;
  listBranches(opts?: { includeInactive?: boolean }): Promise<Branch[]>;
  getBranchBySlug(slug: string): Promise<Branch | null>;
  getBranchById(id: string): Promise<Branch | null>;
  listDeliveryLinks(opts?: { includeInactive?: boolean }): Promise<DeliveryLink[]>;
  listPublishedReviews(limit?: number): Promise<PublicReview[]>;

  // Feedback intake (server only)
  insertFeedback(input: NewFeedback): Promise<void>;
  countRecentFeedbackByHash(hash: string, sinceIso: string): Promise<number>;
  insertEnquiry(input: NewEnquiry): Promise<void>;
  countRecentEnquiriesByHash(hash: string, sinceIso: string): Promise<number>;

  // Admin
  getDashboardStats(): Promise<DashboardStats>;
  listFeedback(filters: FeedbackFilters): Promise<CustomerFeedback[]>;
  getFeedback(id: string): Promise<CustomerFeedback | null>;
  updateFeedback(id: string, patch: { status?: FeedbackStatus; internal_notes?: string | null }): Promise<void>;
  deleteFeedback(id: string): Promise<void>;
  listEnquiries(opts: { branchScope?: string[] }): Promise<ContactEnquiry[]>;
  updateEnquiryStatus(id: string, status: ContactEnquiry["status"]): Promise<void>;

  saveMenuItem(id: string | null, input: MenuItemInput): Promise<string>;
  deleteMenuItem(id: string): Promise<void>;
  setBranchOverrides(menuItemId: string, overrides: BranchOverrideInput[]): Promise<void>;

  saveCategory(id: string | null, input: CategoryInput): Promise<string>;
  deleteCategory(id: string): Promise<void>;
  countItemsInCategory(id: string): Promise<number>;

  saveBranch(id: string | null, input: BranchInput): Promise<string>;

  saveDeliveryLink(id: string | null, input: DeliveryLinkInput): Promise<string>;
  deleteDeliveryLink(id: string): Promise<void>;

  saveHeroSlide(id: string | null, input: HeroSlideInput): Promise<string>;
  deleteHeroSlide(id: string): Promise<void>;
  saveGalleryImage(id: string | null, input: GalleryImageInput): Promise<string>;
  deleteGalleryImage(id: string): Promise<void>;

  updateSettings(patch: Partial<SiteSettings>): Promise<void>;
}

export class NotFoundError extends Error {}
export class ConflictError extends Error {}
