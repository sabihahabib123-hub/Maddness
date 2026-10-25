"use client";

import { createContext, useActionState, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Input, type InputProps } from "@/components/arc/input/input";
import { Textarea, type TextareaProps } from "@/components/arc/textarea/textarea";
import type { ActionResult } from "@/lib/types";

type Action = (prev: ActionResult<never> | null, form: FormData) => Promise<ActionResult<unknown>>;

const ErrorsContext = createContext<Record<string, string[] | undefined>>({});
const PendingContext = createContext(false);
const ResultContext = createContext<ActionResult<unknown> | null>(null);

export function useFieldError(name: string): string | undefined {
  return useContext(ErrorsContext)[name]?.[0];
}

/**
 * Wraps a server action in a form. Shows the result in place (never only a
 * toast), passes field errors to the fields below, and keeps the save button
 * in its loading state while the action runs.
 */
export function ActionForm({
  action,
  children,
  className = "grid gap-5",
  resetOnSuccess = false,
  encType,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  encType?: "multipart/form-data";
}) {
  const [state, formAction, pending] = useActionState(action as (p: ActionResult<unknown> | null, f: FormData) => Promise<ActionResult<unknown>>, null);
  const ref = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.ok && resetOnSuccess) ref.current?.reset();
    if (!state.ok) statusRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={className} encType={encType} noValidate>
      <div ref={statusRef} aria-live="polite">
        {state && !state.ok && <Alert tone="danger" title={state.message} />}
        {state?.ok && <Alert tone="success" title={state.message ?? "Saved"} />}
      </div>
      <ErrorsContext.Provider value={(state && !state.ok && state.fieldErrors) || {}}>
        <PendingContext.Provider value={pending}>
          <ResultContext.Provider value={state}>{children}</ResultContext.Provider>
        </PendingContext.Provider>
      </ErrorsContext.Provider>
    </form>
  );
}

/** Confirms in place: the label briefly changes to "Saved" (or "Not saved") after the action returns. */
export function SubmitButton({ children = "Save changes", variant = "primary" }: { children?: ReactNode; variant?: "primary" | "secondary" }) {
  const pending = useContext(PendingContext);
  const result = useContext(ResultContext);
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    if (!result) return;
    setFlash(result.ok ? "Saved" : "Not saved");
    const t = setTimeout(() => setFlash(null), 2200);
    return () => clearTimeout(t);
  }, [result]);
  return (
    <Button type="submit" variant={variant} loading={pending}>
      {flash ?? children}
    </Button>
  );
}

export function TextField(props: InputProps & { name: string }) {
  const error = useFieldError(props.name);
  return <Input {...props} error={error ?? props.error} />;
}

export function TextAreaField(props: TextareaProps & { name: string }) {
  const error = useFieldError(props.name);
  return <Textarea {...props} error={error ?? props.error} />;
}

/** Native select styled to sit beside Arc inputs, for simple forms that must submit without JavaScript state. */
export function NativeSelect({
  name,
  label,
  options,
  defaultValue,
  description,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  description?: string;
}) {
  const error = useFieldError(name);
  const id = `sel-${name}`;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[length:var(--text-sm)] font-medium text-[var(--foreground)]">{label}</label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : description ? `${id}-desc` : undefined}
        className="h-[var(--control-height-md)] rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[length:var(--text-sm)] text-[var(--foreground)] outline-none focus-visible:border-[var(--accent)]"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {description && !error && <p id={`${id}-desc`} className="text-[length:var(--text-xs)] text-[var(--text-muted)]">{description}</p>}
      {error && <p id={`${id}-err`} className="text-[length:var(--text-xs)] text-[var(--danger)]">{error}</p>}
    </div>
  );
}

/** Native checkbox for "include in this form" choices (Arc rule: checkbox inside a form that submits). */
export function CheckboxField({ name, label, defaultChecked, description, value }: { name: string; label: string; defaultChecked?: boolean; description?: string; value?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-[length:var(--text-sm)]">
      <input type="checkbox" name={name} value={value ?? "on"} defaultChecked={defaultChecked} className="mt-0.5 size-4 shrink-0 accent-[var(--control-on)]" />
      <span>
        <span className="text-[var(--foreground)]">{label}</span>
        {description && <span className="block text-[length:var(--text-xs)] text-[var(--text-muted)]">{description}</span>}
      </span>
    </label>
  );
}

export function FieldError({ name }: { name: string }) {
  const error = useFieldError(name);
  return error ? <p className="text-[length:var(--text-xs)] text-[var(--danger)]">{error}</p> : null;
}
