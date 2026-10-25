import Link from "next/link";

export default function NotFound() {
  return (
    <section className="halftone flex min-h-[80svh] items-center pt-24">
      <div className="container-page text-center">
        <p aria-hidden className="display text-[clamp(7rem,25vw,16rem)] leading-none text-red [text-shadow:6px_6px_0_#000]">404</p>
        <h1 className="display text-display-md">This page lost its mind.</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">We couldn&apos;t find what you were looking for. It may have moved or never existed.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">Go home</Link>
          <Link href="/menu" className="btn btn-outline">See the menu</Link>
        </div>
      </div>
    </section>
  );
}
