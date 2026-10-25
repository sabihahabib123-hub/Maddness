/**
 * Environment detection. Supabase mode turns on only when the public URL and
 * anon key are both present; otherwise the app runs on the local demo store.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getDataMode(): "supabase" | "demo" {
  return isSupabaseConfigured() ? "supabase" : "demo";
}

/**
 * The demo admin (password login, file-backed store) is meant for local
 * development only. It is disabled in production unless explicitly allowed.
 */
export function isDemoAdminEnabled(): boolean {
  if (isSupabaseConfigured()) return false;
  if (!process.env.DEMO_ADMIN_PASSWORD || !process.env.DEMO_SESSION_SECRET) return false;
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_ADMIN_IN_PRODUCTION !== "true") return false;
  return true;
}
