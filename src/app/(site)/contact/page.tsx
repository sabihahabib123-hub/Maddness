import { Clock, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BranchHours } from "@/components/site/branch-card";
import { ContactForm } from "@/components/site/contact-form";
import { Instagram } from "@/components/site/instagram-icon";
import { ExternalLink, PageHero } from "@/components/site/ui";
import { siteConfig } from "@/config/site";
import { getPublicRepo } from "@/lib/data";
import { telHref } from "@/lib/format";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with MADNESS: branch phone numbers, opening hours and an enquiry form.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const repo = getPublicRepo();
  const [branches, settings] = await Promise.all([repo.listBranches(), repo.getSettings()]);

  return (
    <>
      <PageHero title="Contact us" intro="Questions, group bookings or a message for the team. The quickest way to reach a branch is by phone." />
      <section className="section pt-12">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid content-start gap-6">
            {branches.map((b) => (
              <div key={b.id} className="rounded-[var(--radius-card)] border border-line bg-charcoal p-6">
                <h2 className="display text-3xl">
                  <Link href={`/locations/${b.slug}`} className="focus-ring rounded hover:text-red">{b.name}</Link>
                </h2>
                <ul className="mt-4 grid gap-3 text-[0.9375rem] text-muted">
                  <li className="flex gap-3"><MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-red" />{b.address}</li>
                  <li className="flex gap-3"><Clock aria-hidden className="mt-0.5 size-5 shrink-0 text-red" /><BranchHours branch={b} /></li>
                  {b.phone && (
                    <li className="flex gap-3">
                      <Phone aria-hidden className="mt-0.5 size-5 shrink-0 text-red" />
                      <a href={telHref(b.phone)} className="focus-ring rounded font-bold text-cream hover:underline">{b.phone}</a>
                    </li>
                  )}
                </ul>
              </div>
            ))}
            {settings.contact_email && (
              <p className="text-muted">
                Email: <a className="focus-ring rounded font-semibold text-cream hover:underline" href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
              </p>
            )}
            <ExternalLink href={settings.instagram_url ?? siteConfig.instagramUrl} className="btn btn-outline w-fit">
              <Instagram aria-hidden className="size-5" /> Message us on Instagram
            </ExternalLink>
          </div>

          <div className="relative rounded-[var(--radius-card)] border border-line bg-[#141414] p-5 sm:p-8">
            <h2 className="display mb-6 text-display-sm">Send us a message</h2>
            <ContactForm branches={branches.map((b) => ({ id: b.id, name: b.name }))} />
          </div>
        </div>
      </section>
    </>
  );
}
