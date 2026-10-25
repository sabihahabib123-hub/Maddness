"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminRole, requireAdmin, requireBranchAccess } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";
import { NotFoundError } from "@/lib/data/repository";
import { WEEKDAYS } from "@/lib/format";
import { deleteImage, hasFile, uploadImage } from "@/lib/storage";
import type { ActionResult } from "@/lib/types";
import { branchSchema, fd } from "@/lib/validation/admin";
import { parseOrThrow, run, ValidationFailed } from "./run";

export async function saveBranch(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  let createdId: string | null = null;
  const res = await run(async () => {
    const id = fd.str(form, "id") || null;
    // Creating a branch is admin-only; editing needs access to that branch.
    const user = id ? await requireBranchAccess(id) : await requireAdmin();

    const repo = await getAdminRepo();
    const existing = id ? await repo.getBranchById(id) : null;
    if (id && !existing) throw new NotFoundError("That branch no longer exists");

    const file = form.get("image_file");
    let image_url = fd.str(form, "image_url");
    if (hasFile(file)) image_url = await uploadImage(file, "branches");

    const input = parseOrThrow(branchSchema, {
      name: fd.str(form, "name"),
      slug: fd.str(form, "slug"),
      address: fd.str(form, "address"),
      area: fd.str(form, "area"),
      city: fd.str(form, "city") || "Dubai",
      phone: fd.str(form, "phone"),
      email: fd.str(form, "email"),
      hours_note: fd.str(form, "hours_note"),
      opening_hours: fd.bool(form, "hours_enabled")
        ? WEEKDAYS.map((d) => ({
            day: d.key,
            opens: fd.bool(form, `closed_${d.key}`) ? "" : fd.str(form, `opens_${d.key}`),
            closes: fd.bool(form, `closed_${d.key}`) ? "" : fd.str(form, `closes_${d.key}`),
          }))
        : [],
      latitude: fd.str(form, "latitude"),
      longitude: fd.str(form, "longitude"),
      directions_url: fd.str(form, "directions_url"),
      google_review_url: fd.str(form, "google_review_url"),
      image_url,
      is_active: fd.bool(form, "is_active"),
      is_verified: fd.bool(form, "is_verified"),
      source_note: fd.str(form, "source_note"),
      display_order: fd.str(form, "display_order") || "0",
    });
    const half = input.opening_hours.find((h) => (h.opens === null) !== (h.closes === null));
    if (half) throw new ValidationFailed({ opening_hours: [`Set both times for ${half.day.toUpperCase()}, or mark it closed`] });

    // Only owners/admins may show, hide or reorder branches.
    if (existing && !isAdminRole(user)) {
      input.is_active = existing.is_active;
      input.display_order = existing.display_order;
    }

    const saved = await repo.saveBranch(id, input);
    if (existing?.image_url && existing.image_url !== input.image_url) await deleteImage(existing.image_url);
    if (!id) createdId = saved;
    return { message: id ? "Branch saved" : "Branch created" };
  });
  if (res.ok && createdId) redirect(`/admin/branches/${createdId}?created=1`);
  return res;
}

const overrideRow = z.object({
  menu_item_id: z.string().uuid(),
  price_override: z
    .string()
    .trim()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v < 100000), "Invalid price"),
  is_available: z.boolean(),
});

/** Saves the per-branch price and availability table. */
export async function saveBranchMenu(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  return run(async () => {
    const branchId = fd.str(form, "branch_id");
    if (!z.uuid().safeParse(branchId).success) throw new Error("Bad branch");
    await requireBranchAccess(branchId);
    const repo = await getAdminRepo();
    const itemIds = fd.all(form, "item_id");
    const errors: Record<string, string[]> = {};
    const rows = itemIds.map((itemId) => {
      const r = overrideRow.safeParse({
        menu_item_id: itemId,
        price_override: fd.str(form, `price_${itemId}`),
        is_available: fd.bool(form, `available_${itemId}`),
      });
      if (!r.success) errors[`price_${itemId}`] = ["Enter a valid price or leave blank"];
      return r.data;
    });
    if (Object.keys(errors).length) throw new ValidationFailed(errors);
    for (const r of rows) {
      if (!r) continue;
      await repo.setBranchOverrides(r.menu_item_id, [{ branch_id: branchId, price_override: r.price_override, is_available: r.is_available }]);
    }
    return { message: "Branch menu saved" };
  });
}
