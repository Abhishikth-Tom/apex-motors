/**
 * Shared formatting utilities for the Apex Motors showroom.
 */

/** Format a number as Indian Rupee currency without decimal places. */
export const formatMoney = (n: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n);

/** Format kilometres driven into a compact display string. */
export const formatKm = (km?: number): string =>
  km !== undefined && km !== null
    ? `${new Intl.NumberFormat('en-IN').format(km)} km`
    : 'Pre-owned';
