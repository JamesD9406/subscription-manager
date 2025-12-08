import { z } from "zod";

// Enum values from Prisma schema
const SubscriptionStatus = z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELLED"]);

// Create schema
export const createSubscriptionSchema = z.object({
  customerId: z.number().int().positive("Customer ID must be valid"),
  planId: z.number().int().positive("Plan ID must be valid"),
  status: SubscriptionStatus.optional().default("TRIALING"),
  currentPeriodEnd: z.coerce.date(), //automatically change string to date, i.e. "2025-03-01"
  cancelAtPeriodEnd: z.boolean().optional().default(false),
}).refine(
  // Custom validation logic
  (data) => {
    // Ensure currentPeriodEnd is in the future
    return data.currentPeriodEnd > new Date();
  },
  {
    message: "Current period end must be in the future",
    path: ["currentPeriodEnd"],
  }
);

// Update schema
export const updateSubscriptionSchema = z.object({
  status: SubscriptionStatus.optional(),
  currentPeriodStart: z.coerce.date().optional(),
  currentPeriodEnd: z.coerce.date().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  canceledAt: z.coerce.date().optional().nullable(),
})
  .refine(
    (data) => {
      // If both dates provided, end must be after start
      if (data.currentPeriodStart && data.currentPeriodEnd) {
        return data.currentPeriodEnd > data.currentPeriodStart;
      }
      return true;
    },
    {
      message: "Current period end must be after start",
      path: ["currentPeriodEnd"],
    }
  )
  .refine(
    (data) => {
      // If status is CANCELLED, canceledAt should be provided
      if (data.status === "CANCELLED" && data.canceledAt === null) {
        return false;
      }
      return true;
    },
    {
      message: "Canceled subscriptions must have a canceledAt date",
      path: ["canceledAt"],
    }
  )
  .refine(
    (data) => {
      // If cancelAtPeriodEnd is false and status is CANCELLED, canceledAt should be recent
      if (
        data.status === "CANCELLED" &&
        data.cancelAtPeriodEnd === false &&
        data.canceledAt
      ) {
        // For immediate cancellations, canceledAt should be close to now
        // This is a soft check - within last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return data.canceledAt >= oneHourAgo;
      }
      return true;
    },
    {
      message: "Immediate cancellation date should be recent",
      path: ["canceledAt"],
    }
  );

// Schema for canceling a subscription
export const cancelSubscriptionSchema = z.object({
  cancelAtPeriodEnd: z.boolean().default(true),
});

// Create TypeScript types
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;