import Link from "next/link";

/**
 * PLACEHOLDER WORDMARK. The real MADNESS logo is a magenta neon script (see
 * the Instagram profile). When the official file is available, put it in
 * /public/brand/ and render it here with next/image; nothing else changes.
 */
export function Logo({ className = "", onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className={`focus-ring group inline-flex items-baseline rounded-md ${className}`} aria-label="MADNESS home">
      <span className="display text-[2rem] leading-none tracking-[0.06em] text-cream transition-colors group-hover:text-white">
        MAD<span className="text-red">NESS</span>
      </span>
      <span aria-hidden className="ml-1 inline-block size-2 rounded-full bg-gold" />
    </Link>
  );
}
