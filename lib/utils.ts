/**
 * Utility functions for formatting and common operations
 */

/**
 * Format price from cents to dollar string
 * @param cents - Price in cents (e.g., 999 = $9.99)
 * @returns Formatted price string (e.g., "$9.99")
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Format date to readable string
 * @param date - Date object or ISO string
 * @returns Formatted date string (e.g., "Dec 9, 2025")
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date to relative time
 * @param date - Date object or ISO string
 * @returns Relative time string (e.g., "2 days ago", "in 3 days")
 */
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = dateObj.getTime() - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Tomorrow';
  if (diffInDays === -1) return 'Yesterday';
  if (diffInDays > 0) return `in ${diffInDays} days`;
  return `${Math.abs(diffInDays)} days ago`;
}

/**
 * Get status badge color classes
 * @param status - Status string
 * @returns Tailwind CSS classes for badge
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    TRIALING: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    PAST_DUE: 'bg-red-100 text-red-800',
    PAID: 'bg-green-100 text-green-800',
    OPEN: 'bg-yellow-100 text-yellow-800',
    DRAFT: 'bg-gray-100 text-gray-800',
    FAILED: 'bg-red-100 text-red-800',
  };

  return statusColors[status] || 'bg-gray-100 text-gray-800';
}
