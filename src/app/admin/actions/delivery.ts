"use server";

import { AuthorizationError, canManageBranch, requireStaff } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";
import type { ActionResult } from "@/lib/types";
import { deliveryLinkSchema, fd } from "@/lib/validation/admin";
import { parseOrThrow, run } from "./run";

/** Admins manage every link; branch editors only links for their branches. Brand-wide links are admin-only. */
export async function saveDeliveryLink(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  return run(async () => {
    const user = await requireStaff();
    const repo = await getAdminRepo();
    const id = fd.str(form, "id") || null;
    const input = parseOrThrow(deliveryLinkSchema, {
      platform: fd.str(form, "platform"),
      branch_id: fd.str(form, "branch_id"),
      label: fd.str(form, "label"),
      url: fd.str(form, "url"),
      is_active: fd.bool(form, "is_active"),
      display_order: fd.str(form, "display_order") || "0",
    });
    if (!canManageBranch(user, input.branch_id)) throw new AuthorizationError();
    if (id) {
      const existing = (await repo.listDeliveryLinks({ includeInactive: true })).find((l) => l.id === id);
      if (!existing || !canManageBranch(user, existing.branch_id)) throw new AuthorizationError();
    }
    await repo.saveDeliveryLink(id, input);
    return { message: id ? "Link saved" : "Link added" };
  });
}

async function loadLink(id: string) {
  const user = await requireStaff();
  const repo = await getAdminRepo();
  const link = (await repo.listDeliveryLinks({ includeInactive: true })).find((l) => l.id === id);
  if (!link || !canManageBranch(user, link.branch_id)) throw new AuthorizationError();
  return { repo, link };
}

export async function setDeliveryLinkActive(id: string, active: boolean): Promise<ActionResult> {
  return run(async () => {
    const { repo, link } = await loadLink(id);
    const { id: _i, created_at, updated_at, ...rest } = link;
    void _i; void created_at; void updated_at;
    await repo.saveDeliveryLink(id, { ...rest, is_active: active });
    return { message: active ? "Link is live" : "Link hidden" };
  });
}

export async function deleteDeliveryLink(id: string): Promise<ActionResult> {
  return run(async () => {
    const { repo } = await loadLink(id);
    await repo.deleteDeliveryLink(id);
    return { message: "Link removed" };
  });
}
