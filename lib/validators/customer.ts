import { z } from "zod";

// Enum values from Prisma schema
const CustomerStatus = z.enum(["ACTIVE", "TRIALING", "CANCELLED"]);

// Create schema
export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),
  status: CustomerStatus.optional().default("ACTIVE"),
});

// Update schema
export const updateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format").optional(),
  status: CustomerStatus.optional(),
});

// Create TypeScript types
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;