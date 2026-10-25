"use client";

import { saveDeliveryLink } from "@/app/admin/actions/delivery";
import { Switch } from "@/components/arc/switch/switch";
import { deliveryPlatformMeta } from "@/config/site";
import { DELIVERY_PLATFORMS, type Branch, type DeliveryLink } from "@/lib/types";
import { ActionForm, NativeSelect, SubmitButton, TextField } from "./action-form";

export function DeliveryLinkForm({ link, branches, allowBrandWide }: { link?: DeliveryLink; branches: Branch[]; allowBrandWide: boolean }) {
  const branchOptions = [
    ...(allowBrandWide ? [{ value: "all", label: "All branches (brand-wide link)" }] : []),
    ...branches.map((b) => ({ value: b.id, label: b.name })),
  ];
  return (
    <ActionForm action={saveDeliveryLink} resetOnSuccess={!link} className="grid gap-4">
      {link && <input type="hidden" name="id" value={link.id} />}
      <div className="grid gap-4 md:grid-cols-2">
        <NativeSelect label="Platform" name="platform" defaultValue={link?.platform ?? "talabat"} options={DELIVERY_PLATFORMS.map((p) => ({ value: p, label: deliveryPlatformMeta[p].name }))} />
        <NativeSelect label="Branch" name="branch_id" defaultValue={link ? link.branch_id ?? "all" : branchOptions[0]?.value} options={branchOptions} />
        <div className="md:col-span-2">
          <TextField
            label="Restaurant page URL"
            name="url"
            type="url"
            required
            maxLength={500}
            placeholder="https://"
            defaultValue={link?.url ?? ""}
            description="Paste the exact MADNESS listing link from the platform. Open it once to check it's the right branch."
          />
        </div>
        <TextField label="Button label" name="label" maxLength={60} defaultValue={link?.label ?? ""} description="Optional. Defaults to the platform name." />
        <TextField label="Display order" name="display_order" type="number" min="0" defaultValue={link?.display_order ?? 0} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Switch name="is_active" label="Show on the website" defaultChecked={link?.is_active ?? true} />
        <SubmitButton variant={link ? "secondary" : "primary"}>{link ? "Save link" : "Add link"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
