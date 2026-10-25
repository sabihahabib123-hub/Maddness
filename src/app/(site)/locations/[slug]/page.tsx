import { ArrowLeft, Clock, Mail, MapPin, Phone, ShoppingBag, Star, UtensilsCrossed } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BranchHours } from "@/components/site/branch-card";
import { DishCard } from "@/components/site/dish-card";
import { BranchJsonLd } from "@/components/site/json-ld";
import { ExternalIcon, ExternalLink, Pill } from "@/components/site/ui";
import { deliveryPlatformMeta } from "@/config/site";
import { getPublicRepo } from "@/lib/data";
import { directionsHref, telHref } from "@/lib/format";
import { resolveMenu } from "@/lib/menu";

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const branches = await getPublicRepo().listBranches();
  return branches.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const branch = await getPublicRepo().getBranchBySlug(slug);
  if (!branch) return { title: "Branch not found" };
  return {
    title: branch.name,
    description: `${branch.name}: ${branch.address}. Opening hours, phone, directions and the branch menu.`,
    alternates: { canonical: `/locations/${branch.slug}` },
    openGraph: branch.image_url ? { images: [{ url: branch.image_url, alt: `Inside ${branch.name}` }] } : undefined,
  };
}

export default async function BranchPage({ params }: { params: Params }) {
  const { slug } = await params;
  const repo = getPublicRepo();
  const branch = await repo.getBranchBySlug(slug);
  if (!branch) notFound();

  const [delivery, categories, items, overrides] = await Promise.all([
    repo.listDeliveryLinks(),
    repo.listCategories(),
    repo.listMenuItems(),
    repo.listBranchMenuItems({ branchId: branch.id }),
  ]);
  const branchLinks = delivery.filter((d) => d.branch_id === branch.id);
  const featured = resolveMenu(items, categories, overrides, branch.id)
    .filter((m) => m.is_featured && m.effective_available)
    .slice(0, 3);

  return (
    <>
      <BranchJsonLd branch={branch} />
      <section className="relative isolate flex min-h-[60svh] items-end overflow-hidden pb-14 pt-36">
        {branch.image_url && <Image src={branch.image_url} alt="" fill priority sizes="100vw" className="-z-10 object-cover" />}
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-obsidian via-obsidian/70 to-black/40" />
        <div className="container-page">
          <Link href="/locations" className="focus-ring inline-flex items-center gap-2 rounded text-sm font-semibold text-cream/80 hover:text-cream">
            <ArrowLeft aria-hidden className="size-4" /> All locations
          </Link>
          <h1 className="display mt-4 text-display-lg text-white [text-shadow:4px_4px_0_#000]">{branch.name}</h1>
          {!branch.is_verified && (
            <div className="mt-4"><Pill tone="gold">Details being confirmed. Please call ahead.</Pill></div>
          )}
        </div>
      </section>

      <section className="section pt-10">
        <div className="container-page grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <dl className="grid gap-6 rounded-[var(--radius-card)] border border-line bg-charcoal p-6 sm:p-8">
            <div className="flex gap-4">
              <dt><MapPin aria-label="Address" className="size-6 text-red" /></dt>
              <dd className="text-lg text-cream">{branch.address}</dd>
            </div>
            <div className="flex gap-4">
              <dt><Clock aria-label="Opening hours" className="size-6 text-red" /></dt>
              <dd className="text-lg text-muted"><BranchHours branch={branch} /></dd>
            </div>
            {branch.phone && (
              <div className="flex gap-4">
                <dt><Phone aria-label="Phone" className="size-6 text-red" /></dt>
                <dd><a href={telHref(branch.phone)} className="focus-ring rounded text-lg font-bold text-cream hover:underline">{branch.phone}</a></dd>
              </div>
            )}
            {branch.email && (
              <div className="flex gap-4">
                <dt><Mail aria-label="Email" className="size-6 text-red" /></dt>
                <dd><a href={`mailto:${branch.email}`} className="focus-ring rounded text-lg text-cream hover:underline">{branch.email}</a></dd>
              </div>
            )}
          </dl>

          <div className="grid content-start gap-3">
            <ExternalLink href={directionsHref(branch)} className="btn btn-primary w-full">
              <MapPin aria-hidden className="size-5" /> Get directions <ExternalIcon />
            </ExternalLink>
            <Link href={`/menu?branch=${branch.slug}`} className="btn btn-outline w-full">
              <UtensilsCrossed aria-hidden className="size-5" /> View this branch&apos;s menu
            </Link>
            {branchLinks.map((l) => (
              <ExternalLink key={l.id} href={l.url} className="btn btn-gold w-full">
                <ShoppingBag aria-hidden className="size-5" /> Order on {l.label || deliveryPlatformMeta[l.platform]?.name} <ExternalIcon />
              </ExternalLink>
            ))}
            {branch.google_review_url && (
              <ExternalLink href={branch.google_review_url} className="btn btn-outline w-full">
                <Star aria-hidden className="size-5" /> Review us on Google <ExternalIcon />
              </ExternalLink>
            )}
            <Link href="/reviews#leave-review" className="focus-ring mt-2 rounded text-center text-sm font-semibold text-muted underline-offset-4 hover:text-cream hover:underline">
              Visited recently? Leave feedback on our website
            </Link>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="branch-featured" className="section border-t border-line bg-charcoal">
          <div className="container-page">
            <h2 id="branch-featured" className="display text-display-md">Favourites at this branch</h2>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((m) => <li key={m.id}><DishCard item={m} branchSlug={branch.slug} /></li>)}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
