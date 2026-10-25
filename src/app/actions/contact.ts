"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getPublicRepo } from "@/lib/data";
import { rateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/types";
import { contactSchema } from "@/lib/validation/contact";

export type ContactState = ActionResult & { values?: Record<string, string> };

/** Progressive-enhancement form action: works with or without JavaScript. */
export async function submitEnquiry(_prev: ContactState | null, formData: FormData): Promise<ContactState> {
  const raw = Object.fromEntries(Array.from(formData.entries()).map(([k, v]) => [k, typeof v === "string" ? v : ""]));
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";

  if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000).ok) {
    return { ok: false, message: "Too many messages from this connection. Please try again later.", values: raw };
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  }
  const v = parsed.data;
  if (v.website || (v.started_at && Date.now() - v.started_at < 2500)) return { ok: true };

  const repo = getPublicRepo();
  if (v.branch_id && !(await repo.listBranches()).some((b) => b.id === v.branch_id)) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { branch_id: ["Choose a branch"] }, values: raw };
  }

  const dedupe_hash = createHash("sha256").update([v.name.toLowerCase(), v.message.toLowerCase().replace(/\s+/g, " ")].join("|")).digest("hex");
  try {
    if ((await repo.countRecentEnquiriesByHash(dedupe_hash, new Date(Date.now() - 86_400_000).toISOString())) === 0) {
      await repo.insertEnquiry({ name: v.name, email: v.email, phone: v.phone, topic: v.topic, branch_id: v.branch_id, message: v.message, dedupe_hash });
    }
  } catch {
    return { ok: false, message: "We couldn't send your message right now. Please try again shortly or call a branch.", values: raw };
  }
  return { ok: true, message: "Thanks! Your message is with our team. We'll reply using the details you gave us." };
}
