/**
 * Floating Action Button (FAB)
 * Mobile-friendly circular action button that floats in bottom-right corner
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

interface FloatingActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  icon?: React.ReactNode;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  disabled = false,
  ariaLabel,
  icon,
}) => {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || t('fab.continue')}
      className={`
        fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-10
        w-14 h-14 sm:w-16 sm:h-16
        rounded-full
        flex items-center justify-center
        shadow-lg hover:shadow-xl
        transition-all duration-200
        ${
          disabled
            ? 'bg-neutral-300 cursor-not-allowed'
            : 'bg-black text-white hover:scale-105 active:scale-95'
        }
      `}
    >
      {icon || (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      )}
    </button>
  );
};
