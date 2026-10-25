import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | MADNESS admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-root min-h-dvh bg-[var(--background)] text-[var(--foreground)] [font-family:var(--font-body)]">{children}</div>;
}
