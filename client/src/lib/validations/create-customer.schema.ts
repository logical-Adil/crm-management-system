import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().max(64).optional(),
});

export type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;
