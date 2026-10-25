"use client";

import { saveBranchMenu } from "@/app/admin/actions/branches";
import { formatPrice } from "@/lib/format";
import type { BranchMenuItem, MenuItem } from "@/lib/types";
import { ActionForm, SubmitButton, useFieldError } from "./action-form";

function PriceCell({ item, override }: { item: MenuItem; override?: BranchMenuItem }) {
  const error = useFieldError(`price_${item.id}`);
  return (
    <>
      <input
        type="number"
        name={`price_${item.id}`}
        step="0.01"
        min="0"
        inputMode="decimal"
        aria-label={`${item.name} price at this branch`}
        aria-invalid={Boolean(error)}
        placeholder={String(item.price)}
        defaultValue={override?.price_override ?? ""}
        className="h-[var(--control-height-sm)] w-28 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] px-2 text-right text-[length:var(--text-sm)] tabular-nums"
      />
      {error && <p className="text-[length:var(--text-xs)] text-[var(--danger)]">{error}</p>}
    </>
  );
}

/** Per-branch overrides. Blank price uses the base price; unticking hides the dish at this branch. */
export function BranchMenuForm({ branchId, items, overrides }: { branchId: string; items: MenuItem[]; overrides: BranchMenuItem[] }) {
  return (
    <ActionForm action={saveBranchMenu} className="grid gap-4">
      <input type="hidden" name="branch_id" value={branchId} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-[length:var(--text-sm)]">
          <caption className="sr-only">Branch menu prices and availability</caption>
          <thead className="border-b border-[var(--border)] text-[var(--text-muted)]">
            <tr>
              <th scope="col" className="py-2 pr-3 font-normal">Dish</th>
              <th scope="col" className="py-2 pr-3 text-right font-normal">Base price</th>
              <th scope="col" className="py-2 pr-3 font-normal">Branch price (AED)</th>
              <th scope="col" className="py-2 font-normal">Served here</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {items.map((item) => {
              const o = overrides.find((x) => x.menu_item_id === item.id);
              return (
                <tr key={item.id}>
                  <td className="py-2 pr-3">
                    <input type="hidden" name="item_id" value={item.id} />
                    {item.name}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-[var(--text-secondary)]">{formatPrice(item.price)}</td>
                  <td className="py-2 pr-3"><PriceCell item={item} override={o} /></td>
                  <td className="py-2">
                    <input type="checkbox" name={`available_${item.id}`} defaultChecked={o ? o.is_available : true} aria-label={`${item.name} served at this branch`} className="size-4 accent-[var(--control-on)]" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <SubmitButton>Save branch menu</SubmitButton>
      </div>
    </ActionForm>
  );
}
