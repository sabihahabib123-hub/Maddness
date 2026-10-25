"use server";

import { z } from "zod";
import { AuthorizationError, canManageBranch, requireAdmin, requireStaff } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";
import { FEEDBACK_STATUSES, type ActionResult, type FeedbackStatus } from "@/lib/types";
import { fd } from "@/lib/validation/admin";
import { run } from "./run";

async function loadInScope(id: string) {
  const user = await requireStaff();
  if (!z.uuid().safeParse(id).success) throw new Error("Bad id");
  const repo = await getAdminRepo();
  const item = await repo.getFeedback(id);
  if (!item || !canManageBranch(user, item.branch_id)) throw new AuthorizationError();
  return { repo, item };
}

const LABEL: Record<FeedbackStatus, string> = {
  published: "Published on the website",
  rejected: "Rejected",
  reviewed: "Marked as reviewed",
  pending: "Moved back to pending",
};

export async function setFeedbackStatus(id: string, status: FeedbackStatus): Promise<ActionResult> {
  return run(async () => {
    if (!FEEDBACK_STATUSES.includes(status)) throw new Error("Bad status");
    const { repo } = await loadInScope(id);
    await repo.updateFeedback(id, { status });
    return { message: LABEL[status] };
  });
}

export async function saveFeedbackNotes(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  return run(async () => {
    const id = fd.str(form, "id");
    const notes = fd.str(form, "internal_notes");
    if (notes.length > 2000) throw new Error("Notes are too long");
    const { repo } = await loadInScope(id);
    await repo.updateFeedback(id, { internal_notes: notes || null });
    return { message: "Notes saved" };
  });
}

export async function deleteFeedback(id: string): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const { repo } = await loadInScope(id);
    await repo.deleteFeedback(id);
    return { message: "Feedback deleted" };
  });
}

export async function setEnquiryStatus(id: string, status: "new" | "handled"): Promise<ActionResult> {
  return run(async () => {
    const user = await requireStaff();
    if (!["new", "handled"].includes(status) || !z.uuid().safeParse(id).success) throw new Error("Bad input");
    const repo = await getAdminRepo();
    const scope = user.role === "branch_editor" ? user.branch_ids : undefined;
    const target = (await repo.listEnquiries({ branchScope: scope })).find((e) => e.id === id);
    if (!target) throw new AuthorizationError();
    await repo.updateEnquiryStatus(id, status);
    return { message: status === "handled" ? "Marked as handled" : "Marked as new" };
  });
}
