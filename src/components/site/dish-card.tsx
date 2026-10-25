import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, labelise } from "@/lib/format";
import type { ResolvedMenuItem } from "@/lib/types";
import { Pill } from "./ui";

export function DishCard({ item, priority = false, branchSlug }: { item: ResolvedMenuItem; priority?: boolean; branchSlug?: string }) {
  const href = `/menu/${item.slug}${branchSlug ? `?branch=${branchSlug}` : ""}`;
  const unavailable = !item.effective_available;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-charcoal transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-black hover:shadow-[var(--shadow-panel-red)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-ink">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.image_alt ?? item.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"
            className={`object-cover transition-transform duration-700 group-hover:scale-105 ${unavailable ? "grayscale" : ""}`}
          />
        ) : (
          <div className="halftone flex h-full items-center justify-center text-muted">No photo yet</div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {unavailable && <Pill tone="neutral">Currently unavailable</Pill>}
          {item.is_sample && <Pill tone="dark">Sample</Pill>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="display text-[1.85rem] leading-[0.95] text-cream">
            <Link href={href} className="focus-ring rounded after:absolute after:inset-0 after:content-['']">
              {item.name}
            </Link>
          </h3>
          <p className="shrink-0 rounded-md bg-gold px-2 py-1 text-sm font-extrabold text-obsidian">{formatPrice(item.effective_price)}</p>
        </div>
        {item.short_description && <p className="mt-2 line-clamp-2 text-[0.9375rem] leading-relaxed text-muted">{item.short_description}</p>}
        {item.dietary_labels.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Dietary information">
            {item.dietary_labels.map((d) => (
              <li key={d}>
                <Pill tone="neutral">{labelise(d)}</Pill>
              </li>
            ))}
          </ul>
        )}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-red" aria-hidden>
          View dish <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </article>
  );
}

export function DishCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-charcoal" aria-hidden>
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-7 w-2/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
      </div>
    </div>
  );
}
