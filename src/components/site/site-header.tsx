"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { mainNav } from "@/config/site";
import { Logo } from "./logo";

/**
 * Transparent over the hero on the home page, solid once the user scrolls
 * (and always solid on inner pages). Mobile uses an accessible slide-out panel.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && panelRef.current) {
        const els = panelRef.current.querySelectorAll<HTMLElement>("a,button");
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled || !isHome || open;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        solid ? "border-b border-line/80 bg-obsidian/92 backdrop-blur-md" : "border-b border-transparent bg-gradient-to-b from-black/60 to-transparent"
      }`}
    >
      <a href="#main" className="btn btn-gold btn-sm sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60]">
        Skip to content
      </a>
      <div className="container-page flex h-[4.5rem] items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`focus-ring relative rounded-md px-3.5 py-2 text-[0.9375rem] font-semibold transition-colors ${
                    isActive(item.href) ? "text-white" : "text-cream/75 hover:text-white"
                  }`}
                >
                  {item.label}
                  {isActive(item.href) && <span aria-hidden className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-red" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/#order" className="btn btn-primary btn-sm">
            Order online
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="focus-ring inline-flex size-11 items-center justify-center rounded-lg text-cream hover:bg-white/10 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="halftone fixed inset-x-0 bottom-0 top-[4.5rem] overflow-y-auto bg-obsidian lg:hidden"
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: "100%" }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: "100%" }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <nav aria-label="Mobile" className="container-page flex min-h-full flex-col py-8">
              <ul className="flex flex-col">
                {mainNav.map((item) => (
                  <li key={item.href} className="border-b border-line">
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={`focus-ring display block py-4 text-5xl ${isActive(item.href) ? "text-red" : "text-cream"}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-auto grid gap-3 pt-10">
                <Link href="/#order" onClick={() => setOpen(false)} className="btn btn-primary w-full">
                  Order online
                </Link>
                <Link href="/reviews" onClick={() => setOpen(false)} className="btn btn-outline w-full">
                  Leave a review
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
