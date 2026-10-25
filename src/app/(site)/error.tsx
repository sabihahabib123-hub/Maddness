"use client";

import Link from "next/link";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="halftone flex min-h-[70svh] items-center pt-24">
      <div className="container-page text-center" role="alert">
        <h1 className="display text-display-md">Something went sideways.</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">We couldn&apos;t load this page. Please try again in a moment.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">Try again</button>
          <Link href="/" className="btn btn-outline">Go home</Link>
        </div>
      </div>
    </section>
  );
}
