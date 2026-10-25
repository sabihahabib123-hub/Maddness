import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { PageHero } from "./ui";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <PageHero title={title} />
      <section className="section pt-10">
        <div className="container-page">
          <p role="note" className="flex max-w-[var(--container-prose)] gap-3 rounded-xl border border-gold/50 bg-gold/10 p-4 text-sm text-gold">
            <AlertTriangle aria-hidden className="size-5 shrink-0" />
            Placeholder text. This page has not been reviewed by a lawyer and must be checked and completed by the business before the
            website is published.
          </p>
          <div className="mt-10 max-w-[var(--container-prose)] space-y-6 leading-relaxed text-cream/85 [&_h2]:display [&_h2]:pt-4 [&_h2]:text-3xl [&_h2]:text-cream [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
            {children}
          </div>
        </div>
      </section>
    </>
  );
}
