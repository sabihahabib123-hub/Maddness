import { formatDate } from "@/lib/format";
import type { PublicReview } from "@/lib/types";
import { Stars } from "./ui";

/** Speech-bubble card for an approved website review. Never shows contact details. */
export function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <figure className="relative flex h-full flex-col rounded-[var(--radius-card)] border-2 border-black bg-cream p-6 text-obsidian shadow-[var(--shadow-panel)]">
      <Stars value={review.rating_overall} />
      <blockquote className="mt-4 flex-1 text-[1.0625rem] leading-relaxed">
        <p>&ldquo;{review.message}&rdquo;</p>
      </blockquote>
      <figcaption className="mt-5 border-t border-black/10 pt-4">
        <p className="font-extrabold">{review.display_name}</p>
        <p className="text-sm text-[#5d5a55]">
          {[review.branch_name, formatDate(review.published_at)].filter(Boolean).join(" · ")}
        </p>
      </figcaption>
      <span aria-hidden className="absolute -bottom-[14px] left-10 size-6 rotate-45 border-b-2 border-r-2 border-black bg-cream" />
    </figure>
  );
}
