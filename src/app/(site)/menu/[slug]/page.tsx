import { AlertTriangle, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DishCard } from "@/components/site/dish-card";
import { DishJsonLd } from "@/components/site/json-ld";
import { Pill } from "@/components/site/ui";
import { getPublicRepo } from "@/lib/data";
import { formatPrice, labelise } from "@/lib/format";
import { resolveMenu } from "@/lib/menu";

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const items = await getPublicRepo().listMenuItems();
  return items.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicRepo().getMenuItemBySlug(slug);
  if (!item) return { title: "Dish not found" };
  return {
    title: item.name,
    description: item.short_description ?? item.description ?? undefined,
    alternates: { canonical: `/menu/${item.slug}` },
    openGraph: item.image_url ? { images: [{ url: item.image_url, alt: item.image_alt ?? item.name }] } : undefined,
  };
}

export default async function DishPage({ params, searchParams }: { params: Params; searchParams: Promise<{ branch?: string }> }) {
  const { slug } = await params;
  const { branch: branchSlug } = await searchParams;
  const repo = getPublicRepo();
  const item = await repo.getMenuItemBySlug(slug);
  if (!item) notFound();

  const [categories, items, branches, overrides] = await Promise.all([
    repo.listCategories(),
    repo.listMenuItems(),
    repo.listBranches(),
    repo.listBranchMenuItems({ menuItemId: item.id }),
  ]);
  const category = categories.find((c) => c.id === item.category_id);
  if (!category) notFound();

  const selectedBranch = branches.find((b) => b.slug === branchSlug) ?? null;
  const [resolved] = resolveMenu([item], categories, overrides, selectedBranch?.id);
  const related = resolveMenu(items, categories, [])
    .filter((m) => m.id !== item.id && m.category_id === item.category_id)
    .slice(0, 3);
  const perBranch = branches.map((b) => {
    const ov = overrides.find((o) => o.branch_id === b.id);
    return { branch: b, price: ov?.price_override ?? item.price, available: item.is_available && (ov ? ov.is_available : true) };
  });
  const hasBranchDifferences = perBranch.some((p) => p.price !== item.price || p.available !== item.is_available);
  const backHref = `/menu${selectedBranch ? `?branch=${selectedBranch.slug}` : ""}`;

  return (
    <>
      <DishJsonLd item={item} />
      <article className="pt-[4.5rem]">
        <div className="grid lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-2">
          <div className="relative aspect-[4/3] bg-ink lg:aspect-auto">
            {item.image_url && (
              <Image src={item.image_url} alt={item.image_alt ?? item.name} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            )}
            <div className="absolute left-4 top-4 flex gap-2">
              {item.is_sample && <Pill tone="gold">Sample dish</Pill>}
              {!resolved.effective_available && <Pill tone="neutral">Currently unavailable</Pill>}
            </div>
          </div>

          <div className="halftone flex flex-col px-4 py-10 sm:px-10 lg:px-14 lg:py-14">
            <nav aria-label="Breadcrumb" className="text-sm text-muted">
              <ol className="flex flex-wrap items-center gap-2">
                <li><Link href="/menu" className="focus-ring rounded hover:text-cream">Menu</Link></li>
                <li aria-hidden>/</li>
                <li><Link href={`/menu?category=${category.slug}`} className="focus-ring rounded hover:text-cream">{category.name}</Link></li>
              </ol>
            </nav>

            <h1 className="display mt-4 text-display-lg text-cream">{item.name}</h1>
            <p className="mt-4 inline-flex w-fit items-center rounded-lg border-2 border-black bg-gold px-3 py-1.5 text-2xl font-extrabold text-obsidian shadow-[4px_4px_0_0_#000]">
              {formatPrice(resolved.effective_price)}
            </p>
            {selectedBranch && <p className="mt-2 text-sm text-muted">Price at {selectedBranch.name}</p>}

            {item.description && <p className="mt-6 max-w-prose text-lg leading-relaxed text-cream/85">{item.description}</p>}

            {item.dietary_labels.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Dietary information">
                {item.dietary_labels.map((d) => <li key={d}><Pill tone="neutral">{labelise(d)}</Pill></li>)}
              </ul>
            )}

            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <section aria-labelledby="ingredients-title">
                <h2 id="ingredients-title" className="display text-2xl text-cream">Ingredients</h2>
                {item.ingredients.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {item.ingredients.map((ing) => (
                      <li key={ing} className="rounded-full border border-line px-3 py-1 text-sm text-cream/85">{ing}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted">Ask our team for the full ingredient list.</p>
                )}
              </section>

              <section aria-labelledby="allergens-title">
                <h2 id="allergens-title" className="display text-2xl text-cream">Allergens</h2>
                {item.allergens_verified ? (
                  item.allergens.length ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {item.allergens.map((a) => (
                        <li key={a} className="rounded-full bg-red/15 px-3 py-1 text-sm font-semibold text-[#ff8a80]">{labelise(a)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-muted">No major allergens listed by our kitchen.</p>
                  )
                ) : (
                  <p className="mt-3 flex gap-2 text-sm text-muted">
                    <AlertTriangle aria-hidden className="size-4 shrink-0 text-gold" />
                    Allergen information hasn&apos;t been verified yet. Please ask our team before ordering.
                  </p>
                )}
              </section>
            </div>

            {branches.length > 0 && hasBranchDifferences && (
              <section aria-labelledby="availability-title" className="mt-8">
                <h2 id="availability-title" className="display text-2xl text-cream">Branch availability</h2>
                <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
                  {perBranch.map((p) => (
                    <li key={p.branch.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                      <span className="flex items-center gap-2 text-cream">
                        {p.available ? <CheckCircle2 aria-hidden className="size-4 text-[#53dca6]" /> : <XCircle aria-hidden className="size-4 text-muted" />}
                        {p.branch.name}
                      </span>
                      <span className="text-muted">{p.available ? formatPrice(p.price) : "Not available"}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-auto flex flex-wrap gap-3 pt-10">
              <Link href={backHref} className="btn btn-outline">
                <ArrowLeft aria-hidden className="size-4" /> Back to menu
              </Link>
              <Link href="/#order" className="btn btn-primary">Order now</Link>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="section border-t border-line bg-charcoal">
          <div className="container-page">
            <h2 id="related-title" className="display text-display-md">More {category.name.toLowerCase()}</h2>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => <li key={r.id}><DishCard item={r} /></li>)}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
