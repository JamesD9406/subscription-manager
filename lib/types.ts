// Shared TypeScript types for the subscription manager application
// These types match the Prisma schema and are used across UI components

// ============================================
// ENUMS
// ============================================

export type CustomerStatus = 'ACTIVE' | 'TRIALING' | 'CANCELLED';
export type BillingInterval = 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
export type InvoiceStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'FAILED';

// ============================================
// ENTITY TYPES
// ============================================

export type Plan = {
  id: number;
  name: string;
  description: string | null;
  price: number; // Price in cents
  billingInterval: BillingInterval;
  trialPeriodDays: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Optional relations
  subscriptions?: Subscription[];
  _count?: {
    subscriptions: number;
  };
};

export type Customer = {
  id: number;
  name: string;
  email: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  // Optional relations
  subscriptions?: Subscription[];
  invoices?: Invoice[];
  _count?: {
    subscriptions: number;
    invoices: number;
  };
};

export type Subscription = {
  id: number;
  customerId: number;
  planId: number;
  status: SubscriptionStatus;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Optional relations
  customer?: Customer;
  plan?: Plan;
  invoices?: Invoice[];
  _count?: {
    invoices: number;
  };
};

export type Invoice = {
  id: number;
  subscriptionId: number;
  customerId: number;
  amount: number; // Amount in cents
  dueDate: string;
  paidAt: string | null;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
  // Optional relations
  subscription?: Subscription;
  customer?: Customer;
};

// ============================================
// HELPER TYPES
// ============================================

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number; // Price in cents
  total: number; // Total in cents
};
