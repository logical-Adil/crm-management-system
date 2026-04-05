import { z } from "zod";

/**
 * Aligned with server `CreateUserDto`: email, password ≥10, optional name, role enum.
 */
export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters"),
  name: z.string().optional(),
  role: z.enum(["admin", "member"], {
    message: "Select a role",
  }),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
