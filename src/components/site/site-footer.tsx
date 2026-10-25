import { MapPin, Phone } from "lucide-react";
import { Instagram } from "./instagram-icon";
import Link from "next/link";
import { deliveryPlatformMeta, mainNav } from "@/config/site";
import { telHref } from "@/lib/format";
import type { Branch, DeliveryLink, SiteSettings } from "@/lib/types";
import { Logo } from "./logo";
import { ExternalLink } from "./ui";

export function SiteFooter({ settings, branches, delivery }: { settings: SiteSettings; branches: Branch[]; delivery: DeliveryLink[] }) {
  const socials = [
    { href: settings.instagram_url, label: "Instagram" },
    { href: settings.tiktok_url, label: "TikTok" },
    { href: settings.facebook_url, label: "Facebook" },
  ].filter((s): s is { href: string; label: string } => Boolean(s.href));

  return (
    <footer className="relative border-t-4 border-red bg-[#0a0a0a]">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.4fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{settings.footer_blurb}</p>
          {socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Social media">
              {socials.map((s) => (
                <li key={s.label}>
                  <ExternalLink href={s.href} ariaLabel={`MADNESS on ${s.label}`} className="focus-ring inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-cream hover:border-cream">
                    {s.label === "Instagram" && <Instagram aria-hidden className="size-4" />}
                    {s.label}
                  </ExternalLink>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Footer">
          <h2 className="display text-2xl text-cream">Explore</h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {[...mainNav, { href: "/contact", label: "Contact" }].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="focus-ring rounded text-muted hover:text-cream">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="display text-2xl text-cream">Find us</h2>
          {branches.length ? (
            <ul className="mt-4 grid gap-4 text-sm">
              {branches.map((b) => (
                <li key={b.id}>
                  <Link href={`/locations/${b.slug}`} className="focus-ring rounded font-bold text-cream hover:text-red">
                    {b.name}
                  </Link>
                  <p className="mt-1 flex gap-2 text-muted">
                    <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
                    {b.address}
                  </p>
                  {b.phone && (
                    <a href={telHref(b.phone)} className="focus-ring mt-1 flex gap-2 rounded text-muted hover:text-cream">
                      <Phone aria-hidden className="mt-0.5 size-4 shrink-0" />
                      {b.phone}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Branch details coming soon.</p>
          )}
          {(settings.contact_email || settings.contact_phone) && (
            <p className="mt-4 text-sm text-muted">
              {settings.contact_email && (
                <a className="focus-ring rounded hover:text-cream" href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
              )}
              {settings.contact_email && settings.contact_phone && " · "}
              {settings.contact_phone && <a className="focus-ring rounded hover:text-cream" href={telHref(settings.contact_phone)}>{settings.contact_phone}</a>}
            </p>
          )}
        </div>

        <div>
          <h2 className="display text-2xl text-cream">Order online</h2>
          {delivery.length ? (
            <ul className="mt-4 grid gap-2 text-sm">
              {delivery.map((d) => (
                <li key={d.id}>
                  <ExternalLink href={d.url} className="focus-ring rounded text-muted hover:text-cream">
                    {d.label || deliveryPlatformMeta[d.platform]?.name}
                    {d.branch_id && ` (${branches.find((b) => b.id === d.branch_id)?.name.replace(/^MADNESS\s+/i, "") ?? "branch"})`}
                  </ExternalLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Delivery partners coming soon.</p>
          )}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {settings.site_name}. All rights reserved.</p>
          <ul className="flex gap-5">
            <li><Link href="/privacy" className="focus-ring rounded hover:text-cream">Privacy policy</Link></li>
            <li><Link href="/terms" className="focus-ring rounded hover:text-cream">Terms and conditions</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
