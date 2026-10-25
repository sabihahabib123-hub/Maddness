import { MapPinOff } from "lucide-react";
import type { Metadata } from "next";
import { BranchCard } from "@/components/site/branch-card";
import { PageHero, PublicEmptyState } from "@/components/site/ui";
import { getPublicRepo } from "@/lib/data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Locations",
  description: "Find a MADNESS branch near you: addresses, opening hours, phone numbers and directions.",
  alternates: { canonical: "/locations" },
};

export default async function LocationsPage() {
  const repo = getPublicRepo();
  const [branches, delivery] = await Promise.all([repo.listBranches(), repo.listDeliveryLinks()]);
  const anyUnverified = branches.some((b) => !b.is_verified);

  return (
    <>
      <PageHero title="Locations" intro="Pick your branch, grab directions, and come see the show." />
      <section className="section pt-12">
        <div className="container-page">
          {anyUnverified && (
            <p className="mb-8 rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-gold">
              Some branch details are still being confirmed. Please call ahead before visiting.
            </p>
          )}
          {branches.length ? (
            <ul className="grid gap-6 lg:grid-cols-2">
              {branches.map((b) => (
                <li key={b.id}><BranchCard branch={b} delivery={delivery} /></li>
              ))}
            </ul>
          ) : (
            <PublicEmptyState icon={<MapPinOff className="size-12" aria-hidden />} title="Locations coming soon">
              Branch details will be published here once confirmed.
            </PublicEmptyState>
          )}
        </div>
      </section>
    </>
  );
}
