import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { isSupabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Image storage abstraction.
 *  - Supabase mode: uploads to the public "media" bucket with the signed-in
 *    user's session (storage RLS allows staff only).
 *  - Demo mode: writes to /public/uploads for local development.
 * Files are checked by their actual bytes, not just the browser-supplied type.
 */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const BUCKET = "media";

const SIGNATURES: { ext: string; mime: string; test: (b: Uint8Array) => boolean }[] = [
  { ext: "jpg", mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { ext: "webp", mime: "image/webp", test: (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP" },
  { ext: "avif", mime: "image/avif", test: (b) => String.fromCharCode(...b.slice(4, 12)).startsWith("ftypavi") },
];

export class UploadError extends Error {}

export function hasFile(v: FormDataEntryValue | null): v is File {
  return typeof v === "object" && v !== null && "size" in v && v.size > 0;
}

/** Validates and stores an image. Returns the public URL to save in the database. */
export async function uploadImage(file: File, folder: "menu" | "branches" | "hero" | "gallery" | "content"): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError("Images must be 5 MB or smaller");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = SIGNATURES.find((s) => s.test(bytes));
  if (!kind) throw new UploadError("Upload a JPG, PNG, WebP or AVIF image");

  // Safe, unguessable file name: never trust the user's file name.
  const name = `${folder}/${new Date().toISOString().slice(0, 10)}-${randomUUID()}.${kind.ext}`;

  if (isSupabaseConfigured()) {
    const supabase = await createSessionClient();
    const { error } = await supabase.storage.from(BUCKET).upload(name, bytes, { contentType: kind.mime, cacheControl: "31536000", upsert: false });
    if (error) throw new UploadError("Upload failed. Check that you have permission to upload images.");
    return supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(process.cwd(), "public", "uploads", name), bytes);
  } catch {
    throw new UploadError("Uploads need Supabase Storage on this host. Paste an image URL instead.");
  }
  return `/uploads/${name}`;
}

/** Best-effort removal of an image this app uploaded. Never touches seed images. */
export async function deleteImage(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    if (isSupabaseConfigured()) {
      const marker = `/storage/v1/object/public/${BUCKET}/`;
      const i = url.indexOf(marker);
      if (i === -1) return;
      const supabase = await createSessionClient();
      await supabase.storage.from(BUCKET).remove([decodeURIComponent(url.slice(i + marker.length))]);
      return;
    }
    if (url.startsWith("/uploads/") && !url.includes("..")) {
      await unlink(path.join(process.cwd(), "public", url));
    }
  } catch {
    // Orphaned files are harmless; ignore.
  }
}
