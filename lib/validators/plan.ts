import { z } from "zod";

// Enum values from Prisma schema
const BillingInterval = z.enum(["MONTHLY", "YEARLY"]);

// Create schema
export const createPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().int().positive("Price must be a positive number"),
  billingInterval: BillingInterval,
  trialPeriodDays: z.number().int().positive().optional(),
  isActive: z.boolean().optional().default(true),
});

// Update schema
export const updatePlanSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  price: z.number().int().positive("Price must be a positive number").optional(),
  billingInterval: BillingInterval.optional(),
  trialPeriodDays: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Create TypeScript types
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;