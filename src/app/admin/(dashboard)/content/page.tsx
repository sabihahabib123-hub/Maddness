import { ChevronRight } from "lucide-react";
import { deleteGalleryImage, deleteHeroSlide } from "@/app/admin/actions/content";
import { Panel, PageTitle } from "@/components/admin/admin-shell";
import { GalleryImageForm, HeroSlideForm, HomeContentForm } from "@/components/admin/content-forms";
import { ConfirmAction } from "@/components/admin/controls";
import { Badge } from "@/components/arc/badge/badge";
import { requireAdminPage } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";

export const metadata = { title: "Website content" };

function Thumb({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="h-14 w-20 shrink-0 rounded-[var(--radius-control)] object-cover" />;
}

export default async function ContentPage() {
  await requireAdminPage();
  const repo = await getAdminRepo();
  const [slides, gallery, settings] = await Promise.all([
    repo.listHeroSlides({ includeInactive: true }),
    repo.listGallery(undefined, { includeInactive: true }),
    repo.getSettings(),
  ]);

  return (
    <>
      <PageTitle title="Website content" description="Hero slides, home and About page copy, and gallery photos. Use photos you have the right to publish." />
      <div className="grid gap-6">
        <Panel title="Hero slides" description="Four slides work best. The first active slide loads first, so make it your strongest photo.">
          <ul className="grid gap-3">
            {slides.map((s) => (
              <li key={s.id} className="rounded-[var(--radius-control)] border border-[var(--border)]">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
                    <ChevronRight aria-hidden className="size-4 shrink-0 transition-transform group-open:rotate-90" />
                    <Thumb src={s.image_url} />
                    <span className="min-w-0 flex-1 truncate text-[length:var(--text-sm)]">{s.heading}</span>
                    {!s.is_active && <Badge size="sm">Hidden</Badge>}
                    <span className="text-[length:var(--text-xs)] text-[var(--text-muted)]">#{s.display_order}</span>
                  </summary>
                  <div className="grid gap-5 border-t border-[var(--border)] p-4">
                    <HeroSlideForm slide={s} />
                    <ConfirmAction label="Delete slide" prompt="Delete this slide?" onConfirm={deleteHeroSlide.bind(null, s.id)} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
          <details className="group mt-4 rounded-[var(--radius-control)] border border-dashed border-[var(--border-strong)]">
            <summary className="cursor-pointer list-none p-3 text-[length:var(--text-sm)] text-[var(--accent)]">Add a slide</summary>
            <div className="border-t border-[var(--border)] p-4"><HeroSlideForm key={slides.length} nextOrder={slides.length + 1} /></div>
          </details>
        </Panel>

        <Panel title="Page copy">
          <HomeContentForm settings={settings} />
        </Panel>

        <Panel title="Gallery photos" description="Home page photos appear in the Instagram section (8 maximum shown). Upload approved photos; Instagram is not scraped.">
          <ul className="grid gap-3">
            {gallery.map((g) => (
              <li key={g.id} className="rounded-[var(--radius-control)] border border-[var(--border)]">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
                    <ChevronRight aria-hidden className="size-4 shrink-0 transition-transform group-open:rotate-90" />
                    <Thumb src={g.image_url} />
                    <span className="min-w-0 flex-1 truncate text-[length:var(--text-sm)]">{g.alt}</span>
                    <Badge size="sm" tone="info">{g.placement === "home" ? "Home" : "About"}</Badge>
                    {!g.is_active && <Badge size="sm">Hidden</Badge>}
                  </summary>
                  <div className="grid gap-5 border-t border-[var(--border)] p-4">
                    <GalleryImageForm image={g} />
                    <ConfirmAction label="Delete photo" prompt="Delete this photo?" onConfirm={deleteGalleryImage.bind(null, g.id)} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
          <details className="group mt-4 rounded-[var(--radius-control)] border border-dashed border-[var(--border-strong)]">
            <summary className="cursor-pointer list-none p-3 text-[length:var(--text-sm)] text-[var(--accent)]">Add a photo</summary>
            <div className="border-t border-[var(--border)] p-4"><GalleryImageForm key={gallery.length} nextOrder={gallery.length + 1} /></div>
          </details>
        </Panel>
      </div>
    </>
  );
}
