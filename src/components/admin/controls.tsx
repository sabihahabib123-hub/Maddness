"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import ConfirmMorph from "@/components/arc/confirm-morph/confirm-morph";
import { Button } from "@/components/arc/button/button";
import { Switch } from "@/components/arc/switch/switch";
import type { ActionResult } from "@/lib/types";

/**
 * Arc switch that applies immediately through a server action. It flips
 * optimistically and flips back (with the reason) if the server refuses.
 */
export function ActionSwitch({
  checked,
  label,
  hideLabel = false,
  onToggle,
}: {
  checked: boolean;
  label: string;
  /** Keep the label for screen readers only (e.g. inside a table with a column header). */
  hideLabel?: boolean;
  onToggle: (next: boolean) => Promise<ActionResult>;
}) {
  const [value, setValue] = useState(checked);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  return (
    <div className="grid gap-1">
      <Switch
        {...(hideLabel ? { "aria-label": label } : { label })}
        checked={value}
        onCheckedChange={(next) => {
          setValue(next);
          setError(null);
          start(async () => {
            const res = await onToggle(next);
            if (!res.ok) {
              setValue(!next);
              setError(res.message);
            } else router.refresh();
          });
        }}
      />
      {error && <p role="alert" className="text-[length:var(--text-xs)] text-[var(--danger)]">{error}</p>}
    </div>
  );
}

/** Destructive action that asks in place (Arc ConfirmMorph). Rejects to show Arc's error face. */
export function ConfirmAction({
  label,
  prompt,
  confirmLabel = "Delete",
  doneLabel = "Done",
  onConfirm,
  tone = "danger",
}: {
  label: ReactNode;
  prompt?: ReactNode;
  confirmLabel?: string;
  doneLabel?: string;
  onConfirm: () => Promise<ActionResult>;
  tone?: "danger" | "neutral";
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="grid justify-items-start gap-1">
      <ConfirmMorph
        label={label}
        prompt={prompt}
        confirmLabel={confirmLabel}
        doneLabel={doneLabel}
        tone={tone}
        onConfirm={async () => {
          setMessage(null);
          const res = await onConfirm();
          if (!res.ok) {
            setMessage(res.message);
            throw new Error(res.message);
          }
          router.refresh();
        }}
      />
      {message && <p role="alert" className="max-w-sm text-[length:var(--text-xs)] text-[var(--danger)]">{message}</p>}
    </div>
  );
}

/** A plain button that runs one server action and shows its result next to it. */
export function ActionButton({
  children,
  onRun,
  variant = "secondary",
  size = "sm",
}: {
  children: ReactNode;
  onRun: () => Promise<ActionResult>;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-grid gap-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        loading={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await onRun();
            if (!res.ok) setError(res.message);
            else router.refresh();
          })
        }
      >
        {children}
      </Button>
      {error && <span role="alert" className="text-[length:var(--text-xs)] text-[var(--danger)]">{error}</span>}
    </span>
  );
}
