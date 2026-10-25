import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { toggleMenuItem } from "@/app/admin/actions/menu";
import { PageTitle } from "@/components/admin/admin-shell";
import { ActionSwitch } from "@/components/admin/controls";
import { Badge } from "@/components/arc/badge/badge";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { requireAdminPage } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Menu" };

export default async function AdminMenuPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; view?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const repo = await getAdminRepo();
  const [items, categories] = await Promise.all([repo.listMenuItems({ includeArchived: true }), repo.listCategories({ includeInactive: true })]);
  const archivedView = sp.view === "archived";
  const q = (sp.q ?? "").toLowerCase().trim();
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  const rows = items
    .filter((i) => i.is_archived === archivedView)
    .filter((i) => !sp.category || i.category_id === sp.category)
    .filter((i) => !q || i.name.toLowerCase().includes(q) || i.slug.includes(q))
    .sort((a, b) => (catName.get(a.category_id ?? "") ?? "").localeCompare(catName.get(b.category_id ?? "") ?? "") || a.display_order - b.display_order);

  return (
    <>
      <PageTitle
        title="Menu"
        description="Dishes, prices in AED, photos, ingredients and allergens. Branch prices are set on each branch's page."
        actions={
          <Link href="/admin/menu/new" className="inline-flex h-[var(--control-height-md)] items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--accent)] px-4 text-[length:var(--text-sm)] font-medium text-[var(--accent-foreground)]">
            <Plus aria-hidden className="size-4" /> New dish
          </Link>
        }
      />

      <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
        <div className="relative min-w-60 flex-1">
          <label htmlFor="q" className="sr-only">Search dishes</label>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input id="q" name="q" defaultValue={sp.q} placeholder="Search dishes" className="h-[var(--control-height-md)] w-full rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] pl-9 pr-3 text-[length:var(--text-sm)]" />
        </div>
        <label htmlFor="category" className="sr-only">Category</label>
        <select id="category" name="category" defaultValue={sp.category ?? ""} className="h-[var(--control-height-md)] rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[length:var(--text-sm)]">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {archivedView && <input type="hidden" name="view" value="archived" />}
        <button type="submit" className="h-[var(--control-height-md)] rounded-[var(--radius-pill)] border border-[var(--border-strong)] px-4 text-[length:var(--text-sm)] hover:bg-[var(--surface-muted)]">Filter</button>
        <Link href={archivedView ? "/admin/menu" : "/admin/menu?view=archived"} className="ml-auto text-[length:var(--text-sm)] text-[var(--accent)] hover:underline">
          {archivedView ? "Back to current dishes" : `Archived (${items.filter((i) => i.is_archived).length})`}
        </Link>
      </form>

      {rows.length ? (
        <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full min-w-[46rem] text-left text-[length:var(--text-sm)]">
            <caption className="sr-only">Menu items</caption>
            <thead className="border-b border-[var(--border)] text-[var(--text-muted)]">
              <tr>
                <th scope="col" className="px-4 py-3 font-normal">Dish</th>
                <th scope="col" className="px-4 py-3 font-normal">Category</th>
                <th scope="col" className="px-4 py-3 text-right font-normal">Price</th>
                <th scope="col" className="px-4 py-3 font-normal">Available</th>
                <th scope="col" className="px-4 py-3 font-normal">Featured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((i) => (
                <tr key={i.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {i.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.image_url} alt="" className="size-11 shrink-0 rounded-[var(--radius-control)] object-cover" />
                      ) : (
                        <div className="size-11 shrink-0 rounded-[var(--radius-control)] bg-[var(--surface-muted)]" />
                      )}
                      <div className="min-w-0">
                        <Link href={`/admin/menu/${i.id}`} className="font-medium hover:underline">{i.name}</Link>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {i.is_sample && <Badge size="sm" tone="warning">Sample</Badge>}
                          {!i.allergens_verified && <Badge size="sm">Allergens unverified</Badge>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{catName.get(i.category_id ?? "") ?? "None"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatPrice(i.price)}</td>
                  <td className="px-4 py-3">
                    <ActionSwitch hideLabel label={`${i.name} available`} checked={i.is_available} onToggle={toggleMenuItem.bind(null, i.id, "is_available")} />
                  </td>
                  <td className="px-4 py-3">
                    <ActionSwitch hideLabel label={`${i.name} featured on home page`} checked={i.is_featured} onToggle={toggleMenuItem.bind(null, i.id, "is_featured")} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title={items.length ? "No dishes match" : "No dishes yet"}
          description={items.length ? "Try another search or category." : "Add your first dish to start building the menu."}
          action={<Link href="/admin/menu/new" className="text-[var(--accent)] hover:underline">Add a dish</Link>}
        />
      )}
    </>
  );
}
