/**
 * Global Date Localization Configuration
 *
 * Provides locale-aware date formatting with automatic language detection from i18n.
 * For Arabic locales, uses Intl.DateTimeFormat with Arabic-Indic numerals (٠-٩).
 * For English and relative dates, uses date-fns.
 *
 * Usage:
 * ```tsx
 * import { useDateLocale } from '@/lib/dateConfig';
 *
 * function MyComponent() {
 *   const { format, formatDistance } = useDateLocale();
 *   return <div>{format(new Date(), 'MMM d, yyyy')}</div>;
 * }
 * ```
 */

import { useTranslation } from 'react-i18next';
import { arSA } from 'date-fns/locale/ar-SA';
import { arEG } from 'date-fns/locale/ar-EG';
import { enUS } from 'date-fns/locale/en-US';
import type { Locale } from 'date-fns';
import * as dateFns from 'date-fns';
import { toArabicNumerals } from './arabicNumerals';
import {
  formatSmartTimestamp,
  formatInUserTimezone,
  getUserTimezone,
  getTimezoneAbbreviation,
  isTimestampToday,
  isTimestampYesterday,
  getRelativeTime,
  type FormatTimestampOptions,
} from './timeUtils';

/**
 * Converts date-fns format strings to Intl.DateTimeFormat options
 * Maps common date-fns patterns to Intl equivalents
 */
function convertFormatToIntlOptions(formatStr: string): Intl.DateTimeFormatOptions {
  // Common format patterns
  const patterns: Record<string, Intl.DateTimeFormatOptions> = {
    'MMM d, yyyy': { year: 'numeric', month: 'short', day: 'numeric' },
    'MMMM d, yyyy': { year: 'numeric', month: 'long', day: 'numeric' },
    'PPP': { year: 'numeric', month: 'long', day: 'numeric' }, // date-fns long format
    'PP': { year: 'numeric', month: 'short', day: 'numeric' }, // date-fns medium format
    'P': { year: 'numeric', month: 'numeric', day: 'numeric' }, // date-fns short format
    'short-date': { year: 'numeric', month: 'numeric', day: 'numeric' }, // e.g., 12/29/2025
    'short-time': { hour: '2-digit', minute: '2-digit' }, // e.g., 11:27 AM
  };

  return patterns[formatStr] || { year: 'numeric', month: 'short', day: 'numeric' };
}

/**
 * Maps i18n language codes to date-fns locales
 */
const LOCALE_MAP: Record<string, Locale> = {
  en: enUS,
  'ar-SA': arSA,
  'ar-EG': arEG,
};

/**
 * Gets the date-fns locale object for the current i18n language
 */
export function getDateLocale(language: string): Locale {
  return LOCALE_MAP[language] || enUS;
}

/**
 * Formats a date using Intl.DateTimeFormat with Arabic-Indic numerals
 * for Arabic locales (Gregorian calendar with ٠-٩ numerals)
 *
 * Falls back to string conversion if Intl doesn't support Arabic numerals
 */
function formatWithIntl(date: Date | number, formatStr: string, language: string): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  const options = convertFormatToIntlOptions(formatStr);
  const isArabic = language.startsWith('ar');

  // Use Intl.DateTimeFormat with Arabic-Indic numerals for Arabic locales
  // calendar: 'gregory' ensures Gregorian (Miladi) dates, not Hijri
  // numberingSystem: 'arab' renders numerals as ٠-٩ instead of 0-9
  const formatter = new Intl.DateTimeFormat(language, {
    ...options,
    calendar: 'gregory',
    numberingSystem: isArabic ? 'arab' : 'latn',
  });

  let formatted = formatter.format(dateObj);

  // Fallback: If Intl didn't convert to Arabic numerals, do it manually
  // This ensures compatibility across all browsers and edge cases
  if (isArabic && /[0-9]/.test(formatted)) {
    formatted = toArabicNumerals(formatted);
  }

  return formatted;
}

/**
 * Formats a date to localized short date string (e.g., 12/29/2025 or ١٢/٢٩/٢٠٢٥)
 * Uses Intl.DateTimeFormat with Arabic-Indic numerals for Arabic locales
 */
function formatLocaleDateString(date: Date, language: string): string {
  const isArabic = language.startsWith('ar');
  const formatter = new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    calendar: 'gregory',
    numberingSystem: isArabic ? 'arab' : 'latn',
  });

  let formatted = formatter.format(date);

  // Fallback conversion
  if (isArabic && /[0-9]/.test(formatted)) {
    formatted = toArabicNumerals(formatted);
  }

  return formatted;
}

/**
 * Formats a date to localized short time string (e.g., 11:27 AM or ١١:٢٧ ص)
 * Uses Intl.DateTimeFormat with Arabic-Indic numerals for Arabic locales
 */
function formatLocaleTimeString(date: Date, language: string): string {
  const isArabic = language.startsWith('ar');
  const formatter = new Intl.DateTimeFormat(language, {
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'gregory',
    numberingSystem: isArabic ? 'arab' : 'latn',
  });

  let formatted = formatter.format(date);

  // Fallback conversion
  if (isArabic && /[0-9]/.test(formatted)) {
    formatted = toArabicNumerals(formatted);
  }

  return formatted;
}

/**
 * React hook that returns locale-aware date formatting functions
 *
 * For Arabic locales: Uses Intl.DateTimeFormat with Arabic-Indic numerals (٠-٩)
 * For English: Uses date-fns for consistency
 * For relative dates: Always uses date-fns (e.g., "2 days ago")
 *
 * @returns Object with date formatting and utility functions
 */
export function useDateLocale() {
  const { i18n } = useTranslation();
  const locale = getDateLocale(i18n.language);
  const isArabic = i18n.language.startsWith('ar');

  return {
    /**
     * Format a date with Arabic-Indic numerals for Arabic locales
     * Uses Intl.DateTimeFormat for Arabic, date-fns for English
     */
    format: (date: Date | number, formatStr: string) => {
      if (isArabic) {
        return formatWithIntl(date, formatStr, i18n.language);
      }
      return dateFns.format(date, formatStr, { locale });
    },

    /**
     * Format as localized short date (12/29/2025 or ١٢/٢٩/٢٠٢٥)
     */
    toLocaleDateString: (date: Date | number) => {
      const dateObj = typeof date === 'number' ? new Date(date) : date;
      return formatLocaleDateString(dateObj, i18n.language);
    },

    /**
     * Format as localized short time (11:27 AM or ١١:٢٧ ص)
     */
    toLocaleTimeString: (date: Date | number) => {
      const dateObj = typeof date === 'number' ? new Date(date) : date;
      return formatLocaleTimeString(dateObj, i18n.language);
    },

    // Relative date formatting - always uses date-fns for consistent relative phrases
    formatDistance: (date: Date | number, baseDate: Date | number, options?: any) =>
      dateFns.formatDistance(date, baseDate, { ...options, locale }),

    formatDistanceToNow: (date: Date | number, options?: any) =>
      dateFns.formatDistanceToNow(date, { ...options, locale }),

    formatRelative: (date: Date | number, baseDate: Date | number, options?: any) =>
      dateFns.formatRelative(date, baseDate, { ...options, locale }),

    formatDistanceStrict: (date: Date | number, baseDate: Date | number, options?: any) =>
      dateFns.formatDistanceStrict(date, baseDate, { ...options, locale }),

    // Export other commonly used date-fns functions as-is
    isToday: dateFns.isToday,
    isYesterday: dateFns.isYesterday,
    isThisWeek: dateFns.isThisWeek,
    isThisMonth: dateFns.isThisMonth,
    isThisYear: dateFns.isThisYear,
    differenceInDays: dateFns.differenceInDays,
    differenceInHours: dateFns.differenceInHours,
    differenceInMinutes: dateFns.differenceInMinutes,
    parseISO: dateFns.parseISO,
    isValid: dateFns.isValid,
    isBefore: dateFns.isBefore,
    isAfter: dateFns.isAfter,
    addDays: dateFns.addDays,
    addMonths: dateFns.addMonths,
    subDays: dateFns.subDays,
    startOfDay: dateFns.startOfDay,
    endOfDay: dateFns.endOfDay,
    startOfMonth: dateFns.startOfMonth,
    endOfMonth: dateFns.endOfMonth,

    // Smart timestamp formatting (new centralized time management)
    /**
     * Format timestamp with smart relative/absolute logic
     * - Recent: "2 hours ago"
     * - Yesterday: "Yesterday at 3:30 PM"
     * - This week: "Monday at 10:15 AM"
     * - Older: "Jan 30, 2025 12:32 PM"
     */
    formatSmartTimestamp: (date: string | Date, options?: FormatTimestampOptions) =>
      formatSmartTimestamp(date, { ...options, locale: i18n.language }),

    /**
     * Format timestamp in user's browser timezone with custom pattern
     */
    formatInUserTimezone: (date: string | Date, pattern: string = 'PPpp') =>
      formatInUserTimezone(date, pattern, i18n.language),

    /**
     * Get user's browser timezone (e.g., "Africa/Cairo")
     */
    getUserTimezone,

    /**
     * Get timezone abbreviation (e.g., "EET", "UTC+2")
     */
    getTimezoneAbbreviation,

    /**
     * Check if timestamp is today in user's timezone
     */
    isTimestampToday,

    /**
     * Check if timestamp is yesterday in user's timezone
     */
    isTimestampYesterday,

    /**
     * Get relative time ("2 hours ago", "in 3 days")
     */
    getRelativeTime: (date: string | Date) => getRelativeTime(date, i18n.language),

    // Export the current locale for manual use if needed
    locale,
  };
}

/**
 * Non-hook version for use in utility files
 *
 * @param language - The i18n language code
 * @returns Locale-aware date formatting functions with Arabic-Indic numeral support
 */
export function getDateFns(language: string) {
  const locale = getDateLocale(language);
  const isArabic = language.startsWith('ar');

  return {
    /**
     * Format a date with Arabic-Indic numerals for Arabic locales
     * Uses Intl.DateTimeFormat for Arabic, date-fns for English
     */
    format: (date: Date | number, formatStr: string) => {
      if (isArabic) {
        return formatWithIntl(date, formatStr, language);
      }
      return dateFns.format(date, formatStr, { locale });
    },

    formatDistance: (date: Date | number, baseDate: Date | number, options?: any) =>
      dateFns.formatDistance(date, baseDate, { ...options, locale }),

    formatDistanceToNow: (date: Date | number, options?: any) =>
      dateFns.formatDistanceToNow(date, { ...options, locale }),

    formatRelative: (date: Date | number, baseDate: Date | number, options?: any) =>
      dateFns.formatRelative(date, baseDate, { ...options, locale }),

    formatDistanceStrict: (date: Date | number, baseDate: Date | number, options?: any) =>
      dateFns.formatDistanceStrict(date, baseDate, { ...options, locale }),

    isToday: dateFns.isToday,
    isYesterday: dateFns.isYesterday,
    isThisWeek: dateFns.isThisWeek,
    isThisMonth: dateFns.isThisMonth,
    isThisYear: dateFns.isThisYear,
    differenceInDays: dateFns.differenceInDays,
    differenceInHours: dateFns.differenceInHours,
    differenceInMinutes: dateFns.differenceInMinutes,
    parseISO: dateFns.parseISO,
    isValid: dateFns.isValid,
    isBefore: dateFns.isBefore,
    isAfter: dateFns.isAfter,
    addDays: dateFns.addDays,
    addMonths: dateFns.addMonths,
    subDays: dateFns.subDays,
    startOfDay: dateFns.startOfDay,
    endOfDay: dateFns.endOfDay,
    startOfMonth: dateFns.startOfMonth,
    endOfMonth: dateFns.endOfMonth,

    // Smart timestamp formatting (new centralized time management)
    formatSmartTimestamp: (date: string | Date, options?: FormatTimestampOptions) =>
      formatSmartTimestamp(date, { ...options, locale: language }),
    formatInUserTimezone: (date: string | Date, pattern: string = 'PPpp') =>
      formatInUserTimezone(date, pattern, language),
    getUserTimezone,
    getTimezoneAbbreviation,
    isTimestampToday,
    isTimestampYesterday,
    getRelativeTime: (date: string | Date) => getRelativeTime(date, language),

    locale,
  };
}
