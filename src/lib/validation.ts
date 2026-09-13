import { z } from "zod";

export const eventInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  allDay: z.boolean().default(false),
  rrule: z.string().max(500).optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
});

export type EventInput = z.infer<typeof eventInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Doit être une couleur hexadécimale, ex: #6366f1"),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const pushSubscriptionInputSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionInputSchema>;
