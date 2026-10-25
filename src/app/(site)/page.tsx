import { MessageSquareQuote, Star } from "lucide-react";
import { Instagram } from "@/components/site/instagram-icon";
import Image from "next/image";
import Link from "next/link";
import { BranchCard } from "@/components/site/branch-card";
import { DeliverySection } from "@/components/site/delivery-section";
import { DishCard } from "@/components/site/dish-card";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { HeroCarousel } from "@/components/site/hero-carousel";
import { Reveal } from "@/components/site/reveal";
import { ReviewCard } from "@/components/site/review-card";
import { ExternalIcon, ExternalLink, PublicEmptyState, SectionHeading } from "@/components/site/ui";
import { siteConfig } from "@/config/site";
import { getPublicRepo } from "@/lib/data";
import { resolveMenu } from "@/lib/menu";
import { RestaurantJsonLd } from "@/components/site/json-ld";

export const revalidate = 60;

export default async function HomePage() {
  const repo = getPublicRepo();
  const [settings, slides, categories, items, branches, delivery, reviews, gallery] = await Promise.all([
    repo.getSettings(),
    repo.listHeroSlides(),
    repo.listCategories(),
    repo.listMenuItems(),
    repo.listBranches(),
    repo.listDeliveryLinks(),
    repo.listPublishedReviews(6),
    repo.listGallery("home"),
  ]);

  const featured = resolveMenu(items, categories, [])
    .filter((m) => m.is_featured)
    .slice(0, 6);
  const googleReviewsUrl = settings.google_reviews_url ?? branches.find((b) => b.google_review_url)?.google_review_url ?? null;
  const instagram = settings.instagram_url ?? siteConfig.instagramUrl;

  return (
    <>
      <RestaurantJsonLd settings={settings} branches={branches} />

      {/* B. Hero */}
      {slides.length ? (
        <HeroCarousel slides={slides} />
      ) : (
        <section className="halftone flex min-h-[70svh] items-end bg-charcoal pb-20 pt-40">
          <div className="container-page">
            <h1 className="display text-display-xl">Welcome to the madness.</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">Unleash your appetite. Discover a different kind of dining experience.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/menu" className="btn btn-primary">Explore the menu</Link>
              <Link href="#order" className="btn btn-outline">Order now</Link>
            </div>
          </div>
        </section>
      )}

      {/* Category marquee */}
      {categories.length > 0 && (
        <div aria-hidden className="overflow-hidden border-y-2 border-black bg-gold py-3 text-obsidian">
          <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex gap-8">
                {[...categories, ...categories].map((c, i) => (
                  <span key={`${dup}-${i}`} className="display flex items-center gap-8 text-3xl">
                    {c.name}
                    <Star className="size-5 fill-red text-red" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* C. Delivery */}
      <DeliverySection links={delivery} branches={branches} />

      {/* D. Featured dishes */}
      <section aria-labelledby="featured-title" className="section">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading id="featured-title" title="The stars of the show." intro="A few of the plates people come back for." />
            <Link href="/menu" className="btn btn-outline hidden sm:inline-flex">Discover the full menu</Link>
          </div>
          {featured.length ? (
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((item, i) => (
                <li key={item.id}>
                  <Reveal delay={(i % 3) * 0.08} className="h-full">
                    <DishCard item={item} />
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-12">
              <PublicEmptyState title="Featured dishes coming soon">Our team is picking the stars of the show.</PublicEmptyState>
            </div>
          )}
          <div className="mt-10 text-center sm:hidden">
            <Link href="/menu" className="btn btn-primary w-full">Discover the full menu</Link>
          </div>
        </div>
      </section>

      {/* E. About */}
      <section aria-labelledby="about-title" className="on-light bg-cream text-obsidian">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[22rem] lg:min-h-[40rem]">
            {settings.home_about_image && (
              <Image src={settings.home_about_image} alt="A masked MADNESS chef presenting a dish under magenta neon" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            )}
            <div aria-hidden className="burst absolute -bottom-10 right-8 hidden size-36 items-center justify-center bg-red p-6 text-center lg:flex">
              <span className="display rotate-[-8deg] text-2xl leading-none text-white">Come hungry!</span>
            </div>
          </div>
          <div className="halftone-dark flex items-center px-4 py-16 sm:px-10 lg:px-16 lg:py-24">
            <Reveal className="max-w-xl">
              <h2 id="about-title" className="display text-display-lg text-obsidian">{settings.home_about_heading}</h2>
              <p className="mt-6 text-lg leading-relaxed text-[#3d3a36]">{settings.home_about_body}</p>
              <Link href="/about" className="btn btn-dark mt-8">Our story</Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* F. Reviews */}
      <section aria-labelledby="reviews-title" className="section halftone relative">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading id="reviews-title" title="What our customers say." />
            <div className="flex flex-wrap gap-3">
              <Link href="/reviews#leave-review" className="btn btn-primary">Leave your review</Link>
              {googleReviewsUrl && (
                <ExternalLink href={googleReviewsUrl} className="btn btn-outline">
                  Review us on Google <ExternalIcon />
                </ExternalLink>
              )}
            </div>
          </div>
          {reviews.length ? (
            <ul className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <li key={r.id}><ReviewCard review={r} /></li>
              ))}
            </ul>
          ) : (
            <div className="mt-12">
              <PublicEmptyState
                icon={<MessageSquareQuote className="size-12" aria-hidden />}
                title="Be the first to review us"
                action={<Link href="/reviews#leave-review" className="btn btn-gold">Leave your review</Link>}
              >
                Reviews appear here once our team has read and approved them.
              </PublicEmptyState>
            </div>
          )}
        </div>
      </section>

      {/* G. Locations */}
      <section aria-labelledby="locations-title" className="section border-t border-line bg-charcoal">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading id="locations-title" title="Find your madness." intro="Walk in, sit down, and let the show begin." />
            <Link href="/locations" className="btn btn-outline">All locations</Link>
          </div>
          {branches.length ? (
            <ul className="mt-12 grid gap-6 lg:grid-cols-2">
              {branches.map((b) => (
                <li key={b.id}><BranchCard branch={b} delivery={delivery} /></li>
              ))}
            </ul>
          ) : (
            <div className="mt-12">
              <PublicEmptyState title="Locations coming soon">Branch details will appear here once confirmed.</PublicEmptyState>
            </div>
          )}
        </div>
      </section>

      {/* H. Instagram gallery */}
      {gallery.length > 0 && (
        <section aria-labelledby="gallery-title" className="section">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading id="gallery-title" title={<>Follow the <span className="neon-text">madness</span></>} intro="Behind the masks, under the neon." />
              <ExternalLink href={instagram} className="btn btn-gold">
                <Instagram aria-hidden className="size-5" /> @madness.uae
              </ExternalLink>
            </div>
            <div className="mt-12">
              <GalleryGrid images={gallery.slice(0, 8)} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
