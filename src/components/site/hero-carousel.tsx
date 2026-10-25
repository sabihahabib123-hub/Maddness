"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { HeroSlide } from "@/lib/types";

const INTERVAL_MS = 6500;

/**
 * Full-bleed hero. Slides come from the database (Admin, Content).
 * Only the first image is requested up front (priority); every other slide
 * image is mounted just before it is shown, so the page never downloads all
 * full-size images at once.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0]));
  const count = slides.length;

  const go = useCallback(
    (next: number) => {
      const i = (next + count) % count;
      setMounted((m) => (m.has(i) ? m : new Set(m).add(i)));
      setIndex(i);
    },
    [count],
  );

  // Warm up the next slide's image a little before it is needed.
  useEffect(() => {
    if (count < 2) return;
    const t = setTimeout(() => setMounted((m) => (m.has((index + 1) % count) ? m : new Set(m).add((index + 1) % count))), 1500);
    return () => clearTimeout(t);
  }, [index, count]);

  const autoplay = playing && !hovering && !reduce && count > 1;
  useEffect(() => {
    if (!autoplay) return;
    const t = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [autoplay, index, go]);

  if (!count) return null;
  const slide = slides[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured dishes"
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-obsidian"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setHovering(true)}
      onBlurCapture={() => setHovering(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${count}`}
          aria-hidden={i !== index}
          className={`absolute inset-0 -z-10 transition-opacity duration-[1200ms] ease-out ${i === index ? "opacity-100" : "opacity-0"}`}
        >
          {mounted.has(i) && (
            <div key={i === index ? `active-${index}` : "idle"} className={`absolute inset-0 ${i === index && !reduce ? "animate-kenburns" : ""}`}>
              <Image
                src={s.image_url}
                alt={s.image_alt}
                fill
                priority={i === 0}
                fetchPriority={i === 0 ? "high" : "auto"}
                sizes="100vw"
                quality={80}
                className="object-cover"
              />
            </div>
          )}
        </div>
      ))}

      {/* Readability overlays */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-obsidian via-obsidian/55 to-black/40" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
      <div aria-hidden className="halftone absolute inset-0 -z-10 opacity-40 mix-blend-overlay" />

      <div className="container-page relative w-full pb-28 pt-36 sm:pb-32">
        <div className="max-w-4xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slide.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="display text-display-xl text-white [text-shadow:4px_4px_0_#000]">{slide.heading}</h1>
              {slide.subheading && <p className="mt-5 max-w-xl text-lg leading-relaxed text-cream/90 sm:text-xl">{slide.subheading}</p>}
              <div className="mt-8 flex flex-wrap gap-3">
                {slide.primary_label && slide.primary_href && (
                  <Link href={slide.primary_href} className="btn btn-primary">
                    {slide.primary_label}
                  </Link>
                )}
                {slide.secondary_label && slide.secondary_href && (
                  <Link href={slide.secondary_href} className="btn btn-outline">
                    {slide.secondary_label}
                  </Link>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {count > 1 && (
          <div className="absolute inset-x-0 bottom-8 sm:bottom-10">
            <div className="container-page flex items-center justify-between gap-4">
              <div className="flex items-center gap-2" role="group" aria-label="Choose slide">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Show slide ${i + 1}: ${s.heading}`}
                    aria-current={i === index ? "true" : undefined}
                    className="focus-ring group flex h-11 items-center"
                  >
                    <span className={`block h-1.5 rounded-full transition-all duration-500 ${i === index ? "w-12 bg-red" : "w-6 bg-white/40 group-hover:bg-white/70"}`} />
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide" className="focus-ring inline-flex size-11 items-center justify-center rounded-full border border-white/30 text-white backdrop-blur hover:bg-white hover:text-obsidian">
                  <ChevronLeft aria-hidden className="size-5" />
                </button>
                <button type="button" onClick={() => go(index + 1)} aria-label="Next slide" className="focus-ring inline-flex size-11 items-center justify-center rounded-full border border-white/30 text-white backdrop-blur hover:bg-white hover:text-obsidian">
                  <ChevronRight aria-hidden className="size-5" />
                </button>
                {!reduce && (
                  <button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    aria-label={playing ? "Pause slideshow" : "Play slideshow"}
                    className="focus-ring inline-flex size-11 items-center justify-center rounded-full border border-white/30 text-white backdrop-blur hover:bg-white hover:text-obsidian"
                  >
                    {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="sr-only" aria-live={autoplay ? "off" : "polite"} aria-atomic="true">
        Slide {index + 1} of {count}: {slide.heading}
      </p>
    </section>
  );
}
