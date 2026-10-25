import { Plus } from "lucide-react";
import Link from "next/link";
import { PageTitle } from "@/components/admin/admin-shell";
import { Badge } from "@/components/arc/badge/badge";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { canManageBranch, isAdminRole, requireStaffPage } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";

export const metadata = { title: "Branches" };

export default async function BranchesPage() {
  const user = await requireStaffPage();
  const repo = await getAdminRepo();
  const branches = (await repo.listBranches({ includeInactive: true })).filter((b) => canManageBranch(user, b.id));

  return (
    <>
      <PageTitle
        title="Branches"
        description="Addresses, hours, phone numbers, directions, Google review links and branch menus."
        actions={
          isAdminRole(user) && (
            <Link href="/admin/branches/new" className="inline-flex h-[var(--control-height-md)] items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--accent)] px-4 text-[length:var(--text-sm)] font-medium text-[var(--accent-foreground)]">
              <Plus aria-hidden className="size-4" /> New branch
            </Link>
          )
        }
      />
      {branches.length ? (
        <ul className="grid gap-3">
          {branches.map((b) => (
            <li key={b.id}>
              <Link href={`/admin/branches/${b.id}`} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--border-strong)]">
                <div className="min-w-48 flex-1">
                  <p className="font-medium">{b.name}</p>
                  <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">{b.address}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {!b.is_active && <Badge size="sm">Hidden</Badge>}
                  {b.is_verified ? <Badge size="sm" tone="success">Confirmed</Badge> : <Badge size="sm" tone="warning">Needs confirming</Badge>}
                  {!b.google_review_url && <Badge size="sm">No Google link</Badge>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={isAdminRole(user) ? "No branches yet" : "No branches assigned"}
          description={isAdminRole(user) ? "Add your first location." : "Ask an owner to give you access to a branch."}
        />
      )}
      <p className="mt-6 text-[length:var(--text-xs)] text-[var(--text-muted)]">
        Branches can&apos;t be deleted from here, so their feedback history is never lost. Hide a branch to take it off the website.
      </p>
    </>
  );
}
