"use client";

import { Star } from "lucide-react";
import { useId, useState } from "react";

const WORDS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

/**
 * Star rating built on native radio buttons: arrow keys move between stars,
 * and screen readers announce "4 stars, Great".
 */
export function StarInput({
  label,
  name,
  value,
  onChange,
  required,
  error,
  optional,
}: {
  label: string;
  name: string;
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  required?: boolean;
  error?: string;
  optional?: boolean;
}) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  return (
    <fieldset aria-describedby={error ? `${id}-err` : undefined} aria-invalid={Boolean(error)} aria-required={required}>
      <legend className="label">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </legend>
      <div className="flex items-center gap-3">
        <div className="flex" onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer p-1" onMouseEnter={() => setHover(n)}>
              <input
                type="radio"
                name={name}
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                className="peer sr-only"
              />
              <Star
                aria-hidden
                className={`size-8 transition-transform peer-focus-visible:scale-110 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold ${
                  n <= shown ? "fill-gold text-gold" : "fill-transparent text-[#5a5a5a]"
                }`}
              />
              <span className="sr-only">{`${n} star${n > 1 ? "s" : ""}, ${WORDS[n]}`}</span>
            </label>
          ))}
        </div>
        <span className="min-w-20 text-sm font-semibold text-muted" aria-hidden>{shown ? WORDS[shown] : ""}</span>
        {optional && value ? (
          <button type="button" onClick={() => onChange(null)} className="focus-ring rounded text-xs text-muted underline hover:text-cream">
            Clear
          </button>
        ) : null}
      </div>
      {error && <p id={`${id}-err`} className="error-text">{error}</p>}
    </fieldset>
  );
}
