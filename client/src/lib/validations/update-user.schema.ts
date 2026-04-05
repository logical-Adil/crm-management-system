import { z } from "zod";

/** Aligned with Nest `UpdateUserDto` — optional name, optional role. */
export const updateUserSchema = z.object({
  name: z.string(),
  role: z.enum(["admin", "member"]),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
