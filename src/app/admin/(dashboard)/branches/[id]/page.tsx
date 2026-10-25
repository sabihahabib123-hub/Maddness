import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Panel, PageTitle } from "@/components/admin/admin-shell";
import { BranchForm } from "@/components/admin/branch-form";
import { BranchMenuForm } from "@/components/admin/branch-menu-form";
import { Alert } from "@/components/arc/alert/alert";
import { canManageBranch, isAdminRole, requireStaffPage } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";

export const metadata = { title: "Edit branch" };

export default async function EditBranchPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const user = await requireStaffPage();
  const { id } = await params;
  const { created } = await searchParams;
  if (!canManageBranch(user, id)) redirect("/admin?denied=1");
  const repo = await getAdminRepo();
  const branch = await repo.getBranchById(id);
  if (!branch) notFound();
  const [items, overrides] = await Promise.all([repo.listMenuItems(), repo.listBranchMenuItems({ branchId: id })]);

  return (
    <>
      <Link href="/admin/branches" className="mb-4 inline-flex items-center gap-1.5 text-[length:var(--text-sm)] text-[var(--text-secondary)] hover:text-[var(--foreground)]">
        <ArrowLeft aria-hidden className="size-4" /> All branches
      </Link>
      <PageTitle
        title={branch.name}
        actions={
          branch.is_active && (
            <Link href={`/locations/${branch.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[length:var(--text-sm)] text-[var(--accent)] hover:underline">
              View on website <ExternalLink aria-hidden className="size-3.5" />
            </Link>
          )
        }
      />
      {created && <div className="mb-6"><Alert tone="success" title="Branch created" /></div>}
      {branch.source_note && !branch.is_verified && (
        <div className="mb-6">
          <Alert tone="warning" title="Details not yet confirmed">{branch.source_note}</Alert>
        </div>
      )}

      <BranchForm branch={branch} canEditStatus={isAdminRole(user)} />

      <div id="branch-menu" className="mt-6 scroll-mt-6">
        <Panel title="Branch menu" description="Leave a price blank to use the base price. Untick a dish if this branch doesn't serve it.">
          {items.length ? (
            <BranchMenuForm branchId={branch.id} items={items} overrides={overrides} />
          ) : (
            <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">No dishes on the menu yet.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
