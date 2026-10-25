"use client";

import { useState } from "react";
import { saveMenuItem } from "@/app/admin/actions/menu";
import { Switch } from "@/components/arc/switch/switch";
import { labelise, slugify } from "@/lib/format";
import { ALLERGENS, DIETARY_LABELS, type MenuCategory, type MenuItem } from "@/lib/types";
import { ActionForm, CheckboxField, FieldError, NativeSelect, SubmitButton, TextAreaField, TextField } from "./action-form";
import { Panel } from "./admin-shell";
import { ImageField } from "./image-field";

export function MenuItemForm({ item, categories }: { item?: MenuItem; categories: MenuCategory[] }) {
  const [name, setName] = useState(item?.name ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(item));

  return (
    <ActionForm action={saveMenuItem} encType="multipart/form-data" className="grid gap-6">
      {item && <input type="hidden" name="id" value={item.id} />}

      <Panel title="Basics">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Dish name"
            name="name"
            required
            maxLength={120}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
          <TextField
            label="URL slug"
            name="slug"
            required
            maxLength={80}
            description={`Page address: /menu/${slug || "dish-name"}`}
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
          <NativeSelect
            label="Category"
            name="category_id"
            defaultValue={item?.category_id ?? categories[0]?.id}
            options={categories.map((c) => ({ value: c.id, label: c.is_active ? c.name : `${c.name} (hidden)` }))}
          />
          <TextField label="Price (AED)" name="price" type="number" inputMode="decimal" step="0.01" min="0" required defaultValue={item?.price ?? ""} />
          <div className="md:col-span-2">
            <TextField label="Short description" name="short_description" maxLength={200} description="One line, shown on menu cards." defaultValue={item?.short_description ?? ""} />
          </div>
          <div className="md:col-span-2">
            <TextAreaField label="Full description" name="description" rows={4} maxLength={2000} defaultValue={item?.description ?? ""} />
          </div>
        </div>
      </Panel>

      <Panel title="Photo">
        <div className="grid gap-5">
          <ImageField defaultValue={item?.image_url} />
          <TextField label="Photo description (alt text)" name="image_alt" maxLength={200} description="Describe what's in the photo for people using screen readers." defaultValue={item?.image_alt ?? ""} />
        </div>
      </Panel>

      <Panel title="Ingredients and allergens" description="Only record allergens the kitchen has confirmed. Unverified dishes tell guests to ask staff.">
        <div className="grid gap-6">
          <TextAreaField label="Ingredients" name="ingredients" rows={3} description="One per line or separated by commas." defaultValue={item?.ingredients.join("\n") ?? ""} />
          <fieldset>
            <legend className="mb-2 text-[length:var(--text-sm)] font-medium">Allergens</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ALLERGENS.map((a) => (
                <CheckboxField key={a} name="allergens" value={a} label={labelise(a)} defaultChecked={item?.allergens.includes(a)} />
              ))}
            </div>
            <FieldError name="allergens" />
          </fieldset>
          <CheckboxField name="allergens_verified" label="Allergen information has been verified by the kitchen" defaultChecked={item?.allergens_verified} />
          <fieldset>
            <legend className="mb-2 text-[length:var(--text-sm)] font-medium">Dietary labels (verified only)</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {DIETARY_LABELS.map((d) => (
                <CheckboxField key={d} name="dietary_labels" value={d} label={labelise(d)} defaultChecked={item?.dietary_labels.includes(d)} />
              ))}
            </div>
          </fieldset>
        </div>
      </Panel>

      <Panel title="Visibility">
        <div className="grid gap-4 sm:grid-cols-2">
          <Switch name="is_available" label="Available to order" defaultChecked={item?.is_available ?? true} />
          <Switch name="is_featured" label="Feature on the home page" defaultChecked={item?.is_featured ?? false} />
          <Switch name="is_sample" label="Sample content (shows a Sample badge)" defaultChecked={item?.is_sample ?? false} />
          <TextField label="Display order" name="display_order" type="number" min="0" max="9999" defaultValue={item?.display_order ?? 0} description="Lower numbers appear first within the category." />
        </div>
      </Panel>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <SubmitButton>{item ? "Save dish" : "Create dish"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
