/**
 * Formatting utilities for leads
 */

import { format, formatDistanceToNow, isToday, isThisYear } from 'date-fns';

/**
 * Extract name from email address
 * Examples:
 * - "john.doe@example.com" -> "John Doe"
 * - "john@example.com" -> "John"
 * - "John Smith" -> "John Smith" (pass through if not email)
 */
export function extractNameFromEmail(emailOrName: string): string {
  if (!emailOrName) return 'Unknown';

  // If it doesn't contain @, assume it's already a name
  if (!emailOrName.includes('@')) {
    return emailOrName;
  }

  // Extract local part before @
  const localPart = emailOrName.split('@')[0];

  // Replace dots, underscores, hyphens with spaces
  const words = localPart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .filter((word) => word.length > 0);

  // Capitalize each word
  const capitalized = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );

  return capitalized.join(' ') || 'Unknown';
}

/**
 * Format phone number following international standards (E.164)
 * Examples:
 * - "+201096569391" -> "+20 10 9656 9391" (Egypt mobile)
 * - "+12345678900" -> "+1 (234) 567-8900" (USA/Canada)
 * - "+966501234567" -> "+966 50 123 4567" (Saudi Arabia)
 * - "1234567890" -> "123 456 7890"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove all spaces, dashes, parentheses for parsing
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // If it starts with +, format as international
  if (cleaned.startsWith('+')) {
    const number = cleaned.substring(1);

    // Egypt (+20) - Mobile: +20 1XX XXXX XXXX (10 digits)
    if (number.startsWith('20') && number.length === 12) {
      const countryCode = '20';
      const mobile = number.substring(2);
      return `+${countryCode} ${mobile.substring(0, 2)} ${mobile.substring(2, 6)} ${mobile.substring(6)}`;
    }

    // USA/Canada (+1) - Format: +1 (XXX) XXX-XXXX (10 digits)
    if (number.startsWith('1') && number.length === 11) {
      const area = number.substring(1, 4);
      const first = number.substring(4, 7);
      const last = number.substring(7);
      return `+1 (${area}) ${first}-${last}`;
    }

    // Saudi Arabia (+966) - Mobile: +966 5X XXX XXXX (9 digits)
    if (number.startsWith('966') && number.length === 12) {
      const countryCode = '966';
      const mobile = number.substring(3);
      return `+${countryCode} ${mobile.substring(0, 2)} ${mobile.substring(2, 5)} ${mobile.substring(5)}`;
    }

    // UAE (+971) - Mobile: +971 5X XXX XXXX (9 digits)
    if (number.startsWith('971') && number.length === 12) {
      const countryCode = '971';
      const mobile = number.substring(3);
      return `+${countryCode} ${mobile.substring(0, 2)} ${mobile.substring(2, 5)} ${mobile.substring(5)}`;
    }

    // Generic international format for other countries
    // Try to detect country code length (1-3 digits)
    let countryCodeLength = 1;
    if (number.length >= 11) countryCodeLength = 2;
    if (number.length >= 12) countryCodeLength = 3;

    const countryCode = number.substring(0, countryCodeLength);
    const rest = number.substring(countryCodeLength);

    // Format remaining digits in groups of 3
    const parts = rest.match(/.{1,3}/g) || [];
    return `+${countryCode} ${parts.join(' ')}`;
  }

  // No country code - format as groups of 3
  const parts = cleaned.match(/.{1,3}/g) || [];
  return parts.join(' ');
}

/**
 * Format date/time for comments
 * - Last 5 minutes: "now"
 * - Today: "2:30 PM today" (or just "2:30 PM" if compact=true)
 * - Yesterday: "2:30 PM yesterday"
 * - This year: "2:30 PM 13 Jun"
 * - Previous years: "2:30 PM 13 Jun 2024"
 */
export function formatCommentDate(date: Date | string, compact = false): string {
  // Ensure UTC dates are parsed correctly
  let dateStr = typeof date === 'string' ? date : date.toISOString();
  if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
    dateStr = `${dateStr}Z`;
  }

  const dateObj = new Date(dateStr);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));

  // Last 5 minutes
  if (diffInMinutes < 5) {
    return 'now';
  }

  const time = format(dateObj, 'h:mm a');

  // Today
  if (isToday(dateObj)) {
    return compact ? time : `${time} today`;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear()
  ) {
    return `${time} yesterday`;
  }

  // This year
  if (isThisYear(dateObj)) {
    return `${time} ${format(dateObj, 'd MMM')}`;
  }

  // Previous years
  return `${time} ${format(dateObj, 'd MMM yyyy')}`;
}
