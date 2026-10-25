import { ArrowUpRight, Star } from "lucide-react";
import type { ReactNode } from "react";

/** Big Bebas heading with an optional supporting line. */
export function SectionHeading({
  title,
  intro,
  as: Tag = "h2",
  align = "left",
  tone = "dark",
  id,
}: {
  title: ReactNode;
  intro?: ReactNode;
  as?: "h1" | "h2";
  align?: "left" | "center";
  tone?: "dark" | "light";
  id?: string;
}) {
  return (
    <div className={`max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      <Tag id={id} className={`display text-display-md ${tone === "light" ? "text-obsidian" : "text-cream"}`}>
        {title}
      </Tag>
      {intro && (
        <p className={`mt-4 text-lg leading-relaxed ${tone === "light" ? "text-[#4a4744]" : "text-muted"} ${align === "center" ? "mx-auto" : ""} max-w-2xl`}>
          {intro}
        </p>
      )}
    </div>
  );
}

/** Inner-page header band. */
export function PageHero({ title, intro, children }: { title: ReactNode; intro?: ReactNode; children?: ReactNode }) {
  return (
    <section className="halftone relative overflow-hidden border-b border-line bg-charcoal pb-12 pt-32 sm:pb-16 sm:pt-40">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-red/15 blur-3xl" />
      <div className="container-page relative">
        <h1 className="display text-display-lg text-cream">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{intro}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function Stars({ value, size = "md", label }: { value: number; size?: "sm" | "md"; label?: string }) {
  const cls = size === "sm" ? "size-4" : "size-5";
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label ?? `${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden className={`${cls} ${n <= value ? "fill-gold text-gold" : "fill-transparent text-line"}`} />
      ))}
    </span>
  );
}

/** External links always open safely in a new tab and say so to screen readers. */
export function ExternalLink({ href, children, className = "", ariaLabel }: { href: string; children: ReactNode; className?: string; ariaLabel?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={ariaLabel ? `${ariaLabel} (opens in a new tab)` : undefined}>
      {children}
      {!ariaLabel && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

export function ExternalIcon() {
  return <ArrowUpRight aria-hidden className="size-4 shrink-0" />;
}

export function Pill({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "gold" | "red" | "neutral" }) {
  const tones = {
    dark: "bg-black/70 text-cream border-white/15",
    gold: "bg-gold text-obsidian border-black",
    red: "bg-red text-white border-black",
    neutral: "bg-ink text-muted border-line",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide ${tones[tone]}`}>{children}</span>;
}

/** Friendly empty state for public pages: never fake content. */
export function PublicEmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border-2 border-dashed border-line bg-charcoal/60 px-6 py-12 text-center">
      {icon && <div className="mx-auto mb-4 flex size-14 items-center justify-center text-gold">{icon}</div>}
      <p className="display text-3xl text-cream">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-muted">{children}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
