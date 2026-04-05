import { z } from "zod";

export const customerNoteSchema = z.object({
  body: z
    .string()
    .min(1, "Note cannot be empty")
    .max(10000, "Note is too long"),
});

export type CustomerNoteFormValues = z.infer<typeof customerNoteSchema>;
