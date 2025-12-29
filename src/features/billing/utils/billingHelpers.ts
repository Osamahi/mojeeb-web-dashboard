import { differenceInDays } from 'date-fns';
import { getDateFns } from '@/lib/dateConfig';
import i18n from '@/i18n/config';
import { BillingCurrency, InvoiceStatus } from '../types/billing.types';

/**
 * Format currency amount from cents to display string
 *
 * @param amountInCents - Amount in cents (e.g., 9900 for $99.00)
 * @param currency - Currency code (USD, EGP, SAR)
 * @returns Formatted currency string (e.g., "$99.00", "EGP 3,200.00")
 */
export const formatCurrency = (amountInCents: number, currency: string): string => {
  const amount = amountInCents / 100;
  const currencyUpper = currency.toUpperCase();

  switch (currencyUpper) {
    case BillingCurrency.USD:
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);

    case BillingCurrency.EGP:
      return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
      }).format(amount);

    case BillingCurrency.SAR:
      return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
      }).format(amount);

    default:
      // Fallback for unknown currencies
      return `${currencyUpper} ${(amount).toFixed(2)}`;
  }
};

/**
 * Format billing period dates as readable string
 *
 * @param startDate - Period start date (ISO 8601 string)
 * @param endDate - Period end date (ISO 8601 string)
 * @returns Formatted date range (e.g., "Jan 1 - Feb 1, 2025")
 */
export const formatBillingPeriod = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const { format } = getDateFns(i18n.language);

  // Same month and year
  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
  }

  // Same year, different months
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }

  // Different years
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
};

/**
 * Calculate days remaining until date
 *
 * @param date - Future date (ISO 8601 string)
 * @returns Number of days remaining (0 if past or today)
 */
export const getDaysRemaining = (date: string): number => {
  const diff = differenceInDays(new Date(date), new Date());
  return diff > 0 ? diff : 0;
};

/**
 * Check if date is within warning threshold (e.g., card expiring soon)
 *
 * @param expiryMonth - Month (1-12)
 * @param expiryYear - Year (e.g., 2025)
 * @param thresholdDays - Warning threshold in days (default 60)
 * @returns true if expiring within threshold
 */
export const isExpiringWithin = (
  expiryMonth: number,
  expiryYear: number,
  thresholdDays = 60
): boolean => {
  // Create date at end of expiry month
  const expiryDate = new Date(expiryYear, expiryMonth, 0); // Day 0 = last day of previous month
  const daysUntilExpiry = differenceInDays(expiryDate, new Date());
  return daysUntilExpiry <= thresholdDays && daysUntilExpiry >= 0;
};

/**
 * Get badge color for invoice status
 *
 * @param status - Invoice status
 * @returns Tailwind CSS color class
 */
export const getInvoiceStatusColor = (status: InvoiceStatus): string => {
  switch (status) {
    case InvoiceStatus.Paid:
      return 'bg-green-100 text-green-800';
    case InvoiceStatus.Open:
      return 'bg-yellow-100 text-yellow-800';
    case InvoiceStatus.Void:
      return 'bg-gray-100 text-gray-800';
    case InvoiceStatus.Uncollectible:
      return 'bg-red-100 text-red-800';
    case InvoiceStatus.Draft:
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get display label for invoice status
 *
 * @param status - Invoice status
 * @returns Human-readable status label
 */
export const getInvoiceStatusLabel = (status: InvoiceStatus): string => {
  switch (status) {
    case InvoiceStatus.Paid:
      return 'Paid';
    case InvoiceStatus.Open:
      return 'Pending';
    case InvoiceStatus.Void:
      return 'Void';
    case InvoiceStatus.Uncollectible:
      return 'Failed';
    case InvoiceStatus.Draft:
      return 'Draft';
    default:
      return status;
  }
};

/**
 * Get card brand display name and icon class
 *
 * @param brand - Card brand from Stripe (visa, mastercard, amex, etc.)
 * @returns Object with display name and icon info
 */
export const getCardBrandInfo = (
  brand: string
): { name: string; iconClass: string } => {
  const brandLower = brand.toLowerCase();

  switch (brandLower) {
    case 'visa':
      return { name: 'Visa', iconClass: 'text-blue-600' };
    case 'mastercard':
      return { name: 'Mastercard', iconClass: 'text-red-600' };
    case 'amex':
    case 'american_express':
      return { name: 'American Express', iconClass: 'text-blue-500' };
    case 'discover':
      return { name: 'Discover', iconClass: 'text-orange-500' };
    case 'diners':
    case 'diners_club':
      return { name: 'Diners Club', iconClass: 'text-blue-700' };
    case 'jcb':
      return { name: 'JCB', iconClass: 'text-green-600' };
    case 'unionpay':
      return { name: 'UnionPay', iconClass: 'text-red-700' };
    default:
      return { name: brand, iconClass: 'text-gray-600' };
  }
};

/**
 * Calculate annual savings percentage
 *
 * @param monthlyPrice - Monthly price in cents
 * @param annualPrice - Annual price in cents
 * @returns Percentage saved (e.g., 17 for 17%)
 */
export const calculateAnnualSavings = (monthlyPrice: number, annualPrice: number): number => {
  const monthlyTotal = monthlyPrice * 12;
  const savings = monthlyTotal - annualPrice;
  const percentage = (savings / monthlyTotal) * 100;
  return Math.round(percentage);
};

/**
 * Format date for display
 *
 * @param dateString - ISO 8601 date string
 * @param formatString - date-fns format string (default: "MMM dd, yyyy")
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, formatString = 'MMM dd, yyyy'): string => {
  try {
    const { format } = getDateFns(i18n.language);
    return format(new Date(dateString), formatString);
  } catch {
    return dateString;
  }
};

/**
 * Get currency symbol
 *
 * @param currency - Currency code (USD, EGP, SAR)
 * @returns Currency symbol ($, EGP, SAR)
 */
export const getCurrencySymbol = (currency: string): string => {
  const currencyUpper = currency.toUpperCase();

  switch (currencyUpper) {
    case BillingCurrency.USD:
      return '$';
    case BillingCurrency.EGP:
      return 'EGP';
    case BillingCurrency.SAR:
      return 'SAR';
    default:
      return currencyUpper;
  }
};
