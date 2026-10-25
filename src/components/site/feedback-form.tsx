"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { submitFeedback } from "@/app/actions/feedback";
import { COUNTRIES } from "@/config/site";
import type { Branch } from "@/lib/types";
import { feedbackSchema, type FeedbackFormInput, type FeedbackFormValues } from "@/lib/validation/feedback";
import { StarInput } from "./star-input";

const VISIT_OPTIONS = [
  { value: "dine_in", label: "Dine-in" },
  { value: "takeaway", label: "Takeaway" },
  { value: "delivery", label: "Delivery" },
] as const;

export function FeedbackForm({ branches }: { branches: Pick<Branch, "id" | "name">[] }) {
  const [status, setStatus] = useState<{ kind: "idle" | "success" | "error"; message?: string }>({ kind: "idle" });
  const successRef = useRef<HTMLDivElement>(null);
  // The branch is required whenever branches exist (also enforced on the server).
  const schema = useMemo(
    () => feedbackSchema.refine((v) => branches.length === 0 || Boolean(v.branch_id), { path: ["branch_id"], message: "Choose the branch you visited" }),
    [branches.length],
  );
  const errorRef = useRef<HTMLParagraphElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormInput, unknown, FeedbackFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: "",
      email: "",
      phone: "",
      country: "United Arab Emirates",
      branch_id: branches.length === 1 ? branches[0].id : null,
      visit_type: undefined,
      rating_overall: undefined,
      rating_food: null,
      rating_service: null,
      rating_atmosphere: null,
      message: "",
      consent_to_contact: false,
      website: "",
      started_at: 0,
    },
    mode: "onTouched",
  });

  useEffect(() => setValue("started_at", Date.now()), [setValue]);
  useEffect(() => {
    if (status.kind === "success") successRef.current?.focus();
    if (status.kind === "error") errorRef.current?.focus();
  }, [status]);

  const onSubmit = async (values: FeedbackFormValues) => {
    setStatus({ kind: "idle" });
    const res = await submitFeedback({ ...values, branch_id: values.branch_id ?? null });
    if (res.ok) {
      setStatus({ kind: "success", message: res.message });
      reset();
      return;
    }
    if (res.fieldErrors) {
      Object.entries(res.fieldErrors).forEach(([k, v]) => v?.[0] && setError(k as keyof FeedbackFormInput, { message: v[0] }));
    }
    setStatus({ kind: "error", message: res.message });
  };

  if (status.kind === "success") {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="rounded-[var(--radius-card)] border-2 border-black bg-cream p-8 text-center text-obsidian shadow-[var(--shadow-panel)] outline-none">
        <CheckCircle2 aria-hidden className="mx-auto size-14 text-[#1f9d63]" />
        <p className="display mt-4 text-4xl">Thank you!</p>
        <p className="mx-auto mt-2 max-w-md text-[#4a4744]">
          {status.message ?? "We've received your feedback. Our team reads every message. If approved, your review may appear on our website."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn btn-dark" onClick={() => { setStatus({ kind: "idle" }); setValue("started_at", Date.now()); }}>
            Send another
          </button>
          <Link href="/menu" className="btn btn-primary">Back to the menu</Link>
        </div>
      </div>
    );
  }

  const err = (name: keyof FeedbackFormInput) => errors[name]?.message as string | undefined;
  const fieldProps = (name: keyof FeedbackFormInput) => ({
    id: `fb-${name}`,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `fb-${name}-err` : undefined,
  });
  const ErrorMsg = ({ name }: { name: keyof FeedbackFormInput }) =>
    err(name) ? <p id={`fb-${name}-err`} className="error-text">{err(name)}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6" aria-describedby="fb-privacy">
      {status.kind === "error" && (
        <p ref={errorRef} tabIndex={-1} role="alert" className="rounded-xl border border-red/50 bg-red/10 p-4 text-sm font-semibold text-[#ff8a80] outline-none">
          {status.message}
        </p>
      )}

      {/* Honeypot: hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="fb-website">Website</label>
        <input id="fb-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="fb-display_name" className="label">Your name <span aria-hidden className="text-red">*</span></label>
          <input {...fieldProps("display_name")} className="field" autoComplete="given-name" maxLength={60} {...register("display_name")} />
          <p className="hint">Shown with your review if it is published. A first name is fine.</p>
          <ErrorMsg name="display_name" />
        </div>
        <div>
          <label htmlFor="fb-country" className="label">Country <span aria-hidden className="text-red">*</span></label>
          <select {...fieldProps("country")} className="field" autoComplete="country-name" {...register("country")}>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ErrorMsg name="country" />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {branches.length > 0 && (
          <div>
            <label htmlFor="fb-branch_id" className="label">Branch visited <span aria-hidden className="text-red">*</span></label>
            <Controller
              control={control}
              name="branch_id"
              render={({ field }) => (
                <select
                  {...fieldProps("branch_id")}
                  className="field"
                  value={field.value ?? ""}
                  onBlur={field.onBlur}
                  onChange={(e) => field.onChange(e.target.value || null)}
                >
                  <option value="">Choose a branch</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )}
            />
            <ErrorMsg name="branch_id" />
          </div>
        )}
        <fieldset aria-describedby={errors.visit_type ? "fb-visit_type-err" : undefined}>
          <legend className="label">How did you visit? <span aria-hidden className="text-red">*</span></legend>
          <div className="grid grid-cols-3 gap-2">
            {VISIT_OPTIONS.map((o) => (
              <label key={o.value} className="relative">
                <input type="radio" value={o.value} className="peer sr-only" {...register("visit_type")} />
                <span className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-line bg-charcoal text-sm font-bold text-cream/80 transition-colors peer-checked:border-red peer-checked:bg-red peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold hover:border-cream/50">
                  {o.label}
                </span>
              </label>
            ))}
          </div>
          <ErrorMsg name="visit_type" />
        </fieldset>
      </div>

      <Controller
        control={control}
        name="rating_overall"
        render={({ field }) => (
          <StarInput label="Overall rating" name="rating_overall" required value={field.value as number | undefined} onChange={(v) => field.onChange(v ?? undefined)} error={err("rating_overall")} />
        )}
      />

      <div className="grid gap-6 rounded-xl border border-line p-5 md:grid-cols-3">
        {(["rating_food", "rating_service", "rating_atmosphere"] as const).map((n) => (
          <Controller
            key={n}
            control={control}
            name={n}
            render={({ field }) => (
              <StarInput
                label={n === "rating_food" ? "Food" : n === "rating_service" ? "Service" : "Atmosphere"}
                name={n}
                optional
                value={(field.value as number | null) ?? null}
                onChange={field.onChange}
                error={err(n)}
              />
            )}
          />
        ))}
      </div>

      <div>
        <label htmlFor="fb-message" className="label">Your feedback <span aria-hidden className="text-red">*</span></label>
        <textarea {...fieldProps("message")} rows={5} maxLength={2000} className="field min-h-36 resize-y" {...register("message")} />
        <ErrorMsg name="message" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="fb-email" className="label">Email <span className="font-normal text-muted">(optional)</span></label>
          <input {...fieldProps("email")} type="email" inputMode="email" autoComplete="email" maxLength={254} className="field" {...register("email")} />
          <ErrorMsg name="email" />
        </div>
        <div>
          <label htmlFor="fb-phone" className="label">Phone <span className="font-normal text-muted">(optional)</span></label>
          <input {...fieldProps("phone")} type="tel" inputMode="tel" autoComplete="tel" maxLength={30} className="field" {...register("phone")} />
          <ErrorMsg name="phone" />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-cream/85">
        <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[#f04438]" {...register("consent_to_contact")} />
        <span>I&apos;m happy for MADNESS to contact me about this feedback using the details above.</span>
      </label>

      <p id="fb-privacy" className="rounded-xl bg-charcoal p-4 text-xs leading-relaxed text-muted">
        <strong className="text-cream">Privacy:</strong> we use your feedback to improve our restaurants. Your email and phone number are only
        visible to authorised MADNESS staff and are never published. By sending this form you agree that we may publish your display name, rating, branch and
        comment on this website after review. This is a website review, not a Google review. Read our <Link href="/privacy" className="underline hover:text-cream">privacy policy</Link>.
      </p>

      <div>
        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full disabled:cursor-wait disabled:opacity-70 sm:w-auto">
          {isSubmitting ? (<><Loader2 aria-hidden className="size-5 animate-spin" /> Sending…</>) : "Send feedback"}
        </button>
      </div>
    </form>
  );
}
