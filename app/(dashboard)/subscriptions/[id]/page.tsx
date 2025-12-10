'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Subscription } from '@/lib/types';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';
import ConfirmDialog from '@/components/confirm-dialog';

export default function ViewSubscriptionPage() {
  const params = useParams();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const { id } = await params;
      const response = await fetch(`/api/subscriptions/${id}`);
      if (!response.ok) throw new Error('Failed to fetch subscription');
      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setShowDeleteConfirm(false);
      const { id } = await params;
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete subscription');
      }

      router.push('/subscriptions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading subscription...</div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Error: {error || 'Subscription not found'}</div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/subscriptions"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Subscriptions
        </Link>

        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Subscription #{subscription.id}
                </h1>
                <p className="mt-1 text-gray-600">
                  {subscription.customer?.name} - {subscription.plan?.name}
                </p>
              </div>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(subscription.status)}`}
              >
                {subscription.status}
              </span>
            </div>
          </div>

          <div className="px-6 py-6">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link
                    href={`/customers/${subscription.customerId}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {subscription.customer?.name}
                  </Link>
                  <div className="text-gray-500">{subscription.customer?.email}</div>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Plan</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link
                    href={`/plans/${subscription.planId}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {subscription.plan?.name}
                  </Link>
                  <div className="text-gray-500">
                    {formatPrice(subscription.plan?.price || 0)}/{subscription.plan?.billingInterval.toLowerCase()}
                  </div>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(subscription.startDate)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Current Period</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Cancel at Period End</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {subscription.cancelAtPeriodEnd ? 'Yes' : 'No'}
                </dd>
              </div>
              {subscription.canceledAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Canceled At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(subscription.canceledAt)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Invoices</dt>
                <dd className="mt-1 text-lg text-gray-900">
                  {subscription._count?.invoices || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(subscription.createdAt)}
                </dd>
              </div>
            </dl>
          </div>

          {subscription.invoices && subscription.invoices.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h2>
              <div className="space-y-3">
                {subscription.invoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatPrice(invoice.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Due: {formatDate(invoice.dueDate)} - Status: {invoice.status}
                      </p>
                    </div>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
            <Link
              href={`/subscriptions/${subscription.id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Edit Subscription
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {deleting ? 'Deleting...' : 'Delete Subscription'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Delete Subscription"
          message="Are you sure you want to delete this subscription? This will also delete all associated invoices. This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </div>
  );
}
