/**
 * Date Separator Component
 * Displays date headers between message groups
 * Format: "Today", "Yesterday", or "Oct 14, 2024"
 */

import { memo } from 'react';

interface DateSeparatorProps {
  date: Date | string;
}

const DateSeparator = memo(function DateSeparator({ date }: DateSeparatorProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if date is today
  const isToday =
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear();

  // Check if date is yesterday
  const isYesterday =
    dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear();

  // Format date
  let displayDate: string;
  if (isToday) {
    displayDate = 'Today';
  } else if (isYesterday) {
    displayDate = 'Yesterday';
  } else {
    // Format as "Oct 14, 2024"
    displayDate = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="flex justify-center my-4">
      <div className="bg-neutral-100 text-neutral-600 text-xs px-3 py-1 rounded-full">
        {displayDate}
      </div>
    </div>
  );
});

export default DateSeparator;
