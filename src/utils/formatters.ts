import { ListingType } from '@/types/property';

/**
 * Currency formatter with Indian Rupee notation (Lakh / Crore)
 * e.g., ₹85 Lakh, ₹2.4 Cr, or ₹45,000 / mo
 */
export function formatCurrency(
  amount: number,
  currency = 'INR',
  type?: ListingType
): string {
  let formatted = '';

  if (type === 'rent') {
    formatted = `₹${new Intl.NumberFormat('en-IN').format(amount)} / mo`;
    return formatted;
  }

  if (amount >= 10000000) {
    const cr = amount / 10000000;
    formatted = `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    const lakh = amount / 100000;
    formatted = `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)} Lakh`;
  } else {
    formatted = `₹${new Intl.NumberFormat('en-IN').format(amount)}`;
  }

  return formatted;
}

/**
 * Area formatter in sq.ft.
 * e.g., 1,450 sq.ft.
 */
export function formatArea(sqFt: number): string {
  return `${new Intl.NumberFormat('en-IN').format(sqFt)} sq.ft.`;
}

/**
 * Simple date formatter
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
