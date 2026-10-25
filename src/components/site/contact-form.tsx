"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { submitEnquiry, type ContactState } from "@/app/actions/contact";
import type { Branch } from "@/lib/types";

const TOPICS = [
  { value: "general", label: "General question" },
  { value: "events", label: "Groups and events" },
  { value: "feedback", label: "Feedback" },
  { value: "careers", label: "Careers" },
  { value: "press", label: "Press and partnerships" },
  { value: "other", label: "Something else" },
];

export function ContactForm({ branches }: { branches: Pick<Branch, "id" | "name">[] }) {
  const [state, action, pending] = useActionState<ContactState | null, FormData>(submitEnquiry, null);
  const [startedAt, setStartedAt] = useState(0);
  const msgRef = useRef<HTMLDivElement>(null);
  useEffect(() => setStartedAt(Date.now()), []);
  useEffect(() => {
    if (state) msgRef.current?.focus();
  }, [state]);

  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k]?.[0] : undefined);
  const val = (k: string) => (state && !state.ok ? state.values?.[k] : undefined);
  const a11y = (k: string) => ({ id: `ct-${k}`, name: k, "aria-invalid": Boolean(err(k)), "aria-describedby": err(k) ? `ct-${k}-err` : undefined });
  const Err = ({ k }: { k: string }) => (err(k) ? <p id={`ct-${k}-err`} className="error-text">{err(k)}</p> : null);

  if (state?.ok) {
    return (
      <div ref={msgRef} tabIndex={-1} role="status" className="rounded-[var(--radius-card)] border-2 border-black bg-cream p-8 text-center text-obsidian shadow-[var(--shadow-panel)] outline-none">
        <CheckCircle2 aria-hidden className="mx-auto size-14 text-[#1f9d63]" />
        <p className="display mt-4 text-4xl">Message sent</p>
        <p className="mx-auto mt-2 max-w-md text-[#4a4744]">{state.message ?? "Thanks for getting in touch."}</p>
        <Link href="/menu" className="btn btn-primary mt-6">Browse the menu</Link>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="grid gap-6">
      {state && !state.ok && (
        <div ref={msgRef} tabIndex={-1} role="alert" className="rounded-xl border border-red/50 bg-red/10 p-4 text-sm font-semibold text-[#ff8a80] outline-none">
          {state.message}
        </div>
      )}
      <input type="hidden" name="started_at" value={startedAt || ""} />
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="ct-website">Website</label>
        <input id="ct-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="ct-name" className="label">Name <span aria-hidden className="text-red">*</span></label>
          <input {...a11y("name")} required maxLength={80} autoComplete="name" defaultValue={val("name")} className="field" />
          <Err k="name" />
        </div>
        <div>
          <label htmlFor="ct-topic" className="label">Topic <span aria-hidden className="text-red">*</span></label>
          <select {...a11y("topic")} defaultValue={val("topic") ?? "general"} className="field">
            {TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <Err k="topic" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="ct-email" className="label">Email</label>
          <input {...a11y("email")} type="email" maxLength={254} autoComplete="email" defaultValue={val("email")} className="field" />
          <Err k="email" />
        </div>
        <div>
          <label htmlFor="ct-phone" className="label">Phone</label>
          <input {...a11y("phone")} type="tel" maxLength={30} autoComplete="tel" defaultValue={val("phone")} className="field" />
          <Err k="phone" />
        </div>
      </div>
      <p className="-mt-3 text-xs text-muted">Give us at least one way to reply: email or phone.</p>
      {branches.length > 0 && (
        <div>
          <label htmlFor="ct-branch_id" className="label">Branch <span className="font-normal text-muted">(optional)</span></label>
          <select {...a11y("branch_id")} defaultValue={val("branch_id") ?? ""} className="field">
            <option value="">Not branch-specific</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <Err k="branch_id" />
        </div>
      )}
      <div>
        <label htmlFor="ct-message" className="label">Message <span aria-hidden className="text-red">*</span></label>
        <textarea {...a11y("message")} required rows={5} maxLength={2000} defaultValue={val("message")} className="field min-h-36 resize-y" />
        <Err k="message" />
      </div>
      <p className="text-xs leading-relaxed text-muted">
        We use these details only to reply to your message. They are visible to authorised MADNESS staff only. See our{" "}
        <Link href="/privacy" className="underline hover:text-cream">privacy policy</Link>.
      </p>
      <div>
        <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:cursor-wait disabled:opacity-70 sm:w-auto">
          {pending ? (<><Loader2 aria-hidden className="size-5 animate-spin" /> Sending…</>) : "Send message"}
        </button>
      </div>
    </form>
  );
}
