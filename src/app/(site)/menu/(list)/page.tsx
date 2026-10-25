import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DishCard } from "@/components/site/dish-card";
import { MenuFilters } from "@/components/site/menu-filters";
import { PageHero, PublicEmptyState } from "@/components/site/ui";
import { getPublicRepo } from "@/lib/data";
import { groupByCategory, resolveMenu, searchMenu } from "@/lib/menu";

export const metadata: Metadata = {
  title: "Menu",
  description: "Burgers, pasta, hot-stone wagyu, smoking starters and desserts. Browse the MADNESS menu with prices in AED.",
  alternates: { canonical: "/menu" },
};

type SearchParams = Promise<{ category?: string; q?: string; branch?: string }>;

export default async function MenuPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 80);
  const repo = getPublicRepo();
  const [categories, items, branches] = await Promise.all([repo.listCategories(), repo.listMenuItems(), repo.listBranches()]);

  const branch = branches.find((b) => b.slug === sp.branch) ?? null;
  const overrides = branch ? await repo.listBranchMenuItems({ branchId: branch.id }) : [];
  const category = categories.find((c) => c.slug === sp.category) ?? null;

  let resolved = resolveMenu(items, categories, overrides, branch?.id);
  if (category) resolved = resolved.filter((m) => m.category_id === category.id);
  resolved = searchMenu(resolved, q);
  const groups = groupByCategory(resolved, categories);

  return (
    <>
      <PageHero
        title="The menu"
        intro={branch ? `Showing prices and availability for ${branch.name}. All prices in AED.` : "Bold plates, built to be shared (or not). All prices in AED."}
      />
      <section className="section pt-10">
        <div className="container-page">
          <Suspense>
            <MenuFilters categories={categories} branches={branches} active={{ category: category?.slug, q, branch: branch?.slug }} />
          </Suspense>

          <p className="mt-6 text-sm text-muted" aria-live="polite">
            {resolved.length} {resolved.length === 1 ? "dish" : "dishes"}
            {q && <> matching &ldquo;{q}&rdquo;</>}
            {category && <> in {category.name}</>}
          </p>

          {groups.length ? (
            <div className="mt-8 space-y-16">
              {groups.map(({ category: c, items: list }, gi) => (
                <section key={c.id} aria-labelledby={`cat-${c.slug}`}>
                  <div className="flex items-baseline gap-4 border-b border-line pb-3">
                    <h2 id={`cat-${c.slug}`} className="display text-display-sm text-cream">{c.name}</h2>
                    <span className="text-sm text-muted">{list.length}</span>
                  </div>
                  {c.description && <p className="mt-3 text-muted">{c.description}</p>}
                  <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((item, i) => (
                      <li key={item.id}>
                        <DishCard item={item} priority={gi === 0 && i < 3} branchSlug={branch?.slug} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <PublicEmptyState
                icon={<SearchX className="size-12" aria-hidden />}
                title={items.length ? "Nothing matches that" : "Menu coming soon"}
                action={items.length ? <Link href="/menu" className="btn btn-gold">Clear filters</Link> : undefined}
              >
                {items.length ? "Try a different word, or browse all categories." : "Our menu is being updated. Please check back shortly."}
              </PublicEmptyState>
            </div>
          )}

          <p className="mt-16 rounded-xl border border-line bg-charcoal p-5 text-sm leading-relaxed text-muted">
            <strong className="text-cream">Allergies or dietary needs?</strong> Allergen information is shown on each dish only once it has been
            verified by our kitchen. Please always tell our team about allergies before ordering.
          </p>
        </div>
      </section>
    </>
  );
}
