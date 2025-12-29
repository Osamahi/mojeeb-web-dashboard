/**
 * Global Number Localization Configuration
 *
 * Provides locale-aware number formatting with Arabic-Indic numerals (٠-٩)
 * for Arabic locales. Uses native Intl.NumberFormat API for proper localization.
 *
 * Usage:
 * ```tsx
 * import { useNumber } from '@/lib/numberConfig';
 *
 * function MyComponent() {
 *   const { formatNumber, formatCurrency } = useNumber();
 *   return (
 *     <div>
 *       <p>{formatNumber(1234)}</p>      // "١٬٢٣٤" in Arabic, "1,234" in English
 *       <p>{formatCurrency(99.99)}</p>   // "٩٩٫٩٩ ج.م." in ar-EG
 *     </div>
 *   );
 * }
 * ```
 */

import { useTranslation } from 'react-i18next';
import { toArabicNumerals } from './arabicNumerals';

/**
 * Currency codes for different Arabic locales
 */
const CURRENCY_MAP: Record<string, string> = {
  'ar-SA': 'SAR', // Saudi Riyal
  'ar-EG': 'EGP', // Egyptian Pound
  en: 'USD',      // US Dollar (default)
};

/**
 * Gets the appropriate currency code for a locale
 */
function getCurrency(language: string): string {
  return CURRENCY_MAP[language] || CURRENCY_MAP.en;
}

/**
 * Formats a number with Arabic-Indic numerals for Arabic locales
 * Uses Intl.NumberFormat for proper localization
 *
 * Falls back to string conversion if Intl doesn't support Arabic numerals
 *
 * @param value - The number to format
 * @param language - The i18n language code (e.g., 'ar-SA', 'ar-EG', 'en')
 * @param options - Additional Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatNumber(
  value: number | string,
  language: string,
  options?: Intl.NumberFormatOptions
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return String(value);
  }

  const isArabic = language.startsWith('ar');

  const formatter = new Intl.NumberFormat(language, {
    ...options,
    numberingSystem: isArabic ? 'arab' : 'latn',
  });

  let formatted = formatter.format(numValue);

  // Fallback: If Intl didn't convert to Arabic numerals, do it manually
  // This ensures compatibility across all browsers and edge cases
  if (isArabic && /[0-9]/.test(formatted)) {
    formatted = toArabicNumerals(formatted);
  }

  return formatted;
}

/**
 * Formats a number as currency with proper locale support
 *
 * Falls back to string conversion if Intl doesn't support Arabic numerals
 *
 * @param value - The amount to format
 * @param language - The i18n language code
 * @param currencyCode - Optional currency code (defaults to locale's currency)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | string,
  language: string,
  currencyCode?: string
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return String(value);
  }

  const isArabic = language.startsWith('ar');
  const currency = currencyCode || getCurrency(language);

  const formatter = new Intl.NumberFormat(language, {
    style: 'currency',
    currency,
    numberingSystem: isArabic ? 'arab' : 'latn',
  });

  let formatted = formatter.format(numValue);

  // Fallback: If Intl didn't convert to Arabic numerals, do it manually
  if (isArabic && /[0-9]/.test(formatted)) {
    formatted = toArabicNumerals(formatted);
  }

  return formatted;
}

/**
 * Formats a number as a percentage
 *
 * Falls back to string conversion if Intl doesn't support Arabic numerals
 *
 * @param value - The value to format (0.5 = 50%)
 * @param language - The i18n language code
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export function formatPercent(
  value: number | string,
  language: string,
  decimals: number = 0
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return String(value);
  }

  const isArabic = language.startsWith('ar');

  const formatter = new Intl.NumberFormat(language, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    numberingSystem: isArabic ? 'arab' : 'latn',
  });

  let formatted = formatter.format(numValue);

  // Fallback: If Intl didn't convert to Arabic numerals, do it manually
  if (isArabic && /[0-9]/.test(formatted)) {
    formatted = toArabicNumerals(formatted);
  }

  return formatted;
}

/**
 * Formats a number with compact notation (e.g., 1K, 1M, 1B)
 *
 * Falls back to string conversion if Intl doesn't support Arabic numerals
 *
 * @param value - The number to format
 * @param language - The i18n language code
 * @returns Compact formatted number string
 */
export function formatCompact(
  value: number | string,
  language: string
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return String(value);
  }

  const isArabic = language.startsWith('ar');

  const formatter = new Intl.NumberFormat(language, {
    notation: 'compact',
    compactDisplay: 'short',
    numberingSystem: isArabic ? 'arab' : 'latn',
  });

  let formatted = formatter.format(numValue);

  // Fallback: If Intl didn't convert to Arabic numerals, do it manually
  if (isArabic && /[0-9]/.test(formatted)) {
    formatted = toArabicNumerals(formatted);
  }

  return formatted;
}

/**
 * React hook that returns number formatting functions
 * Automatically uses the current i18n language
 *
 * @returns Object with number formatting functions
 */
export function useNumber() {
  const { i18n } = useTranslation();

  return {
    /**
     * Format a number with locale-aware separators and Arabic-Indic numerals
     * Example: 1234.56 → "١٬٢٣٤٫٥٦" (Arabic) or "1,234.56" (English)
     */
    formatNumber: (value: number | string, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, i18n.language, options),

    /**
     * Format a number as currency
     * Example: 99.99 → "٩٩٫٩٩ ج.م." (ar-EG) or "$99.99" (English)
     */
    formatCurrency: (value: number | string, currencyCode?: string) =>
      formatCurrency(value, i18n.language, currencyCode),

    /**
     * Format a number as percentage
     * Example: 0.85 → "٨٥٪" (Arabic) or "85%" (English)
     */
    formatPercent: (value: number | string, decimals?: number) =>
      formatPercent(value, i18n.language, decimals),

    /**
     * Format a number with compact notation
     * Example: 1500 → "١٫٥ ألف" (Arabic) or "1.5K" (English)
     */
    formatCompact: (value: number | string) =>
      formatCompact(value, i18n.language),

    /**
     * Format an integer (no decimals)
     * Example: 42 → "٤٢" (Arabic) or "42" (English)
     */
    formatInt: (value: number | string) =>
      formatNumber(value, i18n.language, { maximumFractionDigits: 0 }),

    /**
     * Format a decimal number with specific precision
     * Example: 3.14159 → "٣٫١٤" (Arabic, 2 decimals) or "3.14" (English)
     */
    formatDecimal: (value: number | string, decimals: number = 2) =>
      formatNumber(value, i18n.language, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
  };
}

/**
 * Non-hook version for use in utility files
 *
 * @param language - The i18n language code
 * @returns Number formatting functions
 */
export function getNumberFormatters(language: string) {
  return {
    formatNumber: (value: number | string, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, language, options),

    formatCurrency: (value: number | string, currencyCode?: string) =>
      formatCurrency(value, language, currencyCode),

    formatPercent: (value: number | string, decimals?: number) =>
      formatPercent(value, language, decimals),

    formatCompact: (value: number | string) =>
      formatCompact(value, language),

    formatInt: (value: number | string) =>
      formatNumber(value, language, { maximumFractionDigits: 0 }),

    formatDecimal: (value: number | string, decimals: number = 2) =>
      formatNumber(value, language, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
  };
}
