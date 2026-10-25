"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";
import { deleteImage, hasFile, uploadImage } from "@/lib/storage";
import { ConflictError, NotFoundError } from "@/lib/data/repository";
import type { ActionResult, MenuItem } from "@/lib/types";
import { fd, menuItemSchema } from "@/lib/validation/admin";
import { parseOrThrow, run } from "./run";

export async function saveMenuItem(_prev: ActionResult<string> | null, form: FormData): Promise<ActionResult<string>> {
  let newId: string | null = null;
  const result = await run<string>(async () => {
    await requireAdmin();
    const repo = await getAdminRepo();
    const id = fd.str(form, "id") || null;
    const existing = id ? await repo.getMenuItemById(id) : null;
    if (id && !existing) throw new NotFoundError("That dish no longer exists");

    const file = form.get("image_file");
    let image_url = fd.str(form, "image_url");
    if (hasFile(file)) image_url = await uploadImage(file, "menu");

    const input = parseOrThrow(menuItemSchema, {
      name: fd.str(form, "name"),
      slug: fd.str(form, "slug"),
      category_id: fd.str(form, "category_id"),
      short_description: fd.str(form, "short_description"),
      description: fd.str(form, "description"),
      price: fd.str(form, "price"),
      image_url,
      image_alt: fd.str(form, "image_alt"),
      ingredients: fd.list(form, "ingredients"),
      allergens: fd.all(form, "allergens"),
      allergens_verified: fd.bool(form, "allergens_verified"),
      dietary_labels: fd.all(form, "dietary_labels"),
      is_available: fd.bool(form, "is_available"),
      is_featured: fd.bool(form, "is_featured"),
      is_sample: fd.bool(form, "is_sample"),
      display_order: fd.str(form, "display_order") || "0",
    });

    const saved = await repo.saveMenuItem(id, {
      ...input,
      gallery_urls: existing?.gallery_urls ?? [],
      is_archived: existing?.is_archived ?? false,
    });
    if (existing?.image_url && existing.image_url !== input.image_url) await deleteImage(existing.image_url);
    if (!id) newId = saved;
    return { message: id ? "Dish saved" : "Dish created", data: saved };
  });
  if (result.ok && newId) redirect(`/admin/menu/${newId}?created=1`);
  return result;
}

type Toggle = keyof Pick<MenuItem, "is_available" | "is_featured" | "is_archived">;

export async function toggleMenuItem(id: string, field: Toggle, value: boolean): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    if (!["is_available", "is_featured", "is_archived"].includes(field)) throw new Error("Bad field");
    const repo = await getAdminRepo();
    const item = await repo.getMenuItemById(id);
    if (!item) throw new NotFoundError("That dish no longer exists");
    const { id: _id, created_at, updated_at, ...rest } = item;
    void _id; void created_at; void updated_at;
    await repo.saveMenuItem(id, { ...rest, [field]: value });
    return { message: field === "is_archived" ? (value ? "Dish archived" : "Dish restored") : "Updated" };
  });
}

/** Permanent delete is only allowed for archived dishes, so nothing disappears by accident. */
export async function deleteMenuItem(id: string): Promise<ActionResult> {
  const res = await run(async () => {
    await requireAdmin();
    const repo = await getAdminRepo();
    const item = await repo.getMenuItemById(id);
    if (!item) throw new NotFoundError("That dish no longer exists");
    if (!item.is_archived) throw new ConflictError("Archive the dish before deleting it");
    await repo.deleteMenuItem(id);
    await deleteImage(item.image_url);
    return { message: "Dish deleted" };
  });
  if (res.ok) redirect("/admin/menu");
  return res;
}
