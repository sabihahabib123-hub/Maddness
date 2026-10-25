import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMenuItem, toggleMenuItem } from "@/app/admin/actions/menu";
import { Panel, PageTitle } from "@/components/admin/admin-shell";
import { ActionButton, ConfirmAction } from "@/components/admin/controls";
import { MenuItemForm } from "@/components/admin/menu-item-form";
import { Alert } from "@/components/arc/alert/alert";
import { requireAdminPage } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Edit dish" };

export default async function EditDishPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const { created } = await searchParams;
  const repo = await getAdminRepo();
  const item = await repo.getMenuItemById(id);
  if (!item) notFound();
  const [categories, branches, overrides] = await Promise.all([
    repo.listCategories({ includeInactive: true }),
    repo.listBranches({ includeInactive: true }),
    repo.listBranchMenuItems({ menuItemId: id }),
  ]);

  return (
    <>
      <Link href="/admin/menu" className="mb-4 inline-flex items-center gap-1.5 text-[length:var(--text-sm)] text-[var(--text-secondary)] hover:text-[var(--foreground)]">
        <ArrowLeft aria-hidden className="size-4" /> All dishes
      </Link>
      <PageTitle
        title={item.name}
        actions={
          !item.is_archived && (
            <Link href={`/menu/${item.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[length:var(--text-sm)] text-[var(--accent)] hover:underline">
              View on website <ExternalLink aria-hidden className="size-3.5" />
            </Link>
          )
        }
      />
      {created && <div className="mb-6"><Alert tone="success" title="Dish created" /></div>}
      {item.is_archived && (
        <div className="mb-6"><Alert tone="warning" title="This dish is archived and hidden from the website." /></div>
      )}

      <MenuItemForm item={item} categories={categories} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Branch prices and availability" description="Set on each branch's page, so one place controls everything for a location.">
          {branches.length ? (
            <ul className="divide-y divide-[var(--border)] text-[length:var(--text-sm)]">
              {branches.map((b) => {
                const o = overrides.find((x) => x.branch_id === b.id);
                return (
                  <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/admin/branches/${b.id}#branch-menu`} className="hover:underline">{b.name}</Link>
                    <span className="text-[var(--text-secondary)]">
                      {o && !o.is_available ? "Not available" : formatPrice(o?.price_override ?? item.price)}
                      {o?.price_override != null && " (custom)"}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">No branches yet.</p>
          )}
        </Panel>

        <Panel title="Archive or delete" description="Archiving hides the dish but keeps it. Only archived dishes can be deleted permanently.">
          <div className="flex flex-wrap items-start gap-3">
            {item.is_archived ? (
              <>
                <ActionButton onRun={toggleMenuItem.bind(null, item.id, "is_archived", false)}>Restore dish</ActionButton>
                <ConfirmAction label="Delete permanently" prompt="Delete this dish forever?" confirmLabel="Delete" doneLabel="Deleted" onConfirm={deleteMenuItem.bind(null, item.id)} />
              </>
            ) : (
              <ConfirmAction label="Archive dish" prompt="Hide this dish from the website?" confirmLabel="Archive" doneLabel="Archived" tone="neutral" onConfirm={toggleMenuItem.bind(null, item.id, "is_archived", true)} />
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
