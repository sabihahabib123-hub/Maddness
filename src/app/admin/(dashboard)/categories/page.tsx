import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import { deleteCategory, moveCategory, setCategoryActive } from "@/app/admin/actions/categories";
import { Panel, PageTitle } from "@/components/admin/admin-shell";
import { CategoryForm } from "@/components/admin/category-form";
import { ActionButton, ActionSwitch, ConfirmAction } from "@/components/admin/controls";
import { Badge } from "@/components/arc/badge/badge";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { requireAdminPage } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdminPage();
  const repo = await getAdminRepo();
  const [categories, items] = await Promise.all([repo.listCategories({ includeInactive: true }), repo.listMenuItems({ includeArchived: true })]);
  const count = (id: string) => items.filter((i) => i.category_id === id).length;

  return (
    <>
      <PageTitle title="Categories" description="Menu sections, in the order guests see them. Hide a category to take it off the website without losing its dishes." />

      <div className="grid gap-6">
        {categories.length ? (
          <ol className="grid gap-3">
            {categories.map((c, i) => (
              <li key={c.id} className="rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <div className="flex gap-1">
                    <ActionButton variant="ghost" onRun={moveCategory.bind(null, c.id, "up")}>
                      <ArrowUp aria-hidden className="size-4" /><span className="sr-only">Move {c.name} up</span>
                    </ActionButton>
                    <ActionButton variant="ghost" onRun={moveCategory.bind(null, c.id, "down")}>
                      <ArrowDown aria-hidden className="size-4" /><span className="sr-only">Move {c.name} down</span>
                    </ActionButton>
                  </div>
                  <span className="w-6 text-center text-[length:var(--text-sm)] tabular-nums text-[var(--text-muted)]">{i + 1}</span>
                  <div className="min-w-40 flex-1">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-[length:var(--text-xs)] text-[var(--text-muted)]">/{c.slug} · {count(c.id)} {count(c.id) === 1 ? "dish" : "dishes"}</p>
                  </div>
                  {!c.is_active && <Badge size="sm">Hidden</Badge>}
                  <ActionSwitch label="Visible" checked={c.is_active} onToggle={setCategoryActive.bind(null, c.id)} />
                </div>
                <details className="group border-t border-[var(--border)]">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[length:var(--text-sm)] text-[var(--text-secondary)] hover:text-[var(--foreground)]">
                    <ChevronRight aria-hidden className="size-4 transition-transform group-open:rotate-90" /> Edit or delete
                  </summary>
                  <div className="grid gap-6 px-4 pb-5">
                    <CategoryForm category={c} />
                    <div className="border-t border-[var(--border)] pt-4">
                      {count(c.id) > 0 ? (
                        <p className="text-[length:var(--text-xs)] text-[var(--text-muted)]">
                          To delete this category, first move its {count(c.id)} {count(c.id) === 1 ? "dish" : "dishes"} to another category (including archived ones).
                        </p>
                      ) : (
                        <ConfirmAction label="Delete category" prompt={`Delete ${c.name}?`} onConfirm={deleteCategory.bind(null, c.id)} />
                      )}
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="No categories yet" description="Add your first menu section below." />
        )}

        <Panel title="Add a category">
          <CategoryForm key={categories.length} nextOrder={categories.length + 1} />
        </Panel>
      </div>
    </>
  );
}
