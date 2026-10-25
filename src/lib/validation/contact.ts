import { z } from "zod";
import { ENQUIRY_TOPICS } from "@/lib/types";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const contactSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(80),
    email: optionalText(254).refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email address"),
    phone: optionalText(30).refine((v) => v === null || /^[+()\d\s-]{6,30}$/.test(v), "Enter a valid phone number"),
    topic: z.enum(ENQUIRY_TOPICS, { error: "Choose a topic" }),
    branch_id: z
      .string()
      .nullish()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || z.uuid().safeParse(v).success, "Choose a branch"),
    message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(2000, "Keep it under 2,000 characters"),
    website: z.string().max(0).nullish(),
    started_at: z.coerce.number().nullish(),
  })
  .refine((v) => v.email || v.phone, { path: ["email"], message: "Give us an email or phone number so we can reply" });
