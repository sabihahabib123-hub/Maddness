import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { Reveal } from "@/components/site/reveal";
import { getPublicRepo } from "@/lib/data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About us",
  description: "Masked chefs, neon on every wall and food that arrives with a show. Meet MADNESS.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const repo = getPublicRepo();
  const [settings, gallery] = await Promise.all([repo.getSettings(), repo.listGallery("about")]);

  const blocks = [
    { title: "Our story", body: settings.about_story, image: "/images/interior-joker-mural.webp", alt: "Painted villain mural above red tufted booths" },
    { title: "Food philosophy", body: settings.about_philosophy, image: "/images/hot-stone-wagyu.webp", alt: "Beef searing on a smoking hot stone" },
    { title: "The atmosphere", body: settings.about_atmosphere, image: "/images/interior-madness-vibes.webp", alt: "Purple neon sign reading Madness Vibes" },
  ];

  return (
    <>
      <section className="relative isolate flex min-h-[80svh] items-end overflow-hidden pb-16 pt-36">
        <Image src="/images/chef-smoking-dish.webp" alt="" fill priority sizes="100vw" className="-z-10 object-cover object-top" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-obsidian via-obsidian/60 to-black/30" />
        <div aria-hidden className="halftone absolute inset-0 -z-10 opacity-40 mix-blend-overlay" />
        <div className="container-page">
          <h1 className="display max-w-4xl text-display-xl text-white [text-shadow:4px_4px_0_#000]">Not just a meal. An experience.</h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-cream/90">{settings.about_intro}</p>
        </div>
      </section>

      <div className="section space-y-24 sm:space-y-32">
        {blocks.map((b, i) => (
          <section key={b.title} aria-labelledby={`about-${i}`} className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal className={i % 2 ? "lg:order-2" : ""}>
              <div className="panel relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] sm:aspect-[4/3] lg:aspect-[4/5]">
                <Image src={b.image} alt={b.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <span aria-hidden className="display text-7xl text-red">0{i + 1}</span>
              <h2 id={`about-${i}`} className="display mt-2 text-display-md">{b.title}</h2>
              <p className="mt-5 max-w-prose text-lg leading-relaxed text-cream/80">{b.body}</p>
            </Reveal>
          </section>
        ))}
      </div>

      {gallery.length > 0 && (
        <section aria-labelledby="about-gallery" className="section border-t border-line bg-charcoal">
          <div className="container-page">
            <h2 id="about-gallery" className="display text-display-md">Inside MADNESS</h2>
            <div className="mt-10"><GalleryGrid images={gallery} /></div>
          </div>
        </section>
      )}

      <section className="section bg-red text-white">
        <div className="halftone-dark container-page flex flex-col items-start justify-between gap-8 rounded-[var(--radius-card)] lg:flex-row lg:items-center">
          <h2 className="display text-display-md [text-shadow:3px_3px_0_#000]">Ready to lose your mind (a little)?</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/menu" className="btn btn-dark">See the menu</Link>
            <Link href="/locations" className="btn btn-outline">Find a branch</Link>
          </div>
        </div>
      </section>
    </>
  );
}
