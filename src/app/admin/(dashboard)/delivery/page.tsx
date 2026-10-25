import { ChevronRight, ExternalLink } from "lucide-react";
import { deleteDeliveryLink, setDeliveryLinkActive } from "@/app/admin/actions/delivery";
import { Panel, PageTitle } from "@/components/admin/admin-shell";
import { ActionSwitch, ConfirmAction } from "@/components/admin/controls";
import { DeliveryLinkForm } from "@/components/admin/delivery-link-form";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { deliveryPlatformMeta } from "@/config/site";
import { canManageBranch, isAdminRole, requireStaffPage } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";

export const metadata = { title: "Delivery links" };

export default async function DeliveryAdminPage() {
  const user = await requireStaffPage();
  const repo = await getAdminRepo();
  const [links, allBranches] = await Promise.all([repo.listDeliveryLinks({ includeInactive: true }), repo.listBranches({ includeInactive: true })]);
  const branches = allBranches.filter((b) => canManageBranch(user, b.id));
  const visible = links.filter((l) => canManageBranch(user, l.branch_id));
  const branchName = (id: string | null) => (id ? allBranches.find((b) => b.id === id)?.name ?? "Unknown branch" : "All branches");

  return (
    <>
      <PageTitle
        title="Delivery links"
        description="Only active links appear on the website. Add a platform only once MADNESS is actually listed there, using the real listing URL."
      />
      <div className="grid gap-6">
        {visible.length ? (
          <ul className="grid gap-3">
            {visible.map((l) => (
              <li key={l.id} className="rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex flex-wrap items-center gap-4 p-4">
                  <span aria-hidden className="size-3 rounded-full" style={{ backgroundColor: deliveryPlatformMeta[l.platform].color }} />
                  <div className="min-w-48 flex-1">
                    <p className="font-medium">{l.label || deliveryPlatformMeta[l.platform].name}</p>
                    <p className="text-[length:var(--text-xs)] text-[var(--text-muted)]">{branchName(l.branch_id)}</p>
                  </div>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[length:var(--text-sm)] text-[var(--accent)] hover:underline">
                    Test link <ExternalLink aria-hidden className="size-3.5" />
                  </a>
                  <ActionSwitch label="Live" checked={l.is_active} onToggle={setDeliveryLinkActive.bind(null, l.id)} />
                </div>
                <details className="group border-t border-[var(--border)]">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[length:var(--text-sm)] text-[var(--text-secondary)] hover:text-[var(--foreground)]">
                    <ChevronRight aria-hidden className="size-4 transition-transform group-open:rotate-90" /> Edit or remove
                  </summary>
                  <div className="grid gap-5 px-4 pb-5">
                    <DeliveryLinkForm link={l} branches={branches} allowBrandWide={isAdminRole(user)} />
                    <ConfirmAction label="Remove link" prompt="Remove this delivery link?" confirmLabel="Remove" doneLabel="Removed" onConfirm={deleteDeliveryLink.bind(null, l.id)} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No delivery links yet" description="The website shows a ‘call a branch’ message until you add one." />
        )}

        <Panel title="Add a delivery link">
          {branches.length || isAdminRole(user) ? (
            <DeliveryLinkForm key={visible.length} branches={branches} allowBrandWide={isAdminRole(user)} />
          ) : (
            <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">You don&apos;t manage any branches yet.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
