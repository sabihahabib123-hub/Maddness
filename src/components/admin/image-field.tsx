"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useFieldError } from "./action-form";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX = 5 * 1024 * 1024;

/**
 * Upload a new image (validated again on the server) or keep/enter an image
 * path. The current image stays until the form is saved.
 */
export function ImageField({ name = "image_url", label = "Photo", defaultValue }: { name?: string; label?: string; defaultValue?: string | null }) {
  const id = useId();
  const [url, setUrl] = useState(defaultValue ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const serverError = useFieldError(name);
  const error = clientError ?? serverError;

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const shown = preview ?? (url || null);

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1.5 text-[length:var(--text-sm)] font-medium">{label}</legend>
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative flex aspect-[4/3] w-44 items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)]">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus aria-hidden className="size-7 text-[var(--text-muted)]" />
          )}
        </div>
        <div className="grid min-w-56 flex-1 gap-2">
          <label htmlFor={`${id}-file`} className="text-[length:var(--text-xs)] text-[var(--text-secondary)]">
            Upload a JPG, PNG, WebP or AVIF (max 5 MB)
          </label>
          <input
            id={`${id}-file`}
            type="file"
            name={`${name}_file`}
            accept={ACCEPT}
            className="text-[length:var(--text-sm)] file:mr-3 file:rounded-[var(--radius-pill)] file:border-0 file:bg-[var(--surface-muted)] file:px-3 file:py-1.5 file:text-[var(--foreground)]"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setClientError(null);
              if (preview) URL.revokeObjectURL(preview);
              setPreview(null);
              if (!f) return;
              if (!ACCEPT.split(",").includes(f.type)) {
                setClientError("Choose a JPG, PNG, WebP or AVIF image");
                e.target.value = "";
                return;
              }
              if (f.size > MAX) {
                setClientError("That image is larger than 5 MB");
                e.target.value = "";
                return;
              }
              setPreview(URL.createObjectURL(f));
            }}
          />
          <label htmlFor={`${id}-url`} className="mt-1 text-[length:var(--text-xs)] text-[var(--text-secondary)]">Or image path / URL</label>
          <div className="flex gap-2">
            <input
              id={`${id}-url`}
              name={name}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/images/photo.webp"
              className="h-[var(--control-height-sm)] min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[length:var(--text-sm)]"
            />
            {url && (
              <button type="button" onClick={() => setUrl("")} aria-label="Remove image" className="inline-flex size-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-muted)]">
                <X aria-hidden className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      {error && <p role="alert" className="text-[length:var(--text-xs)] text-[var(--danger)]">{error}</p>}
    </fieldset>
  );
}
