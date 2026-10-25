"use server";

import { requireAdmin } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";
import { ConflictError, NotFoundError } from "@/lib/data/repository";
import type { ActionResult } from "@/lib/types";
import { categorySchema, fd } from "@/lib/validation/admin";
import { parseOrThrow, run } from "./run";

export async function saveCategory(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const repo = await getAdminRepo();
    const id = fd.str(form, "id") || null;
    const input = parseOrThrow(categorySchema, {
      name: fd.str(form, "name"),
      slug: fd.str(form, "slug"),
      description: fd.str(form, "description"),
      display_order: fd.str(form, "display_order") || "0",
      is_active: fd.bool(form, "is_active"),
    });
    await repo.saveCategory(id, input);
    return { message: id ? "Category saved" : "Category added" };
  });
}

export async function setCategoryActive(id: string, active: boolean): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const repo = await getAdminRepo();
    const cat = (await repo.listCategories({ includeInactive: true })).find((c) => c.id === id);
    if (!cat) throw new NotFoundError("That category no longer exists");
    const { id: _i, created_at, updated_at, ...rest } = cat;
    void _i; void created_at; void updated_at;
    await repo.saveCategory(id, { ...rest, is_active: active });
    return { message: active ? "Category shown" : "Category hidden" };
  });
}

/** Swaps display order with the neighbour above or below. */
export async function moveCategory(id: string, direction: "up" | "down"): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const repo = await getAdminRepo();
    const list = await repo.listCategories({ includeInactive: true });
    const i = list.findIndex((c) => c.id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return { message: "Already at the edge" };
    const normalised = list.map((c, idx) => ({ ...c, display_order: idx + 1 }));
    [normalised[i].display_order, normalised[j].display_order] = [normalised[j].display_order, normalised[i].display_order];
    for (const c of normalised) {
      const { id: cid, created_at, updated_at, ...rest } = c;
      void created_at; void updated_at;
      await repo.saveCategory(cid, rest);
    }
    return { message: "Order updated" };
  });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const repo = await getAdminRepo();
    const count = await repo.countItemsInCategory(id);
    if (count > 0) {
      throw new ConflictError(`This category still has ${count} ${count === 1 ? "dish" : "dishes"}. Move them to another category first, or hide the category instead.`);
    }
    await repo.deleteCategory(id);
    return { message: "Category deleted" };
  });
}
