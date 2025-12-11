'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Invoice } from '@/lib/types';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';
import ConfirmDialog from '@/components/confirm-dialog';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [paying, setPaying] = useState(false);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const { id } = await params;
      const response = await fetch(`/api/invoices/${id}`);
      if (!response.ok) throw new Error('Failed to fetch invoice');
      const data = await response.json();
      setInvoice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setShowDeleteConfirm(false);
      const { id } = await params;
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete invoice');
      }

      router.push('/invoices');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      setPaying(true);
      const { id } = await params;
      const response = await fetch(`/api/invoices/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidAt: new Date().toISOString() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark invoice as paid');
      }

      await fetchInvoice();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Error: {error || 'Invoice not found'}</div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/invoices"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Invoices
        </Link>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Invoice #{invoice.id}
                </h1>
                <p className="mt-1 text-gray-600">
                  {invoice.customer?.name} - {formatPrice(invoice.amount)}
                </p>
              </div>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(invoice.status)}`}
              >
                {invoice.status}
              </span>
            </div>
          </div>

          <div className="px-6 py-6">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link
                    href={`/customers/${invoice.customerId}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {invoice.customer?.name}
                  </Link>
                  <div className="text-gray-500">{invoice.customer?.email}</div>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Subscription</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link
                    href={`/subscriptions/${invoice.subscriptionId}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {invoice.subscription?.plan?.name || `Subscription #${invoice.subscriptionId}`}
                  </Link>
                  <div className="text-gray-500">
                    Status: {invoice.subscription?.status || 'N/A'}
                  </div>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                <dd className="mt-1 text-lg font-bold text-gray-900">
                  {formatPrice(invoice.amount)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(invoice.dueDate)}
                </dd>
              </div>
              {invoice.paidAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Paid At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(invoice.paidAt)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(invoice.createdAt)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="px-6 py-4 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.lineItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatPrice(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatPrice(item.total)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-right text-gray-900">
                      Total
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                      {formatPrice(invoice.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
            {invoice.status !== 'PAID' && (
              <button
                onClick={handleMarkAsPaid}
                disabled={paying}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {paying ? 'Processing...' : 'Mark as Paid'}
              </button>
            )}
            <Link
              href={`/invoices/${invoice.id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Edit Invoice
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {deleting ? 'Deleting...' : 'Delete Invoice'}
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
          title="Delete Invoice"
          message="Are you sure you want to delete this invoice? This action cannot be undone."
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