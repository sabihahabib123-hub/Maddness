import "server-only";
import { revalidatePath } from "next/cache";
import type { ZodType } from "zod";
import { AuthorizationError } from "@/lib/auth/session";
import { ConflictError, NotFoundError } from "@/lib/data/repository";
import { UploadError } from "@/lib/storage";
import type { ActionResult } from "@/lib/types";

/** Thrown inside an action to return field errors from a schema. */
export class ValidationFailed extends Error {
  constructor(public fieldErrors: Record<string, string[] | undefined>) {
    super("Validation failed");
  }
}

export function parseOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  const res = schema.safeParse(input);
  if (!res.success) throw new ValidationFailed(res.error.flatten().fieldErrors as Record<string, string[] | undefined>);
  return res.data;
}

/**
 * Wraps every admin mutation: maps known errors to safe messages, never leaks
 * internals, and refreshes cached public pages after a successful write.
 */
export async function run<T = undefined>(fn: () => Promise<{ message?: string; data?: T } | void>): Promise<ActionResult<T>> {
  try {
    const out = await fn();
    revalidatePath("/", "layout");
    return { ok: true, message: out?.message ?? "Saved", data: out?.data };
  } catch (e) {
    if (e instanceof ValidationFailed) return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: e.fieldErrors };
    if (e instanceof AuthorizationError || e instanceof ConflictError || e instanceof NotFoundError || e instanceof UploadError) {
      return { ok: false, message: e.message };
    }
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;
    console.error("[admin action] unexpected error");
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}
