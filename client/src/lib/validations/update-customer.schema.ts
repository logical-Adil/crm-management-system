import { z } from "zod";

/** Aligned with Nest `UpdateCustomerDto` — all optional for PATCH. */
export const updateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Enter a valid email"),
  phone: z.string().max(64).optional(),
});

export type UpdateCustomerFormValues = z.infer<typeof updateCustomerSchema>;
