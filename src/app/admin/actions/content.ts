"use server";

import { requireAdmin } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";
import { deleteImage, hasFile, uploadImage } from "@/lib/storage";
import type { ActionResult } from "@/lib/types";
import { fd, galleryImageSchema, heroSlideSchema, homeContentSchema, settingsSchema } from "@/lib/validation/admin";
import { parseOrThrow, run } from "./run";

async function imageFrom(form: FormData, folder: "hero" | "gallery" | "content", field = "image_url") {
  const file = form.get(`${field}_file`) ?? form.get("image_file");
  return hasFile(file) ? uploadImage(file, folder) : fd.str(form, field);
}

export async function saveHeroSlide(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const repo = await getAdminRepo();
    const id = fd.str(form, "id") || null;
    const old = id ? (await repo.listHeroSlides({ includeInactive: true })).find((s) => s.id === id) : null;
    const input = parseOrThrow(heroSlideSchema, {
      image_url: await imageFrom(form, "hero"),
      image_alt: fd.str(form, "image_alt"),
      heading: fd.str(form, "heading"),
      subheading: fd.str(form, "subheading"),
      primary_label: fd.str(form, "primary_label"),
      primary_href: fd.str(form, "primary_href"),
      secondary_label: fd.str(form, "secondary_label"),
      secondary_href: fd.str(form, "secondary_href"),
      display_order: fd.str(form, "display_order") || "0",
      is_active: fd.bool(form, "is_active"),
    });
    await repo.saveHeroSlide(id, { ...input, image_url: input.image_url! });
    if (old && old.image_url !== input.image_url) await deleteImage(old.image_url);
    return { message: id ? "Slide saved" : "Slide added" };
  });
}

export async function deleteHeroSlide(id: string): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const repo = await getAdminRepo();
    const old = (await repo.listHeroSlides({ includeInactive: true })).find((s) => s.id === id);
    await repo.deleteHeroSlide(id);
    await deleteImage(old?.image_url);
    return { message: "Slide deleted" };
  });
}

export async function saveGalleryImage(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const repo = await getAdminRepo();
    const id = fd.str(form, "id") || null;
    const old = id ? (await repo.listGallery(undefined, { includeInactive: true })).find((g) => g.id === id) : null;
    const input = parseOrThrow(galleryImageSchema, {
      image_url: await imageFrom(form, "gallery"),
      alt: fd.str(form, "alt"),
      caption: fd.str(form, "caption"),
      placement: fd.str(form, "placement") || "home",
      display_order: fd.str(form, "display_order") || "0",
      is_active: fd.bool(form, "is_active"),
    });
    await repo.saveGalleryImage(id, { ...input, image_url: input.image_url! });
    if (old && old.image_url !== input.image_url) await deleteImage(old.image_url);
    return { message: id ? "Photo saved" : "Photo added" };
  });
}

export async function deleteGalleryImage(id: string): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const repo = await getAdminRepo();
    const old = (await repo.listGallery(undefined, { includeInactive: true })).find((g) => g.id === id);
    await repo.deleteGalleryImage(id);
    await deleteImage(old?.image_url);
    return { message: "Photo deleted" };
  });
}

export async function saveHomeContent(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const repo = await getAdminRepo();
    const input = parseOrThrow(homeContentSchema, {
      home_about_heading: fd.str(form, "home_about_heading"),
      home_about_body: fd.str(form, "home_about_body"),
      home_about_image: await imageFrom(form, "content", "home_about_image"),
      about_intro: fd.str(form, "about_intro"),
      about_story: fd.str(form, "about_story"),
      about_philosophy: fd.str(form, "about_philosophy"),
      about_atmosphere: fd.str(form, "about_atmosphere"),
    });
    await repo.updateSettings(input);
    return { message: "Page copy saved" };
  });
}

export async function saveSettings(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const repo = await getAdminRepo();
    const input = parseOrThrow(settingsSchema, {
      site_name: fd.str(form, "site_name"),
      tagline: fd.str(form, "tagline"),
      footer_blurb: fd.str(form, "footer_blurb"),
      instagram_url: fd.str(form, "instagram_url"),
      tiktok_url: fd.str(form, "tiktok_url"),
      facebook_url: fd.str(form, "facebook_url"),
      google_reviews_url: fd.str(form, "google_reviews_url"),
      contact_email: fd.str(form, "contact_email"),
      contact_phone: fd.str(form, "contact_phone"),
      show_sample_notice: fd.bool(form, "show_sample_notice"),
    });
    await repo.updateSettings(input);
    return { message: "Settings saved" };
  });
}
