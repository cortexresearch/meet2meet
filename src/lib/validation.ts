import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  organizerName: z.string().trim().min(1).max(60),
  duration: z.number().int().min(5).max(480),
  timezone: z.string().min(1).max(80),
  slots: z
    .array(
      z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
      })
    )
    .min(1)
    .max(200),
});

export const joinEventSchema = z.object({
  name: z.string().trim().min(1).max(60),
  slotIds: z.array(z.string()).max(500),
});

export const pickSlotSchema = z.object({
  slotId: z.string().min(1),
});

export const confirmSchema = z.object({
  name: z.string().trim().min(1).max(60),
  confirmed: z.boolean(),
});
