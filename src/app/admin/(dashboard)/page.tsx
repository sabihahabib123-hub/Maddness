import Link from "next/link";
import { Panel, PageTitle } from "@/components/admin/admin-shell";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import { isAdminRole, requireStaffPage } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Overview" };

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireStaffPage();
  const { denied } = await searchParams;
  const repo = await getAdminRepo();
  const [stats, branches, delivery, items] = await Promise.all([
    repo.getDashboardStats(),
    repo.listBranches({ includeInactive: true }),
    repo.listDeliveryLinks({ includeInactive: true }),
    repo.listMenuItems({ includeArchived: false }),
  ]);
  const scope = user.role === "branch_editor" ? user.branch_ids : undefined;
  const pending = scope ? (await repo.listFeedback({ status: "pending", branchScope: scope })).length : stats.pendingFeedback;

  const todo = [
    branches.some((b) => !b.is_verified) && { text: "Confirm branch details (some are unverified)", href: "/admin/branches" },
    items.some((i) => i.is_sample) && { text: `Replace ${items.filter((i) => i.is_sample).length} sample dishes with the real menu`, href: "/admin/menu" },
    items.some((i) => !i.allergens_verified) && { text: "Add verified allergen information", href: "/admin/menu" },
    delivery.length === 0 && { text: "Add delivery platform links", href: "/admin/delivery" },
    !branches.some((b) => b.google_review_url) && { text: "Add Google review links for each branch", href: "/admin/branches" },
  ].filter(Boolean) as { text: string; href: string }[];

  return (
    <>
      <PageTitle title="Overview" description={`Signed in as ${user.display_name ?? user.email}.`} />
      {denied && (
        <div className="mb-6"><Alert tone="warning" title="That page is for owners and admins only." /></div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active menu items" value={stats.activeMenuItems} context="Available and not archived" />
        <MetricCard label="Active branches" value={stats.activeBranches} context="Shown on the website" />
        <MetricCard label="Pending feedback" value={pending} context="Waiting for review" />
        <MetricCard label="New enquiries" value={stats.newEnquiries} context="From the contact form" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Recently updated dishes">
          {stats.recentlyUpdated.length ? (
            <ul className="divide-y divide-[var(--border)]">
              {stats.recentlyUpdated.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 py-3 text-[length:var(--text-sm)]">
                  {isAdminRole(user) ? <Link href={`/admin/menu/${m.id}`} className="hover:underline">{m.name}</Link> : <span>{m.name}</span>}
                  <span className="shrink-0 text-[var(--text-muted)]">{formatDateTime(m.updated_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">No dishes yet.</p>
          )}
        </Panel>

        <Panel title="Before launch" description="Items that still need real business information.">
          {todo.length ? (
            <ul className="grid gap-2">
              {todo.map((t) => (
                <li key={t.text} className="flex items-center justify-between gap-3 text-[length:var(--text-sm)]">
                  <span className="flex items-center gap-2"><Badge size="sm" tone="warning">To do</Badge>{t.text}</span>
                  <Link href={t.href} className="shrink-0 text-[var(--accent)] hover:underline">Open</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">Everything on the launch list is done.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
