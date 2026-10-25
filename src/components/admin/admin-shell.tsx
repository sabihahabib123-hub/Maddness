"use client";

import { ExternalLink, FileText, Gauge, LayoutList, LogOut, Menu, MessageSquare, Settings, Store, Truck, UtensilsCrossed, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { logout } from "@/app/admin/actions/auth";
import { Badge } from "@/components/arc/badge/badge";
import type { AdminRole } from "@/lib/types";

const NAV: { href: string; label: string; icon: typeof Gauge; adminOnly?: boolean }[] = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed, adminOnly: true },
  { href: "/admin/categories", label: "Categories", icon: LayoutList, adminOnly: true },
  { href: "/admin/branches", label: "Branches", icon: Store },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/delivery", label: "Delivery links", icon: Truck },
  { href: "/admin/content", label: "Website content", icon: FileText, adminOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export function AdminShell({
  children,
  user,
  mode,
  pendingCount,
}: {
  children: ReactNode;
  user: { name: string; role: AdminRole };
  mode: "supabase" | "demo";
  pendingCount: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const isAdmin = user.role !== "branch_editor";
  const items = NAV.filter((n) => isAdmin || !n.adminOnly);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Dashboard" className="grid gap-0.5">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={active(href) ? "page" : undefined}
          className={`flex h-10 items-center gap-3 rounded-[var(--radius-control)] px-3 text-[length:var(--text-sm)] transition-colors ${
            active(href) ? "bg-[var(--surface-muted)] text-[var(--foreground)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Icon aria-hidden className="size-4" />
          <span className="flex-1">{label}</span>
          {href === "/admin/feedback" && pendingCount > 0 && <Badge size="sm" tone="warning">{pendingCount}</Badge>}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="grid gap-3 border-t border-[var(--border)] pt-4">
      <Link href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 text-[length:var(--text-sm)] text-[var(--text-secondary)] hover:text-[var(--foreground)]">
        <ExternalLink aria-hidden className="size-4" /> View website
      </Link>
      <div className="px-3">
        <p className="truncate text-[length:var(--text-sm)]">{user.name}</p>
        <p className="text-[length:var(--text-xs)] text-[var(--text-muted)]">{user.role === "branch_editor" ? "Branch editor" : user.role === "owner" ? "Owner" : "Admin"}</p>
      </div>
      <form action={logout}>
        <button type="submit" className="flex h-10 w-full items-center gap-3 rounded-[var(--radius-control)] px-3 text-[length:var(--text-sm)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]">
          <LogOut aria-hidden className="size-4" /> Sign out
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-[var(--border)] bg-[var(--surface)] p-4 lg:flex">
        <Link href="/admin" className="display px-3 pt-2 text-3xl tracking-[0.06em]">
          MAD<span className="text-red">NESS</span>
        </Link>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 lg:hidden">
        <Link href="/admin" className="display text-2xl tracking-[0.06em]">MAD<span className="text-red">NESS</span></Link>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="admin-mobile-nav" aria-label={open ? "Close navigation" : "Open navigation"} className="inline-flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface-muted)]">
          {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
      </header>
      {open && (
        <div id="admin-mobile-nav" className="fixed inset-x-0 bottom-0 top-14 z-20 flex flex-col gap-6 overflow-y-auto bg-[var(--surface)] p-4 lg:hidden">
          {nav}
          {footer}
        </div>
      )}

      <div className="min-w-0">
        {mode === "demo" && (
          <p className="border-b border-[var(--border)] bg-[var(--accent-subtle)] px-4 py-2 text-center text-[length:var(--text-xs)] text-[var(--text-secondary)] sm:px-8">
            Demo mode: changes are saved to a local file (.data/demo-db.json), not a database. Connect Supabase before launch.
          </p>
        )}
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

export function PageTitle({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[length:var(--text-2xl)] font-medium tracking-[var(--tracking-display)]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[length:var(--text-sm)] text-[var(--text-secondary)]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, children, actions }: { title?: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-[length:var(--text-lg)] font-medium">{title}</h2>}
            {description && <p className="mt-1 text-[length:var(--text-sm)] text-[var(--text-secondary)]">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
