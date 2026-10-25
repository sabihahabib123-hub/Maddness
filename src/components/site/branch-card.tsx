import { Clock, MapPin, Phone, ShoppingBag, Star, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { deliveryPlatformMeta } from "@/config/site";
import { directionsHref, summariseHours, telHref } from "@/lib/format";
import type { Branch, DeliveryLink } from "@/lib/types";
import { ExternalLink, Pill } from "./ui";

export function BranchHours({ branch }: { branch: Branch }) {
  const hours = summariseHours(branch.opening_hours);
  if (!hours.length) return <span>{branch.hours_note ?? "Opening hours to be confirmed"}</span>;
  return (
    <span className="grid gap-0.5">
      {hours.map((h) => (
        <span key={h.days}>
          <span className="font-semibold text-cream">{h.days}:</span> {h.hours}
        </span>
      ))}
      {branch.hours_note && <span className="text-sm text-muted">{branch.hours_note}</span>}
    </span>
  );
}

export function BranchCard({ branch, delivery }: { branch: Branch; delivery: DeliveryLink[] }) {
  const orderLink = delivery.find((d) => d.branch_id === branch.id);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-charcoal">
      {branch.image_url && (
        <div className="relative aspect-[16/9] bg-ink">
          <Image src={branch.image_url} alt={`Inside ${branch.name}`} fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/20 to-transparent" />
          {!branch.is_verified && (
            <div className="absolute left-4 top-4">
              <Pill tone="gold">Details being confirmed</Pill>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="display text-4xl text-cream">
          <Link href={`/locations/${branch.slug}`} className="focus-ring rounded hover:text-red">
            {branch.name}
          </Link>
        </h3>
        <dl className="mt-4 grid gap-3 text-[0.9375rem] text-muted">
          <div className="flex gap-3">
            <dt><MapPin aria-label="Address" className="mt-0.5 size-5 text-red" /></dt>
            <dd>{branch.address}</dd>
          </div>
          <div className="flex gap-3">
            <dt><Clock aria-label="Opening hours" className="mt-0.5 size-5 text-red" /></dt>
            <dd><BranchHours branch={branch} /></dd>
          </div>
          {branch.phone && (
            <div className="flex gap-3">
              <dt><Phone aria-label="Phone" className="mt-0.5 size-5 text-red" /></dt>
              <dd>
                <a className="focus-ring rounded font-semibold text-cream underline-offset-4 hover:underline" href={telHref(branch.phone)}>
                  {branch.phone}
                </a>
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <ExternalLink href={directionsHref(branch)} className="btn btn-primary btn-sm">
            <MapPin aria-hidden className="size-4" /> Get directions
          </ExternalLink>
          <Link href={`/menu?branch=${branch.slug}`} className="btn btn-outline btn-sm">
            <UtensilsCrossed aria-hidden className="size-4" /> Branch menu
          </Link>
          {orderLink && (
            <ExternalLink href={orderLink.url} className="btn btn-gold btn-sm">
              <ShoppingBag aria-hidden className="size-4" /> Order from this branch
            </ExternalLink>
          )}
          {branch.google_review_url && (
            <ExternalLink href={branch.google_review_url} className="btn btn-outline btn-sm">
              <Star aria-hidden className="size-4" /> Google reviews
            </ExternalLink>
          )}
        </div>
        {orderLink && (
          <p className="mt-3 text-xs text-muted">Ordering via {deliveryPlatformMeta[orderLink.platform]?.name ?? "partner"}</p>
        )}
      </div>
    </article>
  );
}
