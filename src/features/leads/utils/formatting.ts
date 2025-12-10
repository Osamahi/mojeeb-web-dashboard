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
