import { MessageSquareQuote, Star } from "lucide-react";
import type { Metadata } from "next";
import { FeedbackForm } from "@/components/site/feedback-form";
import { ReviewCard } from "@/components/site/review-card";
import { ExternalIcon, ExternalLink, PageHero, PublicEmptyState } from "@/components/site/ui";
import { getPublicRepo } from "@/lib/data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Reviews",
  description: "Read what guests say about MADNESS, leave your own feedback, or review us on Google.",
  alternates: { canonical: "/reviews" },
};

export default async function ReviewsPage() {
  const repo = getPublicRepo();
  const [reviews, branches, settings] = await Promise.all([repo.listPublishedReviews(24), repo.listBranches(), repo.getSettings()]);
  const googleLinks = [
    ...(settings.google_reviews_url ? [{ id: "brand", name: "MADNESS", url: settings.google_reviews_url }] : []),
    ...branches.filter((b) => b.google_review_url).map((b) => ({ id: b.id, name: b.name, url: b.google_review_url! })),
  ];

  return (
    <>
      <PageHero title="What our customers say." intro="Every review below was written on our website and approved by our team before publishing." />

      <section aria-labelledby="published-title" className="section pt-12">
        <div className="container-page">
          <h2 id="published-title" className="sr-only">Published reviews</h2>
          {reviews.length ? (
            <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => <li key={r.id}><ReviewCard review={r} /></li>)}
            </ul>
          ) : (
            <PublicEmptyState icon={<MessageSquareQuote className="size-12" aria-hidden />} title="No reviews published yet">
              Be the first. Share your experience using the form below.
            </PublicEmptyState>
          )}
        </div>
      </section>

      <section aria-labelledby="google-title" className="border-y border-line bg-charcoal py-14">
        <div className="container-page grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 id="google-title" className="display text-display-sm">Prefer Google?</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Reviews left on Google are separate from the feedback form on this page and are managed by Google.
            </p>
          </div>
          {googleLinks.length ? (
            <ul className="flex flex-wrap gap-3">
              {googleLinks.map((g) => (
                <li key={g.id}>
                  <ExternalLink href={g.url} className="btn btn-outline">
                    <Star aria-hidden className="size-4" /> {googleLinks.length > 1 ? g.name.replace(/^MADNESS\s+/i, "") : "Review us on Google"} <ExternalIcon />
                  </ExternalLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Google review links will be added soon.</p>
          )}
        </div>
      </section>

      <section id="leave-review" aria-labelledby="leave-title" className="section scroll-mt-20">
        <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 id="leave-title" className="display text-display-md">Leave your review</h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
              Loved it? Something not right? Tell us. Every message goes straight to our team, and we read them all.
            </p>
            <ul className="mt-8 grid gap-3 text-sm text-muted">
              <li className="flex gap-3"><span className="display text-2xl leading-none text-red">01</span> No account needed.</li>
              <li className="flex gap-3"><span className="display text-2xl leading-none text-red">02</span> Your contact details stay private.</li>
              <li className="flex gap-3"><span className="display text-2xl leading-none text-red">03</span> Reviews are published only after our team approves them.</li>
            </ul>
          </div>
          <div className="relative rounded-[var(--radius-card)] border border-line bg-[#141414] p-5 sm:p-8">
            <FeedbackForm branches={branches.map((b) => ({ id: b.id, name: b.name }))} />
          </div>
        </div>
      </section>
    </>
  );
}
