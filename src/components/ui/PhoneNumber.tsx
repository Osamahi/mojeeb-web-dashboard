/**
 * PhoneNumber Component
 *
 * Semantic wrapper for phone number display that ensures:
 * - LTR direction (even in RTL/Arabic contexts)
 * - Western numerals (0-9) instead of Arabic-Indic (٠-٩)
 * - Consistent formatting via formatPhoneNumber utility
 *
 * Usage:
 *   <PhoneNumber value="+201096569391" />
 *   <PhoneNumber value="+201096569391" className="text-sm" />
 *   <a href="tel:+201096569391"><PhoneNumber value="+201096569391" /></a>
 */

import { formatPhoneNumber } from '@/features/leads/utils/formatting';

interface PhoneNumberProps {
  value: string;
  className?: string;
}

export function PhoneNumber({ value, className }: PhoneNumberProps) {
  return (
    <span dir="ltr" className={className}>
      {formatPhoneNumber(value)}
    </span>
  );
}
