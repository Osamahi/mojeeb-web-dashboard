/**
 * Support Button Component
 * Opens Mojeeb chat widget for customer support
 * Reusable across auth pages and dashboard
 */

import { MessagesSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface SupportButtonProps {
  /** Visual style variant */
  variant?: 'default' | 'subtle';
  /** Additional CSS classes */
  className?: string;
}

export const SupportButton = ({
  variant = 'default',
  className
}: SupportButtonProps) => {
  const { t } = useTranslation();

  const handleClick = () => {
    if (window.MojeebWidget) {
      window.MojeebWidget.open();
    } else {
      console.warn('[SupportButton] Mojeeb Widget is not loaded yet. Please wait for the script to load.');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group inline-flex items-center gap-2 rounded-md transition-colors duration-200',
        variant === 'default' && [
          'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100',
          'p-3 w-full justify-center',
        ],
        variant === 'subtle' && [
          'text-neutral-500 hover:text-neutral-700',
          'text-sm',
        ],
        className
      )}
      aria-label={t('navigation.support')}
    >
      <MessagesSquare className="w-4 h-4" aria-hidden="true" />
      <span>{t('navigation.support')}</span>
    </button>
  );
};
