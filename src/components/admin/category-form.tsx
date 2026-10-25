"use client";

import { useState } from "react";
import { saveCategory } from "@/app/admin/actions/categories";
import { Switch } from "@/components/arc/switch/switch";
import { slugify } from "@/lib/format";
import type { MenuCategory } from "@/lib/types";
import { ActionForm, SubmitButton, TextField } from "./action-form";

export function CategoryForm({ category, nextOrder }: { category?: MenuCategory; nextOrder?: number }) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [touched, setTouched] = useState(Boolean(category));
  return (
    <ActionForm action={saveCategory} resetOnSuccess={!category} className="grid gap-4">
      {category && <input type="hidden" name="id" value={category.id} />}
      <input type="hidden" name="display_order" value={category?.display_order ?? nextOrder ?? 0} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" name="name" required maxLength={80} value={name} onChange={(e) => { setName(e.target.value); if (!touched) setSlug(slugify(e.target.value)); }} />
        <TextField label="URL slug" name="slug" required maxLength={80} value={slug} onChange={(e) => { setTouched(true); setSlug(e.target.value); }} />
      </div>
      <TextField label="Description" name="description" maxLength={300} defaultValue={category?.description ?? ""} description="Optional. Shown under the category heading on the menu." />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Switch name="is_active" label="Show on the website" defaultChecked={category?.is_active ?? true} />
        <SubmitButton variant={category ? "secondary" : "primary"}>{category ? "Save category" : "Add category"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
