import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/session";
import { isDemoAdminEnabled, isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  const mode = isSupabaseConfigured() ? "supabase" : isDemoAdminEnabled() ? "demo" : "none";

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="display text-center text-5xl tracking-[0.06em]">
          MAD<span className="text-red">NESS</span>
        </p>
        <div className="mt-8 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-raised)]">
          <h1 className="text-xl font-medium">Sign in to the dashboard</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {mode === "supabase" && "Use the staff account your owner created for you."}
            {mode === "demo" && "Local demo mode. Use the password from DEMO_ADMIN_PASSWORD in .env.local."}
            {mode === "none" && "Sign-in isn't configured yet."}
          </p>
          <div className="mt-6">
            <LoginForm mode={mode} />
          </div>
        </div>
      </div>
    </main>
  );
}
