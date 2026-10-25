import Image from "next/image";
import type { GalleryImage } from "@/lib/types";

/** Masonry-ish grid. Images are lazy-loaded and sized per breakpoint. */
export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {images.map((img, i) => (
        <li
          key={img.id}
          className={`group relative overflow-hidden rounded-[var(--radius-card)] bg-ink ${i % 5 === 0 ? "row-span-2 aspect-[3/4] md:aspect-auto" : "aspect-square"}`}
        >
          <Image
            src={img.image_url}
            alt={img.alt}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {img.caption && (
            <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-sm font-semibold text-white">{img.caption}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
