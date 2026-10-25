import { Panel, PageTitle } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/content-forms";
import { requireAdminPage } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";
import { getDataMode } from "@/lib/env";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireAdminPage();
  const settings = await (await getAdminRepo()).getSettings();
  const mode = getDataMode();

  return (
    <>
      <PageTitle title="Settings" description="Brand details, social links and site-wide options." />
      <div className="grid gap-6">
        <Panel>
          <SettingsForm settings={settings} />
        </Panel>
        <Panel title="Staff accounts" description="Who can sign in to this dashboard.">
          {mode === "supabase" ? (
            <div className="grid gap-2 text-[length:var(--text-sm)] text-[var(--text-secondary)]">
              <p>
                Staff accounts are created in Supabase (Authentication, Users), then given a role in the <code>admin_users</code> table:
                <strong className="text-[var(--foreground)]"> owner</strong>, <strong className="text-[var(--foreground)]">admin</strong> or{" "}
                <strong className="text-[var(--foreground)]">branch_editor</strong>. Branch editors are linked to branches in <code>admin_branch_access</code>.
              </p>
              <p>You are signed in as a{user.role === "owner" ? "n owner" : "n admin"}. The README has the exact SQL.</p>
            </div>
          ) : (
            <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
              Demo mode has one local owner account. Connect Supabase to add real staff accounts with roles.
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
