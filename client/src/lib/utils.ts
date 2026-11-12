import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, symbol = '₹'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `${symbol}0.00`;
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStockStatusColor(status: string) {
  switch (status) {
    case 'In Stock':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Low Stock':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Out of Stock':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Expiring Soon':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Expired':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

