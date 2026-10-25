import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient, createSessionClient } from "@/lib/supabase/server";
import { demoRepository } from "./demo-store";
import type { Repository } from "./repository";
import { createSupabaseRepository } from "./supabase-repo";

/** Repository for public pages: anonymous, cacheable, RLS-limited. */
export const getPublicRepo = cache((): Repository => {
  return isSupabaseConfigured() ? createSupabaseRepository(createPublicClient()) : demoRepository;
});

/**
 * Repository for admin pages and actions, bound to the signed-in user's
 * session so RLS enforces their role. Call requireStaff() first.
 */
export async function getAdminRepo(): Promise<Repository> {
  return isSupabaseConfigured() ? createSupabaseRepository(await createSessionClient()) : demoRepository;
}

export type { Repository } from "./repository";
