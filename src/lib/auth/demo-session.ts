import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * DEMO MODE ONLY: a signed, HTTP-only cookie session for the single local
 * demo administrator. Replaced by Supabase Auth once Supabase is configured.
 */
export const DEMO_COOKIE = "madness_demo_admin";
const MAX_AGE_S = 60 * 60 * 8;

function sign(payload: string): string {
  return createHmac("sha256", process.env.DEMO_SESSION_SECRET!).update(payload).digest("base64url");
}

export function createDemoToken(): string {
  const payload = Buffer.from(JSON.stringify({ sub: "demo-owner", exp: Date.now() + MAX_AGE_S * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyDemoToken(token: string | undefined): boolean {
  if (!token || !process.env.DEMO_SESSION_SECRET) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number };
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

export function checkDemoPassword(input: string): boolean {
  const expected = process.env.DEMO_ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = createHmac("sha256", "cmp").update(input).digest();
  const b = createHmac("sha256", "cmp").update(expected).digest();
  return timingSafeEqual(a, b);
}

export const demoCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_S,
};
