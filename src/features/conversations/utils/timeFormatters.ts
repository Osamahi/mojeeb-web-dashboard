/**
 * Time Formatting Utilities
 * WhatsApp-style timestamp formatting
 */

import { format, formatDistanceToNow, isToday, isYesterday, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

/**
 * Format conversation timestamp (for list items)
 * Returns: "Now", "2m", "1h", "Yesterday", "Jan 5"
 */
export const formatConversationTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();

  const minutesAgo = differenceInMinutes(now, date);
  const hoursAgo = differenceInHours(now, date);
  const daysAgo = differenceInDays(now, date);

  if (minutesAgo < 1) {
    return 'Now';
  }

  if (minutesAgo < 60) {
    return `${minutesAgo}m`;
  }

  if (hoursAgo < 24) {
    return `${hoursAgo}h`;
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  if (daysAgo < 7) {
    return `${daysAgo}d`;
  }

  // More than a week ago
  return format(date, 'MMM d');
};

/**
 * Format message timestamp (for chat bubbles)
 * Returns: "10:32 AM" or "Jan 5, 10:32 AM"
 */
export const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);

  if (isToday(date)) {
    return format(date, 'h:mm a');
  }

  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`;
  }

  // Other days
  return format(date, 'MMM d, h:mm a');
};

/**
 * Format full date and time
 * Returns: "January 5, 2025 at 10:32 AM"
 */
export const formatFullDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, "MMMM d, yyyy 'at' h:mm a");
};

/**
 * Get relative time description
 * Returns: "2 minutes ago", "1 hour ago", "yesterday"
 */
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
};

/**
 * Check if message can be edited (within 15 minutes)
 */
export const canEditMessage = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const minutesAgo = differenceInMinutes(now, date);
  return minutesAgo <= 15;
};
