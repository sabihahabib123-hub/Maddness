"use client";

import { useState } from "react";
import { saveBranch } from "@/app/admin/actions/branches";
import { Switch } from "@/components/arc/switch/switch";
import { slugify, WEEKDAYS } from "@/lib/format";
import type { Branch } from "@/lib/types";
import { ActionForm, CheckboxField, FieldError, SubmitButton, TextAreaField, TextField } from "./action-form";
import { Panel } from "./admin-shell";
import { ImageField } from "./image-field";

const timeInput =
  "h-[var(--control-height-sm)] w-28 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] px-2 text-[length:var(--text-sm)] disabled:opacity-40";

export function BranchForm({ branch, canEditStatus }: { branch?: Branch; canEditStatus: boolean }) {
  const [name, setName] = useState(branch?.name ?? "");
  const [slug, setSlug] = useState(branch?.slug ?? "");
  const [touched, setTouched] = useState(Boolean(branch));
  const [hoursOn, setHoursOn] = useState((branch?.opening_hours.length ?? 0) > 0);
  const [closed, setClosed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(WEEKDAYS.map((d) => {
      const h = branch?.opening_hours.find((x) => x.day === d.key);
      return [d.key, Boolean(h && !h.opens)];
    })),
  );

  return (
    <ActionForm action={saveBranch} encType="multipart/form-data" className="grid gap-6">
      {branch && <input type="hidden" name="id" value={branch.id} />}

      <Panel title="Details">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="Branch name" name="name" required maxLength={120} value={name} onChange={(e) => { setName(e.target.value); if (!touched) setSlug(slugify(e.target.value.replace(/^madness\s+/i, ""))); }} />
          <TextField label="URL slug" name="slug" required maxLength={80} value={slug} description={`Page address: /locations/${slug || "branch"}`} onChange={(e) => { setTouched(true); setSlug(e.target.value); }} />
          <div className="md:col-span-2">
            <TextField label="Full address" name="address" required maxLength={300} defaultValue={branch?.address ?? ""} />
          </div>
          <TextField label="Area" name="area" maxLength={120} defaultValue={branch?.area ?? ""} />
          <TextField label="City" name="city" maxLength={80} defaultValue={branch?.city ?? "Dubai"} />
          <TextField label="Phone" name="phone" type="tel" maxLength={40} defaultValue={branch?.phone ?? ""} />
          <TextField label="Email" name="email" type="email" maxLength={254} defaultValue={branch?.email ?? ""} description="Optional." />
        </div>
      </Panel>

      <Panel title="Opening hours" description="Use 24-hour times. A closing time after midnight (for example 01:00) is fine.">
        <div className="grid gap-4">
          <label className="flex items-center gap-3 text-[length:var(--text-sm)]">
            <input type="checkbox" name="hours_enabled" checked={hoursOn} onChange={(e) => setHoursOn(e.target.checked)} className="size-4 accent-[var(--control-on)]" />
            Set weekly opening hours
          </label>
          {hoursOn && (
            <table className="w-full max-w-lg text-[length:var(--text-sm)]">
              <caption className="sr-only">Opening hours by day</caption>
              <thead className="text-left text-[var(--text-muted)]">
                <tr><th scope="col" className="py-1 font-normal">Day</th><th scope="col" className="py-1 font-normal">Opens</th><th scope="col" className="py-1 font-normal">Closes</th><th scope="col" className="py-1 font-normal">Closed</th></tr>
              </thead>
              <tbody>
                {WEEKDAYS.map((d) => {
                  const h = branch?.opening_hours.find((x) => x.day === d.key);
                  return (
                    <tr key={d.key}>
                      <th scope="row" className="py-1.5 pr-3 text-left font-normal">{d.label}</th>
                      <td className="py-1.5 pr-2"><input type="time" name={`opens_${d.key}`} aria-label={`${d.label} opens`} defaultValue={h?.opens ?? "12:00"} disabled={closed[d.key]} className={timeInput} /></td>
                      <td className="py-1.5 pr-2"><input type="time" name={`closes_${d.key}`} aria-label={`${d.label} closes`} defaultValue={h?.closes ?? "00:00"} disabled={closed[d.key]} className={timeInput} /></td>
                      <td className="py-1.5"><input type="checkbox" name={`closed_${d.key}`} aria-label={`Closed on ${d.label}`} checked={closed[d.key]} onChange={(e) => setClosed((c) => ({ ...c, [d.key]: e.target.checked }))} className="size-4 accent-[var(--control-on)]" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <FieldError name="opening_hours" />
          <TextField label="Hours note" name="hours_note" maxLength={300} defaultValue={branch?.hours_note ?? ""} description="Shown with the hours, e.g. ‘Walk-ins only’. Shown instead of hours when none are set." />
        </div>
      </Panel>

      <Panel title="Links and map">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="Directions link" name="directions_url" type="url" maxLength={500} defaultValue={branch?.directions_url ?? ""} description="Google Maps share link (https://…). Leave blank to search the address." />
          <TextField label="Google review link" name="google_review_url" type="url" maxLength={500} defaultValue={branch?.google_review_url ?? ""} description="From Google Business Profile, ‘Ask for reviews’." />
          <TextField label="Latitude" name="latitude" inputMode="decimal" defaultValue={branch?.latitude ?? ""} description="Optional, used for directions and search engines." />
          <TextField label="Longitude" name="longitude" inputMode="decimal" defaultValue={branch?.longitude ?? ""} />
        </div>
      </Panel>

      <Panel title="Photo">
        <ImageField defaultValue={branch?.image_url} />
      </Panel>

      <Panel title="Status">
        <div className="grid gap-4">
          {canEditStatus ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Switch name="is_active" label="Show on the website" defaultChecked={branch?.is_active ?? true} />
              <TextField label="Display order" name="display_order" type="number" min="0" defaultValue={branch?.display_order ?? 0} />
            </div>
          ) : (
            <>
              <input type="hidden" name="is_active" value={branch?.is_active ? "on" : ""} />
              <input type="hidden" name="display_order" value={branch?.display_order ?? 0} />
            </>
          )}
          <CheckboxField name="is_verified" label="These details have been confirmed by the business" description="Unconfirmed branches show a ‘details being confirmed’ notice and are left out of search-engine data." defaultChecked={branch?.is_verified} />
          <TextAreaField label="Source notes (staff only)" name="source_note" rows={2} maxLength={500} defaultValue={branch?.source_note ?? ""} />
        </div>
      </Panel>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <SubmitButton>{branch ? "Save branch" : "Create branch"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
