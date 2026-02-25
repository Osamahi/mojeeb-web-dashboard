/**
 * Confirmation Dialog Component
 * Feature-complete confirmation dialog with portal rendering, keyboard support, and accessibility
 * Standardized implementation - DO NOT CREATE DUPLICATES
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  isOpen?: boolean;  // Support both isOpen and open
  open?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) => {
  const { t } = useTranslation();
  const dialogOpen = isOpen ?? open ?? false;

  // Use translations as defaults if not provided
  const finalConfirmText = confirmText || t('common.confirm');
  const finalCancelText = cancelText || t('common.cancel');

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    if (dialogOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [dialogOpen, isLoading, onClose]);

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirm action failed:', error);
      // Don't close the dialog if confirm action fails
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not the dialog content
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  if (!dialogOpen) return null;

  const icon = variant === 'danger' ? (
    <AlertTriangle className="w-6 h-6 text-error" />
  ) : (
    <Info className="w-6 h-6 text-brand-mojeeb" />
  );

  const dialog = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Dialog Container */}
      <div
        className={cn(
          'relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className={cn(
            'absolute top-4 right-4 text-neutral-400 hover:text-neutral-600',
            'transition-colors rounded-md p-1 hover:bg-neutral-100',
            'disabled:opacity-50 disabled:pointer-events-none'
          )}
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dialog Content */}
        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className={cn(
                'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                variant === 'danger' ? 'bg-error/10' : 'bg-brand-mojeeb/10'
              )}
            >
              {icon}
            </div>
            <div className="flex-1 pt-1">
              <h2
                id="dialog-title"
                className="text-lg font-semibold text-neutral-950 mb-2"
              >
                {title}
              </h2>
              <p
                id="dialog-description"
                className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line"
              >
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-6">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {finalCancelText}
            </Button>
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? t('common.loading') : finalConfirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render in portal for proper z-index layering
  return createPortal(dialog, document.body);
};
