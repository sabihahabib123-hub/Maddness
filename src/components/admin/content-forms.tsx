"use client";

import { saveGalleryImage, saveHeroSlide, saveHomeContent, saveSettings } from "@/app/admin/actions/content";
import { Switch } from "@/components/arc/switch/switch";
import type { GalleryImage, HeroSlide, SiteSettings } from "@/lib/types";
import { ActionForm, NativeSelect, SubmitButton, TextAreaField, TextField } from "./action-form";
import { ImageField } from "./image-field";

export function HeroSlideForm({ slide, nextOrder }: { slide?: HeroSlide; nextOrder?: number }) {
  return (
    <ActionForm action={saveHeroSlide} encType="multipart/form-data" resetOnSuccess={!slide} className="grid gap-4">
      {slide && <input type="hidden" name="id" value={slide.id} />}
      <ImageField defaultValue={slide?.image_url} label="Slide image" />
      <TextField label="Image description (alt text)" name="image_alt" required maxLength={200} defaultValue={slide?.image_alt ?? ""} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Heading" name="heading" required maxLength={80} defaultValue={slide?.heading ?? "Welcome to the madness."} />
        <TextField label="Supporting text" name="subheading" maxLength={200} defaultValue={slide?.subheading ?? "Unleash your appetite. Discover a different kind of dining experience."} />
        <TextField label="Main button label" name="primary_label" maxLength={40} defaultValue={slide?.primary_label ?? "Explore the menu"} />
        <TextField label="Main button link" name="primary_href" maxLength={300} defaultValue={slide?.primary_href ?? "/menu"} />
        <TextField label="Second button label" name="secondary_label" maxLength={40} defaultValue={slide?.secondary_label ?? "Order now"} />
        <TextField label="Second button link" name="secondary_href" maxLength={300} defaultValue={slide?.secondary_href ?? "/#order"} />
        <TextField label="Display order" name="display_order" type="number" min="0" defaultValue={slide?.display_order ?? nextOrder ?? 0} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Switch name="is_active" label="Show in the carousel" defaultChecked={slide?.is_active ?? true} />
        <SubmitButton variant={slide ? "secondary" : "primary"}>{slide ? "Save slide" : "Add slide"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function GalleryImageForm({ image, nextOrder }: { image?: GalleryImage; nextOrder?: number }) {
  return (
    <ActionForm action={saveGalleryImage} encType="multipart/form-data" resetOnSuccess={!image} className="grid gap-4">
      {image && <input type="hidden" name="id" value={image.id} />}
      <ImageField defaultValue={image?.image_url} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Image description (alt text)" name="alt" required maxLength={200} defaultValue={image?.alt ?? ""} />
        <TextField label="Caption" name="caption" maxLength={200} defaultValue={image?.caption ?? ""} description="Optional, shown over the photo." />
        <NativeSelect label="Where it appears" name="placement" defaultValue={image?.placement ?? "home"} options={[{ value: "home", label: "Home page (Instagram gallery)" }, { value: "about", label: "About page" }]} />
        <TextField label="Display order" name="display_order" type="number" min="0" defaultValue={image?.display_order ?? nextOrder ?? 0} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Switch name="is_active" label="Visible" defaultChecked={image?.is_active ?? true} />
        <SubmitButton variant={image ? "secondary" : "primary"}>{image ? "Save photo" : "Add photo"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function HomeContentForm({ settings }: { settings: SiteSettings }) {
  return (
    <ActionForm action={saveHomeContent} encType="multipart/form-data" className="grid gap-5">
      <h3 className="text-[length:var(--text-base)] font-medium">Home page: about section</h3>
      <TextField label="Heading" name="home_about_heading" required maxLength={120} defaultValue={settings.home_about_heading} />
      <TextAreaField label="Text" name="home_about_body" rows={4} maxLength={1200} defaultValue={settings.home_about_body} />
      <ImageField name="home_about_image" label="Photo" defaultValue={settings.home_about_image} />
      <h3 className="mt-4 text-[length:var(--text-base)] font-medium">About page</h3>
      <TextAreaField label="Introduction" name="about_intro" rows={2} maxLength={600} defaultValue={settings.about_intro} />
      <TextAreaField label="Our story" name="about_story" rows={5} maxLength={3000} defaultValue={settings.about_story} description="Only facts supplied by the restaurant: founding, people, history." />
      <TextAreaField label="Food philosophy" name="about_philosophy" rows={4} maxLength={3000} defaultValue={settings.about_philosophy} />
      <TextAreaField label="The atmosphere" name="about_atmosphere" rows={4} maxLength={3000} defaultValue={settings.about_atmosphere} />
      <div className="flex justify-end"><SubmitButton>Save page copy</SubmitButton></div>
    </ActionForm>
  );
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  return (
    <ActionForm action={saveSettings} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Site name" name="site_name" required maxLength={60} defaultValue={settings.site_name} />
        <TextField label="Tagline" name="tagline" maxLength={120} defaultValue={settings.tagline} />
      </div>
      <TextAreaField label="Footer description" name="footer_blurb" rows={2} maxLength={300} defaultValue={settings.footer_blurb} />
      <h3 className="mt-2 text-[length:var(--text-base)] font-medium">Social and review links</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Instagram" name="instagram_url" type="url" maxLength={500} defaultValue={settings.instagram_url ?? ""} />
        <TextField label="TikTok" name="tiktok_url" type="url" maxLength={500} defaultValue={settings.tiktok_url ?? ""} />
        <TextField label="Facebook" name="facebook_url" type="url" maxLength={500} defaultValue={settings.facebook_url ?? ""} />
        <TextField label="Brand-wide Google reviews link" name="google_reviews_url" type="url" maxLength={500} defaultValue={settings.google_reviews_url ?? ""} description="Optional. Branch links are set on each branch." />
      </div>
      <h3 className="mt-2 text-[length:var(--text-base)] font-medium">General contact</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Contact email" name="contact_email" type="email" maxLength={254} defaultValue={settings.contact_email ?? ""} />
        <TextField label="Contact phone" name="contact_phone" type="tel" maxLength={40} defaultValue={settings.contact_phone ?? ""} />
      </div>
      <Switch name="show_sample_notice" label="Show the ‘sample content’ notice on the website" defaultChecked={settings.show_sample_notice} />
      <div className="flex justify-end"><SubmitButton>Save settings</SubmitButton></div>
    </ActionForm>
  );
}
