"use client";

import { saveFeedbackNotes } from "@/app/admin/actions/feedback";
import { ActionForm, SubmitButton, TextAreaField } from "./action-form";

export function FeedbackNotesForm({ id, notes }: { id: string; notes: string | null }) {
  return (
    <ActionForm action={saveFeedbackNotes} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      <TextAreaField label="Internal notes" name="internal_notes" rows={2} maxLength={2000} defaultValue={notes ?? ""} description="Only staff can see these." />
      <div><SubmitButton variant="secondary">Save notes</SubmitButton></div>
    </ActionForm>
  );
}
