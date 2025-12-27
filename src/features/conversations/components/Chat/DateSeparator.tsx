/**
 * Date Separator Component
 * Displays date headers between message groups
 * Format: "Today", "Yesterday", or "Oct 14, 2024"
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';

interface DateSeparatorProps {
  date: Date | string;
}

const DateSeparator = memo(function DateSeparator({ date }: DateSeparatorProps) {
  const { t, i18n } = useTranslation();
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
    displayDate = t('date_separator.today');
  } else if (isYesterday) {
    displayDate = t('date_separator.yesterday');
  } else {
    // Format as "Oct 14, 2024" - use current locale
    displayDate = dateObj.toLocaleDateString(i18n.language, {
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
