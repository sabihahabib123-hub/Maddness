import "server-only";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type {
  Branch,
  BranchMenuItem,
  ContactEnquiry,
  CustomerFeedback,
  DeliveryLink,
  GalleryImage,
  HeroSlide,
  MenuCategory,
  MenuItem,
  PublicReview,
  SiteSettings,
} from "@/lib/types";
import { createServiceClient } from "@/lib/supabase/server";
import { seedSettings } from "./demo-seed";
import { ConflictError, NotFoundError, type Repository } from "./repository";

const FEEDBACK_COLUMNS =
  "id, branch_id, display_name, email, phone, country, visit_type, rating_overall, rating_food, rating_service, rating_atmosphere, message, consent_to_contact, status, internal_notes, published_at, created_at, updated_at";

function check(error: PostgrestError | null): void {
  if (!error) return;
  if (error.code === "23505") throw new ConflictError("A record with that name or slug already exists");
  if (error.code === "23503") throw new ConflictError("This record is still referenced by other data");
  if (error.code === "PGRST116") throw new NotFoundError("Record not found");
  // Log the code only; messages can include submitted values.
  console.error(`[supabase] ${error.code}`);
  throw new Error("Database request failed");
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const toMenuItem = (r: MenuItem): MenuItem => ({ ...r, price: Number(r.price) });
const toBranch = (r: Branch): Branch => ({ ...r, latitude: num(r.latitude), longitude: num(r.longitude) });

async function save(db: SupabaseClient, table: string, id: string | null, input: object): Promise<string> {
  if (id) {
    const { error } = await db.from(table).update(input).eq("id", id).select("id").single();
    check(error);
    return id;
  }
  const { data, error } = await db.from(table).insert(input).select("id").single();
  check(error);
  return (data as { id: string }).id;
}

async function remove(db: SupabaseClient, table: string, id: string) {
  const { error } = await db.from(table).delete().eq("id", id);
  check(error);
}

/** `db` is either the anonymous public client or the signed-in session client. */
export function createSupabaseRepository(db: SupabaseClient): Repository {
  return {
    async getSettings() {
      const { data, error } = await db.from("site_settings").select("key, value");
      check(error);
      const stored = Object.fromEntries((data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]));
      return { ...seedSettings, ...stored } as SiteSettings;
    },
    async listHeroSlides(opts) {
      let q = db.from("hero_slides").select("*").order("display_order");
      if (!opts?.includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      check(error);
      return (data ?? []) as HeroSlide[];
    },
    async listGallery(placement, opts) {
      let q = db.from("gallery_images").select("*").order("display_order");
      if (placement) q = q.eq("placement", placement);
      if (!opts?.includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      check(error);
      return (data ?? []) as GalleryImage[];
    },
    async listCategories(opts) {
      let q = db.from("menu_categories").select("*").order("display_order");
      if (!opts?.includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      check(error);
      return (data ?? []) as MenuCategory[];
    },
    async listMenuItems(opts) {
      let q = db.from("menu_items").select("*").order("display_order");
      if (!opts?.includeArchived) q = q.eq("is_archived", false);
      const { data, error } = await q;
      check(error);
      return ((data ?? []) as MenuItem[]).map(toMenuItem);
    },
    async getMenuItemBySlug(slug) {
      const { data, error } = await db.from("menu_items").select("*").eq("slug", slug).eq("is_archived", false).maybeSingle();
      check(error);
      return data ? toMenuItem(data as MenuItem) : null;
    },
    async getMenuItemById(id) {
      const { data, error } = await db.from("menu_items").select("*").eq("id", id).maybeSingle();
      check(error);
      return data ? toMenuItem(data as MenuItem) : null;
    },
    async listBranchMenuItems(opts) {
      let q = db.from("branch_menu_items").select("*");
      if (opts?.branchId) q = q.eq("branch_id", opts.branchId);
      if (opts?.menuItemId) q = q.eq("menu_item_id", opts.menuItemId);
      const { data, error } = await q;
      check(error);
      return ((data ?? []) as BranchMenuItem[]).map((r) => ({ ...r, price_override: num(r.price_override) }));
    },
    async listBranches(opts) {
      let q = db.from("branches").select("*").order("display_order");
      if (!opts?.includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      check(error);
      return ((data ?? []) as Branch[]).map(toBranch);
    },
    async getBranchBySlug(slug) {
      const { data, error } = await db.from("branches").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
      check(error);
      return data ? toBranch(data as Branch) : null;
    },
    async getBranchById(id) {
      const { data, error } = await db.from("branches").select("*").eq("id", id).maybeSingle();
      check(error);
      return data ? toBranch(data as Branch) : null;
    },
    async listDeliveryLinks(opts) {
      let q = db.from("delivery_links").select("*").order("display_order");
      if (!opts?.includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      check(error);
      return (data ?? []) as DeliveryLink[];
    },
    async listPublishedReviews(limit = 12) {
      const { data, error } = await db.rpc("get_published_reviews", { max_rows: limit });
      check(error);
      return (data ?? []) as PublicReview[];
    },

    async insertFeedback(input) {
      // Service role: anon has no insert policy on customer_feedback by design.
      const { error } = await createServiceClient().from("customer_feedback").insert({ ...input, status: "pending" });
      check(error);
    },
    async countRecentFeedbackByHash(hash, sinceIso) {
      const { count, error } = await createServiceClient()
        .from("customer_feedback")
        .select("id", { count: "exact", head: true })
        .eq("dedupe_hash", hash)
        .gte("created_at", sinceIso);
      check(error);
      return count ?? 0;
    },

    async insertEnquiry(input) {
      const { error } = await createServiceClient().from("contact_enquiries").insert({ ...input, status: "new" });
      check(error);
    },
    async countRecentEnquiriesByHash(hash, sinceIso) {
      const { count, error } = await createServiceClient()
        .from("contact_enquiries")
        .select("id", { count: "exact", head: true })
        .eq("dedupe_hash", hash)
        .gte("created_at", sinceIso);
      check(error);
      return count ?? 0;
    },

    async getDashboardStats() {
      const [items, branches, pending, recent, enquiries] = await Promise.all([
        db.from("menu_items").select("id", { count: "exact", head: true }).eq("is_archived", false).eq("is_available", true),
        db.from("branches").select("id", { count: "exact", head: true }).eq("is_active", true),
        db.from("customer_feedback").select("id", { count: "exact", head: true }).eq("status", "pending"),
        db.from("menu_items").select("id, name, updated_at").order("updated_at", { ascending: false }).limit(5),
        db.from("contact_enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
      ]);
      [items, branches, pending, recent, enquiries].forEach((r) => check(r.error));
      return {
        activeMenuItems: items.count ?? 0,
        activeBranches: branches.count ?? 0,
        pendingFeedback: pending.count ?? 0,
        newEnquiries: enquiries.count ?? 0,
        recentlyUpdated: (recent.data ?? []) as { id: string; name: string; updated_at: string }[],
      };
    },
    async listFeedback(filters) {
      let q = db.from("customer_feedback").select(FEEDBACK_COLUMNS).order("created_at", { ascending: false }).limit(500);
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.branchId) q = q.eq("branch_id", filters.branchId);
      if (filters.branchScope) q = q.in("branch_id", filters.branchScope.length ? filters.branchScope : ["00000000-0000-0000-0000-000000000000"]);
      const search = filters.search?.trim().replace(/[%,()]/g, " ");
      if (search) q = q.or(`display_name.ilike.%${search}%,message.ilike.%${search}%`);
      const { data, error } = await q;
      check(error);
      return (data ?? []) as CustomerFeedback[];
    },
    async getFeedback(id) {
      const { data, error } = await db.from("customer_feedback").select(FEEDBACK_COLUMNS).eq("id", id).maybeSingle();
      check(error);
      return (data as CustomerFeedback | null) ?? null;
    },
    async updateFeedback(id, patch) {
      const { error } = await db.from("customer_feedback").update(patch).eq("id", id).select("id").single();
      check(error);
    },
    async deleteFeedback(id) {
      await remove(db, "customer_feedback", id);
    },
    async listEnquiries({ branchScope }) {
      let q = db
        .from("contact_enquiries")
        .select("id, name, email, phone, topic, branch_id, message, status, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(300);
      if (branchScope) q = q.in("branch_id", branchScope.length ? branchScope : ["00000000-0000-0000-0000-000000000000"]);
      const { data, error } = await q;
      check(error);
      return (data ?? []) as ContactEnquiry[];
    },
    async updateEnquiryStatus(id, status) {
      const { error } = await db.from("contact_enquiries").update({ status }).eq("id", id).select("id").single();
      check(error);
    },

    saveMenuItem: (id, input) => save(db, "menu_items", id, input),
    deleteMenuItem: (id) => remove(db, "menu_items", id),
    async setBranchOverrides(menuItemId, overrides) {
      for (const o of overrides) {
        if (o.price_override === null && o.is_available) {
          const { error } = await db.from("branch_menu_items").delete().eq("menu_item_id", menuItemId).eq("branch_id", o.branch_id);
          check(error);
        } else {
          const { error } = await db
            .from("branch_menu_items")
            .upsert({ ...o, menu_item_id: menuItemId }, { onConflict: "branch_id,menu_item_id" });
          check(error);
        }
      }
    },

    saveCategory: (id, input) => save(db, "menu_categories", id, input),
    async deleteCategory(id) {
      await remove(db, "menu_categories", id);
    },
    async countItemsInCategory(id) {
      const { count, error } = await db.from("menu_items").select("id", { count: "exact", head: true }).eq("category_id", id);
      check(error);
      return count ?? 0;
    },

    saveBranch: (id, input) => save(db, "branches", id, input),

    saveDeliveryLink: (id, input) => save(db, "delivery_links", id, input),
    deleteDeliveryLink: (id) => remove(db, "delivery_links", id),

    saveHeroSlide: (id, input) => save(db, "hero_slides", id, input),
    deleteHeroSlide: (id) => remove(db, "hero_slides", id),
    saveGalleryImage: (id, input) => save(db, "gallery_images", id, input),
    deleteGalleryImage: (id) => remove(db, "gallery_images", id),

    async updateSettings(patch) {
      const rows = Object.entries(patch).map(([key, value]) => ({ key, value }));
      if (!rows.length) return;
      const { error } = await db.from("site_settings").upsert(rows, { onConflict: "key" });
      check(error);
    },
  };
}
