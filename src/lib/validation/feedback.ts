import { z } from "zod";
import { VISIT_TYPES } from "@/lib/types";

const optionalRating = z
  .union([z.coerce.number().int().min(1).max(5), z.literal(""), z.null(), z.undefined()])
  .transform((v) => (v === "" || v === undefined || v === null ? null : v));

const trimmedOptional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

/** Shared by the client form (React Hook Form) and the server action. */
export const feedbackSchema = z.object({
  display_name: z.string().trim().min(2, "Enter at least 2 characters").max(60, "Keep it under 60 characters"),
  email: trimmedOptional(254).refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email address"),
  phone: trimmedOptional(30).refine((v) => v === null || /^[+()\d\s-]{6,30}$/.test(v), "Enter a valid phone number"),
  country: z.string().trim().min(2, "Choose your country").max(60),
  branch_id: z.string().uuid("Choose the branch you visited").nullable(),
  visit_type: z.enum(VISIT_TYPES, { error: "Choose how you visited" }),
  rating_overall: z.coerce.number({ error: "Choose a rating" }).int().min(1, "Choose a rating from 1 to 5").max(5),
  rating_food: optionalRating,
  rating_service: optionalRating,
  rating_atmosphere: optionalRating,
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(2000, "Keep it under 2,000 characters"),
  consent_to_contact: z.boolean().default(false),
  /** Honeypot: real people never fill this. */
  website: z.string().max(0).optional().or(z.literal("")),
  /** ms timestamp set when the form rendered; very fast submissions are bots. */
  started_at: z.coerce.number().optional(),
});

export type FeedbackFormInput = z.input<typeof feedbackSchema>;
export type FeedbackFormValues = z.output<typeof feedbackSchema>;
