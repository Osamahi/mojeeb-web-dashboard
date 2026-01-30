/**
 * Centralized Time Management Utility
 *
 * Architecture: Backend uses UTC exclusively, frontend handles timezone localization
 * - Backend: Always stores and works with DateTime.UtcNow
 * - Frontend: Converts UTC to user's browser timezone for display
 *
 * Features:
 * - Smart relative/absolute time display
 * - Automatic browser timezone detection
 * - i18n support (Arabic/English)
 * - Timezone abbreviation display
 */

import { formatInTimeZone } from 'date-fns-tz';
import { formatDistanceToNow, isYesterday, isToday, format } from 'date-fns';
import { arSA, arEG, enUS } from 'date-fns/locale';

/**
 * Options for timestamp formatting
 */
export interface FormatTimestampOptions {
  showTimezone?: boolean;
  locale?: string;
  useRelative?: boolean; // Default: true for recent times
}

/**
 * Get the user's browser timezone
 * @returns IANA timezone string (e.g., "Africa/Cairo", "America/New_York")
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Failed to detect user timezone:', error);
    return 'UTC';
  }
}

/**
 * Parse a date string or Date object, ensuring UTC interpretation
 * Handles both "2025-01-30T10:32:45Z" and "2025-01-30T10:32:45" formats
 */
export function parseUtcDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return dateInput;
  }

  let dateStr = dateInput.toString().trim();

  // Add 'Z' suffix if missing and no timezone offset present
  if (!dateStr.endsWith('Z') && !dateStr.includes('+') && dateStr.includes('T')) {
    dateStr = `${dateStr}Z`;
  }

  const date = new Date(dateStr);

  // Validate date
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateInput}`);
  }

  return date;
}

/**
 * Get timezone abbreviation (e.g., "EET", "PST", "UTC+2")
 */
export function getTimezoneAbbreviation(timezone: string = getUserTimezone()): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });

    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart?.value || 'UTC';
  } catch (error) {
    console.error('Failed to get timezone abbreviation:', error);
    return 'UTC';
  }
}

/**
 * Get date-fns locale object based on locale string
 */
function getDateFnsLocale(localeStr?: string): Locale {
  const locale = localeStr || 'en';

  if (locale.startsWith('ar')) {
    return locale === 'ar-SA' ? arSA : arEG;
  }

  return enUS;
}

/**
 * Main function: Format timestamp with smart relative/absolute logic
 *
 * Smart Display Logic:
 * - < 1 minute: "Just now"
 * - < 60 minutes: "X minutes ago"
 * - < 24 hours: "X hours ago"
 * - Yesterday: "Yesterday at HH:mm AM/PM"
 * - < 7 days: "Monday at HH:mm AM/PM"
 * - >= 7 days: "MMM DD, YYYY HH:mm AM/PM [TZ]"
 *
 * @param dateInput - UTC date string or Date object
 * @param options - Formatting options
 * @returns Formatted timestamp string
 */
export function formatSmartTimestamp(
  dateInput: string | Date,
  options: FormatTimestampOptions = {}
): string {
  const {
    showTimezone = false,
    locale: localeStr = 'en',
    useRelative = true,
  } = options;

  try {
    // Parse UTC date
    const utcDate = parseUtcDate(dateInput);
    const userTimezone = getUserTimezone();
    const dateFnsLocale = getDateFnsLocale(localeStr);

    // Calculate age in milliseconds
    const now = new Date();
    const ageMs = now.getTime() - utcDate.getTime();
    const ageMinutes = Math.floor(ageMs / 60000);
    const ageHours = Math.floor(ageMinutes / 60);
    const ageDays = Math.floor(ageHours / 24);

    // Smart relative time logic
    if (useRelative) {
      // Just now (< 1 minute)
      if (ageMinutes < 1) {
        return localeStr.startsWith('ar') ? 'الآن' : 'Just now';
      }

      // Minutes ago (< 60 minutes)
      if (ageMinutes < 60) {
        return formatDistanceToNow(utcDate, {
          addSuffix: true,
          locale: dateFnsLocale,
        });
      }

      // Hours ago (< 24 hours)
      if (ageHours < 24) {
        return formatDistanceToNow(utcDate, {
          addSuffix: true,
          locale: dateFnsLocale,
        });
      }
    }

    // Format time part (HH:mm AM/PM)
    const timePart = formatInTimeZone(
      utcDate,
      userTimezone,
      'h:mm a',
      { locale: dateFnsLocale }
    );

    // Yesterday
    if (isYesterday(utcDate)) {
      const yesterdayLabel = localeStr.startsWith('ar') ? 'أمس' : 'Yesterday';
      return `${yesterdayLabel} at ${timePart}`;
    }

    // This week (< 7 days)
    if (ageDays < 7 && ageDays >= 0) {
      const dayName = formatInTimeZone(
        utcDate,
        userTimezone,
        'EEEE',
        { locale: dateFnsLocale }
      );
      return `${dayName} at ${timePart}`;
    }

    // Older dates - absolute format
    const datePattern = localeStr.startsWith('ar')
      ? 'd MMM yyyy'  // Arabic: ٣٠ يناير ٢٠٢٥
      : 'MMM d, yyyy'; // English: Jan 30, 2025

    const datePart = formatInTimeZone(
      utcDate,
      userTimezone,
      datePattern,
      { locale: dateFnsLocale }
    );

    // Add timezone abbreviation if requested
    const tzPart = showTimezone ? ` ${getTimezoneAbbreviation(userTimezone)}` : '';

    return `${datePart} ${timePart}${tzPart}`;

  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return localeStr.startsWith('ar') ? 'تاريخ غير صالح' : 'Invalid date';
  }
}

/**
 * Format timestamp in user's timezone with custom format pattern
 * @param dateInput - UTC date string or Date object
 * @param formatPattern - date-fns format pattern (e.g., 'PPpp', 'MM/dd/yyyy')
 * @param locale - Locale string ('en', 'ar-EG', 'ar-SA')
 */
export function formatInUserTimezone(
  dateInput: string | Date,
  formatPattern: string = 'PPpp',
  locale: string = 'en'
): string {
  try {
    const utcDate = parseUtcDate(dateInput);
    const userTimezone = getUserTimezone();
    const dateFnsLocale = getDateFnsLocale(locale);

    return formatInTimeZone(utcDate, userTimezone, formatPattern, {
      locale: dateFnsLocale,
    });
  } catch (error) {
    console.error('Error formatting in user timezone:', error);
    return locale.startsWith('ar') ? 'تاريخ غير صالح' : 'Invalid date';
  }
}

/**
 * Check if a timestamp is today in user's timezone
 */
export function isTimestampToday(dateInput: string | Date): boolean {
  try {
    const utcDate = parseUtcDate(dateInput);
    return isToday(utcDate);
  } catch {
    return false;
  }
}

/**
 * Check if a timestamp is yesterday in user's timezone
 */
export function isTimestampYesterday(dateInput: string | Date): boolean {
  try {
    const utcDate = parseUtcDate(dateInput);
    return isYesterday(utcDate);
  } catch {
    return false;
  }
}

/**
 * Get relative time from now (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(
  dateInput: string | Date,
  locale: string = 'en'
): string {
  try {
    const utcDate = parseUtcDate(dateInput);
    const dateFnsLocale = getDateFnsLocale(locale);

    return formatDistanceToNow(utcDate, {
      addSuffix: true,
      locale: dateFnsLocale,
    });
  } catch (error) {
    console.error('Error getting relative time:', error);
    return locale.startsWith('ar') ? 'تاريخ غير صالح' : 'Invalid date';
  }
}
