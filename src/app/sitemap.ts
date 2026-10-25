import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getPublicRepo } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repo = getPublicRepo();
  const [items, branches] = await Promise.all([repo.listMenuItems(), repo.listBranches()]);
  const now = new Date();
  const staticRoutes = ["", "/menu", "/about", "/locations", "/reviews", "/contact", "/privacy", "/terms"].map((p) => ({
    url: `${siteConfig.url}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  return [
    ...staticRoutes,
    ...items.map((i) => ({ url: `${siteConfig.url}/menu/${i.slug}`, lastModified: new Date(i.updated_at), priority: 0.6 })),
    ...branches.map((b) => ({ url: `${siteConfig.url}/locations/${b.slug}`, lastModified: new Date(b.updated_at), priority: 0.8 })),
  ];
}
