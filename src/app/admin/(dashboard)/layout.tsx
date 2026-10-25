import { AdminShell } from "@/components/admin/admin-shell";
import { requireStaffPage } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";
import { getDataMode } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaffPage();
  const repo = await getAdminRepo();
  const scope = user.role === "branch_editor" ? user.branch_ids : undefined;
  const pending = (await repo.listFeedback({ status: "pending", branchScope: scope })).length;

  return (
    <AdminShell user={{ name: user.display_name ?? user.email, role: user.role }} mode={getDataMode()} pendingCount={pending}>
      {children}
    </AdminShell>
  );
}
