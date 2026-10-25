import { PageTitle } from "@/components/admin/admin-shell";
import { BranchForm } from "@/components/admin/branch-form";
import { requireAdminPage } from "@/lib/auth/session";

export const metadata = { title: "New branch" };

export default async function NewBranchPage() {
  await requireAdminPage();
  return (
    <>
      <PageTitle title="New branch" />
      <BranchForm canEditStatus />
    </>
  );
}
