"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkDemoPassword, createDemoToken, DEMO_COOKIE, demoCookieOptions } from "@/lib/auth/demo-session";
import { isDemoAdminEnabled, isSupabaseConfigured } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createSessionClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; email?: string } | null;

const loginSchema = z.object({
  email: z.string().trim().max(254).optional(),
  password: z.string().min(1, "Enter your password").max(200),
});

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000).ok) {
    return { error: "Too many sign-in attempts. Wait 15 minutes and try again." };
  }

  const parsed = loginSchema.safeParse({ email: formData.get("email") ?? undefined, password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details" };
  const { email, password } = parsed.data;

  if (isSupabaseConfigured()) {
    if (!email || !z.email().safeParse(email).success) return { error: "Enter a valid email address", email };
    const supabase = await createSessionClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error: "Email or password is incorrect", email };
    const { data: staff } = await supabase.from("admin_users").select("is_active").eq("id", data.user.id).maybeSingle();
    if (!staff?.is_active) {
      await supabase.auth.signOut();
      return { error: "This account doesn't have access to the dashboard. Ask an owner to add you.", email };
    }
    redirect("/admin");
  }

  if (isDemoAdminEnabled()) {
    if (!checkDemoPassword(password)) return { error: "Password is incorrect" };
    (await cookies()).set(DEMO_COOKIE, createDemoToken(), demoCookieOptions);
    redirect("/admin");
  }

  return { error: "Sign-in isn't configured. See the README to connect Supabase or enable the local demo admin." };
}

export async function logout(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
  }
  (await cookies()).delete(DEMO_COOKIE);
  redirect("/admin/login");
}
