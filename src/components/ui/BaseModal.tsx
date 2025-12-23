/**
 * Base Modal Component
 * Reusable modal wrapper with consistent styling and behavior
 *
 * Features:
 * - Portal rendering for proper z-index layering
 * - ESC key to close
 * - Click outside to close
 * - Keyboard navigation support
 * - Prevent body scroll when open
 * - Configurable sizes
 * - Accessibility built-in (ARIA attributes)
 */

import { useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BaseModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Optional subtitle/description below title */
  subtitle?: string;
  /** Modal content */
  children: ReactNode;
  /** Maximum width of modal */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Whether to show close button in header */
  showCloseButton?: boolean;
  /** Whether to allow closing via ESC key or clicking outside */
  closable?: boolean;
  /** Whether the modal is in a loading/processing state */
  isLoading?: boolean;
  /** Optional className for the modal container */
  className?: string;
  /** Optional className for the content area */
  contentClassName?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export const BaseModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
  showCloseButton = true,
  closable = true,
  isLoading = false,
  className,
  contentClassName,
}: BaseModalProps) => {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closable && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closable, isLoading, onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget && closable && !isLoading) {
      onClose();
    }
  };

  const handleClose = () => {
    if (!isLoading && closable) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div
        className={cn(
          'bg-white rounded-lg shadow-xl w-full',
          maxWidthClasses[maxWidth],
          'animate-in fade-in-0 zoom-in-95 duration-200',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={subtitle ? 'modal-subtitle' : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex-1 pr-8">
            <h2
              id="modal-title"
              className="text-xl font-semibold text-neutral-950"
            >
              {title}
            </h2>
            {subtitle && (
              <p
                id="modal-subtitle"
                className="text-sm text-neutral-600 mt-1"
              >
                {subtitle}
              </p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={handleClose}
              disabled={isLoading}
              className={cn(
                'p-2 hover:bg-neutral-100 rounded-lg transition-colors',
                'disabled:opacity-50 disabled:pointer-events-none'
              )}
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-neutral-600" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className={cn('p-4', contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );

  // Render in portal for proper z-index layering
  return createPortal(modal, document.body);
};
