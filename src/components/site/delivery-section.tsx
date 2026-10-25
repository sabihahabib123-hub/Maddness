import { ArrowUpRight, Bike, Phone } from "lucide-react";
import Link from "next/link";
import { deliveryPlatformMeta } from "@/config/site";
import type { Branch, DeliveryLink } from "@/lib/types";
import { ExternalLink, PublicEmptyState } from "./ui";

/**
 * Only active, admin-configured links are shown. Nothing here implies MADNESS
 * is listed on a platform unless a real URL has been saved in /admin/delivery.
 */
export function DeliverySection({ links, branches }: { links: DeliveryLink[]; branches: Branch[] }) {
  const branchName = (id: string | null) => branches.find((b) => b.id === id)?.name.replace(/^MADNESS\s+/i, "") ?? null;
  const visible = links.filter((l) => l.branch_id === null || branches.some((b) => b.id === l.branch_id));

  return (
    <section id="order" aria-labelledby="order-title" className="section scroll-mt-20 relative overflow-hidden bg-red text-white">
      <div aria-hidden className="halftone-dark absolute inset-0" />
      <div className="container-page relative">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 id="order-title" className="display text-display-lg text-white [text-shadow:4px_4px_0_#000]">
              Your cravings. Your choice.
            </h2>
            <p className="mt-4 max-w-xl text-lg font-medium text-white/90">Get your MADNESS favourites delivered to your door.</p>
          </div>
          <Bike aria-hidden className="hidden size-24 rotate-[-8deg] text-black/30 lg:block" strokeWidth={1.5} />
        </div>

        {visible.length > 0 ? (
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((l) => {
              const meta = deliveryPlatformMeta[l.platform] ?? deliveryPlatformMeta.other;
              const where = branchName(l.branch_id);
              return (
                <li key={l.id}>
                  <ExternalLink
                    href={l.url}
                    ariaLabel={`Order on ${meta.name}${where ? ` from ${where}` : ""}`}
                    className="focus-ring panel group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-obsidian transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                  >
                    <span style={{ backgroundColor: meta.color, color: meta.text }} className="flex min-h-28 items-start justify-between px-6 py-5">
                      <span className="text-2xl font-extrabold tracking-tight">{l.label || meta.name}</span>
                      <ArrowUpRight aria-hidden className="size-6 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                    <span className="flex items-center justify-between px-6 py-4">
                      <span className="text-sm font-bold text-muted">{where ? `${where} branch` : "All branches"}</span>
                      <span className="display text-xl text-cream">Order now</span>
                    </span>
                  </ExternalLink>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-12 [&_p]:text-white [&_.text-muted]:text-white/85">
            <PublicEmptyState
              icon={<Bike className="size-12 text-white" aria-hidden />}
              title="Online ordering is on its way"
              action={
                <>
                  <Link href="/locations" className="btn btn-dark">
                    <Phone aria-hidden className="size-4" /> Call a branch
                  </Link>
                  <Link href="/menu" className="btn btn-outline">Browse the menu</Link>
                </>
              }
            >
              Delivery partner links haven&apos;t been added yet. In the meantime, call your nearest branch.
            </PublicEmptyState>
          </div>
        )}
      </div>
    </section>
  );
}
