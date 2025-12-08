import { z } from "zod";

// Enum values from Prisma schema
const InvoiceStatus = z.enum(["DRAFT", "OPEN", "PAID", "FAILED"]);

// Line item schema - structure for individual invoice line items
const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().int().nonnegative("Unit price must be non-negative"),
  total: z.number().int().nonnegative("Total must be non-negative"),
});

// Create schema
export const createInvoiceSchema = z.object({
  subscriptionId: z.number().int().positive("Subscription ID must be valid"),
  customerId: z.number().int().positive("Customer ID must be valid"),
  amount: z.number().int().positive("Amount must be positive"),
  dueDate: z.coerce.date(),
  status: InvoiceStatus.optional().default("DRAFT"),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
}).refine(
  (data) => {
    // Validate that amount matches sum of line item totals
    const lineItemsTotal = data.lineItems.reduce((sum, item) => sum + item.total, 0);
    return data.amount === lineItemsTotal;
  },
  {
    message: "Invoice amount must equal sum of line items",
    path: ["amount"],
  }
).refine(
  (data) => {
    // Validate each line item's total = quantity * unitPrice
    return data.lineItems.every(item => item.total === item.quantity * item.unitPrice);
  },
  {
    message: "Line item totals must equal quantity * unit price",
    path: ["lineItems"],
  }
);

// Update schema
export const updateInvoiceSchema = z.object({
  status: InvoiceStatus.optional(),
  dueDate: z.coerce.date().optional(),
  paidAt: z.coerce.date().optional().nullable(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required").optional(),
}).refine(
  (data) => {
    // If status is PAID, paidAt must be provided
    if (data.status === "PAID" && !data.paidAt) {
      return false;
    }
    return true;
  },
  {
    message: "Paid invoices must have a paidAt date",
    path: ["paidAt"],
  }
).refine(
  (data) => {
    // If paidAt is provided, it should not be in the future
    if (data.paidAt && data.paidAt > new Date()) {
      return false;
    }
    return true;
  },
  {
    message: "Payment date cannot be in the future",
    path: ["paidAt"],
  }
);

// Schema for marking invoice as paid
export const payInvoiceSchema = z.object({
  paidAt: z.coerce.date().optional().default(() => new Date()),
});

// Create TypeScript types
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type PayInvoiceInput = z.infer<typeof payInvoiceSchema>;
export type LineItem = z.infer<typeof lineItemSchema>;