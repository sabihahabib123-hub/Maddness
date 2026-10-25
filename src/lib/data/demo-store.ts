import "server-only";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
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
  SiteSettings,
} from "@/lib/types";
import * as seed from "./demo-seed";
import { ConflictError, NotFoundError, type Repository } from "./repository";

/**
 * DEMO MODE ONLY. A tiny JSON-file database used when Supabase is not
 * configured, so the whole site and admin can be exercised locally.
 * Data lives in .data/demo-db.json (git-ignored). Delete that file to reset.
 * On read-only hosts (e.g. Vercel) writes stay in memory for the instance.
 */
interface DemoDb {
  branches: Branch[];
  menu_categories: MenuCategory[];
  menu_items: MenuItem[];
  branch_menu_items: BranchMenuItem[];
  delivery_links: DeliveryLink[];
  customer_feedback: (CustomerFeedback & { dedupe_hash: string })[];
  contact_enquiries: (ContactEnquiry & { dedupe_hash: string })[];
  hero_slides: HeroSlide[];
  gallery_images: GalleryImage[];
  site_settings: SiteSettings;
}

const DB_FILE = path.join(process.cwd(), ".data", "demo-db.json");

function freshDb(): DemoDb {
  return structuredClone({
    branches: seed.seedBranches,
    menu_categories: seed.seedCategories,
    menu_items: seed.seedMenuItems,
    branch_menu_items: seed.seedBranchMenuItems,
    delivery_links: seed.seedDeliveryLinks,
    customer_feedback: [],
    contact_enquiries: [],
    hero_slides: seed.seedHeroSlides,
    gallery_images: seed.seedGallery,
    site_settings: seed.seedSettings,
  });
}

let memory: DemoDb | null = null;

/**
 * Read synchronously on purpose: in development React records awaited I/O
 * values for DevTools, and the raw file contains private feedback.
 */
async function load(): Promise<DemoDb> {
  try {
    const raw = readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<DemoDb>;
    const base = freshDb();
    memory = { ...base, ...parsed, site_settings: { ...base.site_settings, ...parsed.site_settings } };
  } catch {
    memory ??= freshDb();
  }
  return memory;
}

async function persist(db: DemoDb) {
  memory = db;
  try {
    await mkdir(path.dirname(DB_FILE), { recursive: true });
    await writeFile(DB_FILE, JSON.stringify(db, null, 2));
  } catch {
    // Read-only filesystem: keep the change in memory only.
  }
}

const now = () => new Date().toISOString();
const byOrder = <T extends { display_order: number }>(a: T, b: T) => a.display_order - b.display_order;

function upsert<T extends { id: string; created_at: string; updated_at: string }>(
  list: T[],
  id: string | null,
  input: Omit<T, "id" | "created_at" | "updated_at">,
): string {
  if (id) {
    const i = list.findIndex((r) => r.id === id);
    if (i === -1) throw new NotFoundError("Record not found");
    list[i] = { ...list[i], ...input, updated_at: now() };
    return id;
  }
  const newId = randomUUID();
  list.push({ ...(input as T), id: newId, created_at: now(), updated_at: now() });
  return newId;
}

function assertUnique<T extends { id: string }>(list: T[], id: string | null, key: keyof T, value: unknown, label: string) {
  if (list.some((r) => r.id !== id && r[key] === value)) throw new ConflictError(`${label} is already in use`);
}

export const demoRepository: Repository = {
  async getSettings() {
    return (await load()).site_settings;
  },
  async listHeroSlides(opts) {
    const db = await load();
    return db.hero_slides.filter((s) => opts?.includeInactive || s.is_active).sort(byOrder);
  },
  async listGallery(placement, opts) {
    const db = await load();
    return db.gallery_images
      .filter((g) => (!placement || g.placement === placement) && (opts?.includeInactive || g.is_active))
      .sort(byOrder);
  },
  async listCategories(opts) {
    const db = await load();
    return db.menu_categories.filter((c) => opts?.includeInactive || c.is_active).sort(byOrder);
  },
  async listMenuItems(opts) {
    const db = await load();
    return db.menu_items.filter((m) => opts?.includeArchived || !m.is_archived).sort(byOrder);
  },
  async getMenuItemBySlug(slug) {
    return (await load()).menu_items.find((m) => m.slug === slug && !m.is_archived) ?? null;
  },
  async getMenuItemById(id) {
    return (await load()).menu_items.find((m) => m.id === id) ?? null;
  },
  async listBranchMenuItems(opts) {
    const db = await load();
    return db.branch_menu_items.filter(
      (r) => (!opts?.branchId || r.branch_id === opts.branchId) && (!opts?.menuItemId || r.menu_item_id === opts.menuItemId),
    );
  },
  async listBranches(opts) {
    const db = await load();
    return db.branches.filter((b) => opts?.includeInactive || b.is_active).sort(byOrder);
  },
  async getBranchBySlug(slug) {
    return (await load()).branches.find((b) => b.slug === slug && b.is_active) ?? null;
  },
  async getBranchById(id) {
    return (await load()).branches.find((b) => b.id === id) ?? null;
  },
  async listDeliveryLinks(opts) {
    const db = await load();
    return db.delivery_links.filter((d) => opts?.includeInactive || d.is_active).sort(byOrder);
  },
  async listPublishedReviews(limit = 12) {
    const db = await load();
    return db.customer_feedback
      .filter((f) => f.status === "published")
      .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
      .slice(0, limit)
      .map((f) => ({
        id: f.id,
        display_name: f.display_name,
        rating_overall: f.rating_overall,
        message: f.message,
        branch_name: db.branches.find((b) => b.id === f.branch_id)?.name ?? null,
        published_at: f.published_at,
      }));
  },

  async insertFeedback(input) {
    const db = await load();
    db.customer_feedback.push({
      ...input,
      id: randomUUID(),
      status: "pending",
      internal_notes: null,
      published_at: null,
      created_at: now(),
      updated_at: now(),
    });
    await persist(db);
  },
  async countRecentFeedbackByHash(hash, sinceIso) {
    const db = await load();
    return db.customer_feedback.filter((f) => f.dedupe_hash === hash && f.created_at >= sinceIso).length;
  },

  async insertEnquiry(input) {
    const db = await load();
    db.contact_enquiries.push({ ...input, id: randomUUID(), status: "new", created_at: now(), updated_at: now() });
    await persist(db);
  },
  async countRecentEnquiriesByHash(hash, sinceIso) {
    const db = await load();
    return db.contact_enquiries.filter((f) => f.dedupe_hash === hash && f.created_at >= sinceIso).length;
  },

  async getDashboardStats() {
    const db = await load();
    return {
      activeMenuItems: db.menu_items.filter((m) => !m.is_archived && m.is_available).length,
      activeBranches: db.branches.filter((b) => b.is_active).length,
      pendingFeedback: db.customer_feedback.filter((f) => f.status === "pending").length,
      newEnquiries: db.contact_enquiries.filter((e) => e.status === "new").length,
      recentlyUpdated: [...db.menu_items]
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, 5)
        .map(({ id, name, updated_at }) => ({ id, name, updated_at })),
    };
  },
  async listFeedback(filters) {
    const db = await load();
    const q = filters.search?.toLowerCase().trim();
    return db.customer_feedback
      .filter((f) => !filters.status || f.status === filters.status)
      .filter((f) => !filters.branchId || f.branch_id === filters.branchId)
      .filter((f) => !filters.branchScope || (f.branch_id !== null && filters.branchScope.includes(f.branch_id)))
      .filter((f) => !q || f.display_name.toLowerCase().includes(q) || f.message.toLowerCase().includes(q))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((f) => {
        const { dedupe_hash, ...rest } = f;
        void dedupe_hash;
        return rest;
      });
  },
  async getFeedback(id) {
    const f = (await load()).customer_feedback.find((r) => r.id === id);
    if (!f) return null;
    const { dedupe_hash, ...rest } = f;
    void dedupe_hash;
    return rest;
  },
  async updateFeedback(id, patch) {
    const db = await load();
    const f = db.customer_feedback.find((r) => r.id === id);
    if (!f) throw new NotFoundError("Feedback not found");
    if (patch.status) {
      f.published_at = patch.status === "published" ? (f.status === "published" ? f.published_at : now()) : null;
      f.status = patch.status;
    }
    if (patch.internal_notes !== undefined) f.internal_notes = patch.internal_notes;
    f.updated_at = now();
    await persist(db);
  },
  async deleteFeedback(id) {
    const db = await load();
    db.customer_feedback = db.customer_feedback.filter((f) => f.id !== id);
    await persist(db);
  },
  async listEnquiries({ branchScope }) {
    const db = await load();
    return db.contact_enquiries
      .filter((e) => !branchScope || (e.branch_id !== null && branchScope.includes(e.branch_id)))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((e) => {
        const { dedupe_hash, ...rest } = e;
        void dedupe_hash;
        return rest;
      });
  },
  async updateEnquiryStatus(id, status) {
    const db = await load();
    const e = db.contact_enquiries.find((r) => r.id === id);
    if (!e) throw new NotFoundError("Enquiry not found");
    e.status = status;
    e.updated_at = now();
    await persist(db);
  },

  async saveMenuItem(id, input) {
    const db = await load();
    assertUnique(db.menu_items, id, "slug", input.slug, "That URL slug");
    const out = upsert(db.menu_items, id, input);
    await persist(db);
    return out;
  },
  async deleteMenuItem(id) {
    const db = await load();
    db.menu_items = db.menu_items.filter((m) => m.id !== id);
    db.branch_menu_items = db.branch_menu_items.filter((r) => r.menu_item_id !== id);
    await persist(db);
  },
  async setBranchOverrides(menuItemId, overrides) {
    const db = await load();
    const touched = new Set(overrides.map((o) => o.branch_id));
    db.branch_menu_items = db.branch_menu_items.filter((r) => !(r.menu_item_id === menuItemId && touched.has(r.branch_id)));
    for (const o of overrides) {
      if (o.price_override === null && o.is_available) continue; // no override needed
      db.branch_menu_items.push({ ...o, id: randomUUID(), menu_item_id: menuItemId, created_at: now(), updated_at: now() });
    }
    await persist(db);
  },

  async saveCategory(id, input) {
    const db = await load();
    assertUnique(db.menu_categories, id, "slug", input.slug, "That URL slug");
    assertUnique(db.menu_categories, id, "name", input.name, "That category name");
    const out = upsert(db.menu_categories, id, input);
    await persist(db);
    return out;
  },
  async deleteCategory(id) {
    const db = await load();
    if (db.menu_items.some((m) => m.category_id === id)) throw new ConflictError("Category still has dishes");
    db.menu_categories = db.menu_categories.filter((c) => c.id !== id);
    await persist(db);
  },
  async countItemsInCategory(id) {
    return (await load()).menu_items.filter((m) => m.category_id === id).length;
  },

  async saveBranch(id, input) {
    const db = await load();
    assertUnique(db.branches, id, "slug", input.slug, "That URL slug");
    assertUnique(db.branches, id, "name", input.name, "That branch name");
    const out = upsert(db.branches, id, input);
    await persist(db);
    return out;
  },

  async saveDeliveryLink(id, input) {
    const db = await load();
    const out = upsert(db.delivery_links, id, input);
    await persist(db);
    return out;
  },
  async deleteDeliveryLink(id) {
    const db = await load();
    db.delivery_links = db.delivery_links.filter((d) => d.id !== id);
    await persist(db);
  },

  async saveHeroSlide(id, input) {
    const db = await load();
    const out = upsert(db.hero_slides, id, input);
    await persist(db);
    return out;
  },
  async deleteHeroSlide(id) {
    const db = await load();
    db.hero_slides = db.hero_slides.filter((s) => s.id !== id);
    await persist(db);
  },
  async saveGalleryImage(id, input) {
    const db = await load();
    const out = upsert(db.gallery_images, id, input);
    await persist(db);
    return out;
  },
  async deleteGalleryImage(id) {
    const db = await load();
    db.gallery_images = db.gallery_images.filter((g) => g.id !== id);
    await persist(db);
  },

  async updateSettings(patch) {
    const db = await load();
    db.site_settings = { ...db.site_settings, ...patch };
    await persist(db);
  },
};
