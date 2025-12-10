'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Customer } from '@/lib/types';
import ConfirmDialog from '@/components/confirm-dialog';

export default function ViewCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      const { id } = await params;
      const response = await fetch(`/api/customers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch customer');
      const data = await response.json();
      setCustomer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [params]);

    useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);


    const handleDelete = async () => {
    try {
      setDeleting(true);
      setShowDeleteConfirm(false);
      const { id } = await params;
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete customer');
      }

      router.push('/customers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading customer...</div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Error: {error || 'Customer not found'}</div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/customers"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Customers
        </Link>

        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                <p className="mt-1 text-gray-600">{customer.email}</p>
              </div>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  customer.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : customer.status === 'TRIALING'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {customer.status}
              </span>
            </div>
          </div>

          <div className="px-6 py-6">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Active Subscriptions</dt>
                <dd className="mt-1 text-lg text-gray-900">
                  {customer._count?.subscriptions || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Invoices</dt>
                <dd className="mt-1 text-lg text-gray-900">
                  {customer._count?.invoices || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(customer.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(customer.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          {customer.subscriptions && customer.subscriptions.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscriptions</h2>
              <div className="space-y-3">
                {customer.subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {subscription.plan?.name || 'Unknown Plan'}
                      </p>
                      <p className="text-xs text-gray-500">Status: {subscription.status}</p>
                    </div>
                    <Link
                      href={`/subscriptions/${subscription.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {customer.invoices && customer.invoices.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h2>
              <div className="space-y-3">
                {customer.invoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        ${(invoice.amount / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">Status: {invoice.status}</p>
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
              href={`/customers/${customer.id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Edit Customer
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {deleting ? 'Deleting...' : 'Delete Customer'}
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
          title="Delete Customer"
          message="Are you sure you want to delete this customer? This will also delete all their subscriptions and invoices. This action cannot be undone."
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