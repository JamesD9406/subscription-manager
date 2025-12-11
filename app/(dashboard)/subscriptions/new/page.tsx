'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSubscriptionSchema } from '@/lib/validators/subscription';
import { SubscriptionStatus, Customer, Plan } from '@/lib/types';
import { formatPrice } from '@/lib/utils'
import { z } from 'zod';

export default function NewSubscriptionPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [formData, setFormData] = useState({
    customerId: '',
    planId: '',
    status: 'TRIALING' as SubscriptionStatus,
    currentPeriodEnd: '',
    cancelAtPeriodEnd: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCustomers();
    fetchPlans();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      // Filter out cancelled customers
      setCustomers(data.filter((customer: Customer) => customer.status !== 'CANCELLED'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data.filter((plan: Plan) => plan.isActive));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans');
    }
  };

  // Calculate default period end based on plan's billing interval
  const calculatePeriodEnd = (planId: string): string => {
    if (!planId) return '';
    
    const selectedPlan = plans.find(p => p.id === Number(planId));
    if (!selectedPlan) return '';

    const today = new Date();
    const periodEnd = new Date(today);

    if (selectedPlan.billingInterval === 'MONTHLY') {
      // Add 1 month
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (selectedPlan.billingInterval === 'YEARLY') {
      // Add 1 year
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Format as YYYY-MM-DD for date input
    return periodEnd.toISOString().split('T')[0];
  };

  const handlePlanChange = (planId: string) => {
    setFormData({
      ...formData,
      planId,
      currentPeriodEnd: calculatePeriodEnd(planId),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const payload = {
        customerId: Number(formData.customerId),
        planId: Number(formData.planId),
        status: formData.status,
        currentPeriodEnd: formData.currentPeriodEnd,
        cancelAtPeriodEnd: formData.cancelAtPeriodEnd,
      };

      // Validate with Zod
      const validatedData = createSubscriptionSchema.parse(payload);

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create subscription');
      }

      router.push('/subscriptions');
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Handle Zod validation errors
        const errors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          if (issue.path.length > 0) {
            errors[issue.path[0].toString()] = issue.message;
          }
        });
        setFieldErrors(errors);
        setError('Please fix the validation errors below');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/subscriptions"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Subscriptions
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Create New Subscription
          </h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div>
              <label
                htmlFor="customerId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Customer *
              </label>
              <select
                id="customerId"
                required
                value={formData.customerId}
                onChange={(e) =>
                  setFormData({ ...formData, customerId: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                  fieldErrors.customerId
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.email})
                  </option>
                ))}
              </select>
              {fieldErrors.customerId && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.customerId}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Only active and trialing customers are shown
              </p>
            </div>

            <div>
              <label
                htmlFor="planId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Plan *
              </label>
              <select
                id="planId"
                required
                value={formData.planId}
                onChange={(e) => handlePlanChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                  fieldErrors.planId
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              >
                <option value="">Select a plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {formatPrice(plan.price)}/{plan.billingInterval.toLowerCase()}
                    </option>
                  ))}
              </select>
              {fieldErrors.planId && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.planId}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status *
              </label>
              <select
                id="status"
                required
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as SubscriptionStatus,
                  })
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                  fieldErrors.status
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              >
                <option value="TRIALING">Trialing</option>
                <option value="ACTIVE">Active</option>
                <option value="PAST_DUE">Past Due</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              {fieldErrors.status && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.status}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="currentPeriodEnd"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Current Period End *
              </label>
              <input
                type="date"
                id="currentPeriodEnd"
                required
                value={formData.currentPeriodEnd}
                onChange={(e) =>
                  setFormData({ ...formData, currentPeriodEnd: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                  fieldErrors.currentPeriodEnd
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.currentPeriodEnd && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.currentPeriodEnd}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Auto-calculated based on plan billing interval. Must be a future date
              </p>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.cancelAtPeriodEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, cancelAtPeriodEnd: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Cancel at period end
                </span>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Subscription'}
              </button>
              <Link
                href="/subscriptions"
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}