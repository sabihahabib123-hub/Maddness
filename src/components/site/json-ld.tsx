import { siteConfig } from "@/config/site";
import { WEEKDAYS } from "@/lib/format";
import type { Branch, MenuItem, SiteSettings } from "@/lib/types";

function Script({ data }: { data: unknown }) {
  // JSON.stringify output is escaped for "<" so it cannot close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/**
 * Structured data uses ONLY verified facts: unverified branches are left out,
 * and no ratings or reviews are ever included.
 */
export function branchJsonLd(b: Branch) {
  return {
    "@type": "Restaurant",
    "@id": `${siteConfig.url}/locations/${b.slug}#restaurant`,
    name: b.name,
    url: `${siteConfig.url}/locations/${b.slug}`,
    ...(b.image_url ? { image: new URL(b.image_url, siteConfig.url).toString() } : {}),
    address: { "@type": "PostalAddress", streetAddress: b.address, addressLocality: b.city, addressCountry: "AE" },
    ...(b.phone ? { telephone: b.phone } : {}),
    ...(b.latitude !== null && b.longitude !== null ? { geo: { "@type": "GeoCoordinates", latitude: b.latitude, longitude: b.longitude } } : {}),
    ...(b.opening_hours.length
      ? {
          openingHoursSpecification: b.opening_hours
            .filter((h) => h.opens && h.closes)
            .map((h) => ({
              "@type": "OpeningHoursSpecification",
              dayOfWeek: `https://schema.org/${WEEKDAYS.find((d) => d.key === h.day)!.schema}`,
              opens: h.opens,
              closes: h.closes,
            })),
        }
      : {}),
    menu: `${siteConfig.url}/menu?branch=${b.slug}`,
    currenciesAccepted: "AED",
  };
}

export function RestaurantJsonLd({ settings, branches }: { settings: SiteSettings; branches: Branch[] }) {
  const verified = branches.filter((b) => b.is_verified);
  const sameAs = [settings.instagram_url, settings.facebook_url, settings.tiktok_url].filter(Boolean);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${siteConfig.url}#org`, name: settings.site_name, url: siteConfig.url, ...(sameAs.length ? { sameAs } : {}) },
      ...verified.map((b) => ({ ...branchJsonLd(b), parentOrganization: { "@id": `${siteConfig.url}#org` } })),
    ],
  };
  return <Script data={data} />;
}

export function BranchJsonLd({ branch }: { branch: Branch }) {
  if (!branch.is_verified) return null;
  return <Script data={{ "@context": "https://schema.org", ...branchJsonLd(branch) }} />;
}

export function DishJsonLd({ item }: { item: MenuItem }) {
  if (item.is_sample) return null;
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "MenuItem",
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        ...(item.image_url ? { image: new URL(item.image_url, siteConfig.url).toString() } : {}),
        offers: { "@type": "Offer", price: item.price.toFixed(2), priceCurrency: "AED" },
      }}
    />
  );
}
