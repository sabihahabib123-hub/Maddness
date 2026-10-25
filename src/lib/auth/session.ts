import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isDemoAdminEnabled, isSupabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";
import type { AdminUser } from "@/lib/types";
import { DEMO_COOKIE, verifyDemoToken } from "./demo-session";

/**
 * Resolves the signed-in staff member, or null. Server-side only: every admin
 * page and server action calls this, so hiding links is never the only guard.
 */
export const getCurrentAdmin = cache(async (): Promise<AdminUser | null> => {
  if (isSupabaseConfigured()) {
    const supabase = await createSessionClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data: row } = await supabase
      .from("admin_users")
      .select("id, email, display_name, role, is_active")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (!row || !row.is_active) return null;
    const { data: access } = await supabase.from("admin_branch_access").select("branch_id").eq("admin_user_id", auth.user.id);
    return { ...(row as Omit<AdminUser, "branch_ids">), branch_ids: (access ?? []).map((a: { branch_id: string }) => a.branch_id) };
  }

  if (isDemoAdminEnabled()) {
    const token = (await cookies()).get(DEMO_COOKIE)?.value;
    if (verifyDemoToken(token)) {
      return { id: "demo-owner", email: "demo@localhost", display_name: "Demo owner", role: "owner", branch_ids: [], is_active: true };
    }
  }
  return null;
});

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to do that") {
    super(message);
  }
}

/** For pages: redirect to login when signed out. */
export async function requireStaffPage(): Promise<AdminUser> {
  const user = await getCurrentAdmin();
  if (!user) redirect("/admin/login");
  return user;
}

/** For pages that only owners/admins may open. */
export async function requireAdminPage(): Promise<AdminUser> {
  const user = await requireStaffPage();
  if (!isAdminRole(user)) redirect("/admin?denied=1");
  return user;
}

/** For server actions: throw instead of redirecting. */
export async function requireStaff(): Promise<AdminUser> {
  const user = await getCurrentAdmin();
  if (!user) throw new AuthorizationError("Please sign in again");
  return user;
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await requireStaff();
  if (!isAdminRole(user)) throw new AuthorizationError();
  return user;
}

export async function requireBranchAccess(branchId: string | null): Promise<AdminUser> {
  const user = await requireStaff();
  if (!canManageBranch(user, branchId)) throw new AuthorizationError();
  return user;
}

export function isAdminRole(user: AdminUser): boolean {
  return user.role === "owner" || user.role === "admin";
}

export function canManageBranch(user: AdminUser, branchId: string | null): boolean {
  if (isAdminRole(user)) return true;
  return branchId !== null && user.branch_ids.includes(branchId);
}
