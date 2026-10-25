import Link from "next/link";
import { PageTitle } from "@/components/admin/admin-shell";
import { MenuItemForm } from "@/components/admin/menu-item-form";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { requireAdminPage } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";

export const metadata = { title: "New dish" };

export default async function NewDishPage() {
  await requireAdminPage();
  const categories = await (await getAdminRepo()).listCategories({ includeInactive: true });
  return (
    <>
      <PageTitle title="New dish" />
      {categories.length ? (
        <MenuItemForm categories={categories} />
      ) : (
        <EmptyState
          title="Add a category first"
          description="Every dish belongs to a category."
          action={<Link href="/admin/categories" className="text-[var(--accent)] hover:underline">Go to categories</Link>}
        />
      )}
    </>
  );
}
