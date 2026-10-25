"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Branch, MenuCategory } from "@/lib/types";

/**
 * Search, branch and category controls. Built as a plain GET form and plain
 * links, so it works without JavaScript; with JavaScript the search updates
 * as you type and the branch select applies on change.
 */
export function MenuFilters({
  categories,
  branches,
  active,
}: {
  categories: MenuCategory[];
  branches: Branch[];
  active: { category?: string; q?: string; branch?: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(active.q ?? "");
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const first = useRef(true);

  const hrefWith = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    const s = next.toString();
    return s ? `${pathname}?${s}` : pathname;
  };

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      startTransition(() => router.replace(hrefWith({ q: q.trim() || undefined }), { scroll: false }));
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const tabs = [{ slug: undefined as string | undefined, name: "All" }, ...categories.map((c) => ({ slug: c.slug, name: c.name }))];

  return (
    <div className="space-y-5">
      <form ref={formRef} method="get" action="/menu" role="search" className="grid gap-3 md:grid-cols-[1fr_auto_auto]" onSubmit={(e) => e.preventDefault()}>
        {active.category && <input type="hidden" name="category" value={active.category} />}
        <div className="relative">
          <label htmlFor="menu-search" className="sr-only">Search the menu</label>
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            id="menu-search"
            name="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search dishes or ingredients"
            autoComplete="off"
            className="field pl-12 pr-12"
            maxLength={80}
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="focus-ring absolute right-2 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-cream">
              <X aria-hidden className="size-4" />
            </button>
          )}
        </div>
        {branches.length > 1 && (
          <div>
            <label htmlFor="menu-branch" className="sr-only">Branch</label>
            <select
              id="menu-branch"
              name="branch"
              defaultValue={active.branch ?? ""}
              className="field md:w-56"
              onChange={(e) => startTransition(() => router.replace(hrefWith({ branch: e.target.value || undefined }), { scroll: false }))}
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.slug}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
        <noscript>
          <button type="submit" className="btn btn-primary btn-sm h-12">Search</button>
        </noscript>
      </form>

      <nav aria-label="Menu categories" className="-mx-4 overflow-x-auto px-4 no-scrollbar">
        <ul className="flex w-max gap-2 pb-1">
          {tabs.map((t) => {
            const isActive = (active.category ?? undefined) === t.slug;
            return (
              <li key={t.name}>
                <Link
                  href={hrefWith({ category: t.slug })}
                  scroll={false}
                  aria-current={isActive ? "page" : undefined}
                  className={`focus-ring display inline-flex h-11 items-center rounded-full border-2 px-5 text-xl transition-colors ${
                    isActive ? "border-black bg-red text-white shadow-[3px_3px_0_0_#000]" : "border-line text-cream/80 hover:border-cream hover:text-cream"
                  }`}
                >
                  {t.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <p aria-live="polite" className="sr-only">{pending ? "Updating results" : ""}</p>
    </div>
  );
}
