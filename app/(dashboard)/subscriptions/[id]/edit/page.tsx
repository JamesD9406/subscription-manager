'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateSubscriptionSchema } from '@/lib/validators/subscription';
import { SubscriptionStatus } from '@/lib/types';
import { z } from 'zod';

export default function EditSubscriptionPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    status: 'TRIALING' as SubscriptionStatus,
    currentPeriodStart: '',
    currentPeriodEnd: '',
    cancelAtPeriodEnd: false,
    canceledAt: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const { id } = await params;
      const response = await fetch(`/api/subscriptions/${id}`);
      if (!response.ok) throw new Error('Failed to fetch subscription');
      const data = await response.json();

      setFormData({
        status: data.status,
        currentPeriodStart: data.currentPeriodStart.split('T')[0],
        currentPeriodEnd: data.currentPeriodEnd.split('T')[0],
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        canceledAt: data.canceledAt ? data.canceledAt.split('T')[0] : '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const payload = {
        status: formData.status,
        currentPeriodStart: formData.currentPeriodStart,
        currentPeriodEnd: formData.currentPeriodEnd,
        cancelAtPeriodEnd: formData.cancelAtPeriodEnd,
        canceledAt: formData.canceledAt || null,
      };

      // Validate with Zod
      const validatedData = updateSubscriptionSchema.parse(payload);

      const { id } = await params;
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update subscription');
      }

      router.push(`/subscriptions/${id}`);
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
        <div className="text-lg text-gray-600">Loading subscription...</div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/subscriptions/${params.id}`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Subscription
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Edit Subscription
          </h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
                htmlFor="currentPeriodStart"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Current Period Start
              </label>
              <input
                type="date"
                id="currentPeriodStart"
                value={formData.currentPeriodStart}
                onChange={(e) =>
                  setFormData({ ...formData, currentPeriodStart: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                  fieldErrors.currentPeriodStart
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.currentPeriodStart && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.currentPeriodStart}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="currentPeriodEnd"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Current Period End
              </label>
              <input
                type="date"
                id="currentPeriodEnd"
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

            {formData.status === 'CANCELLED' && (
              <div>
                <label
                  htmlFor="canceledAt"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Canceled At
                </label>
                <input
                  type="date"
                  id="canceledAt"
                  value={formData.canceledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, canceledAt: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                    fieldErrors.canceledAt
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {fieldErrors.canceledAt && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.canceledAt}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Required when status is CANCELLED
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href={`/subscriptions/${params.id}`}
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