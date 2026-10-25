"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getPublicRepo } from "@/lib/data";
import { rateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/types";
import { feedbackSchema } from "@/lib/validation/feedback";

const MIN_FILL_MS = 3000;

/**
 * Public feedback intake. Validates on the server, applies spam checks and
 * rate limits, and stores the submission as "pending". Nothing is published
 * until a member of staff approves it in /admin/feedback.
 */
export async function submitFeedback(input: unknown): Promise<ActionResult> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";

  const limited = rateLimit(`feedback:${ip}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return { ok: false, message: `You've sent a few reviews already. Please try again in ${Math.ceil(limited.retryAfterS / 60)} minutes.` };
  }

  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const v = parsed.data;

  // Spam traps: pretend success so bots learn nothing.
  if (v.website || (v.started_at && Date.now() - v.started_at < MIN_FILL_MS)) {
    return { ok: true };
  }

  const repo = getPublicRepo();
  const branches = await repo.listBranches();
  if (branches.length > 0 && (!v.branch_id || !branches.some((b) => b.id === v.branch_id))) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { branch_id: ["Choose the branch you visited"] } };
  }

  const dedupe_hash = createHash("sha256")
    .update([v.display_name.toLowerCase(), v.branch_id ?? "", v.message.toLowerCase().replace(/\s+/g, " ")].join("|"))
    .digest("hex");
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    if ((await repo.countRecentFeedbackByHash(dedupe_hash, since)) > 0) {
      return { ok: true, message: "We already have this feedback. Thank you!" };
    }
    await repo.insertFeedback({
      branch_id: v.branch_id,
      display_name: v.display_name,
      email: v.email,
      phone: v.phone,
      country: v.country,
      visit_type: v.visit_type,
      rating_overall: v.rating_overall,
      rating_food: v.rating_food,
      rating_service: v.rating_service,
      rating_atmosphere: v.rating_atmosphere,
      message: v.message,
      consent_to_contact: v.consent_to_contact,
      dedupe_hash,
    });
  } catch {
    return { ok: false, message: "We couldn't save your feedback right now. Please try again in a moment." };
  }

  return { ok: true };
}
