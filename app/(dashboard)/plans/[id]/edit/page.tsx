'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { updatePlanSchema } from '@/lib/validators/plan';
import { BillingInterval } from '@/lib/types'
import { z } from 'zod';

export default function EditPlanPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    billingInterval: 'MONTHLY' as BillingInterval,
    trialPeriodDays: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fetchPlan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/plans/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch plan');
      const data = await response.json();

      setFormData({
        name: data.name,
        description: data.description || '',
        price: data.price.toString(),
        billingInterval: data.billingInterval,
        trialPeriodDays: data.trialPeriodDays?.toString() || '',
        isActive: data.isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchPlan();
    }
  }, [params.id, fetchPlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const payload: Record<string, unknown> = {};

      if (formData.name) payload.name = formData.name;
      if (formData.description !== '') payload.description = formData.description || undefined;
      if (formData.price) payload.price = parseInt(formData.price);
      if (formData.billingInterval) payload.billingInterval = formData.billingInterval;
      if (formData.trialPeriodDays !== '') {
        payload.trialPeriodDays = formData.trialPeriodDays
          ? parseInt(formData.trialPeriodDays)
          : null;
      }
      payload.isActive = formData.isActive;

      const validatedData = updatePlanSchema.parse(payload);

      const response = await fetch(`/api/plans/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update plan');
      }

      router.push(`/plans/${params.id}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading plan...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Link
          href={`/plans/${params.id}`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Plan
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Edit Plan
          </h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Plan Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                  fieldErrors.name
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="e.g., Starter, Pro, Enterprise"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Describe this plan..."
              />
            </div>

            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Price (in cents) *
              </label>
              <input
                type="number"
                id="price"
                required
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                  fieldErrors.price
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="e.g., 999 for $9.99"
              />
              {fieldErrors.price ? (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.price}</p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">
                  {formData.price &&
                    `$${(parseInt(formData.price) / 100).toFixed(2)}`}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="billingInterval"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Billing Interval *
              </label>
              <select
                id="billingInterval"
                required
                value={formData.billingInterval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingInterval: e.target.value as BillingInterval,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="trialPeriodDays"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Trial Period (days)
              </label>
              <input
                type="number"
                id="trialPeriodDays"
                min="0"
                value={formData.trialPeriodDays}
                onChange={(e) =>
                  setFormData({ ...formData, trialPeriodDays: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                  fieldErrors.trialPeriodDays
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="e.g., 14, 30"
              />
              {fieldErrors.trialPeriodDays && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.trialPeriodDays}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="isActive"
                className="ml-2 block text-sm text-gray-900"
              >
                Plan is active
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href={`/plans/${params.id}`}
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
