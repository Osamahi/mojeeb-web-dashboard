/**
 * Base Modal Component
 * Reusable modal wrapper with consistent styling and behavior
 *
 * Features:
 * - Portal rendering for proper z-index layering
 * - Framer Motion animations for smooth transitions
 * - ESC key to close
 * - Click outside to close
 * - Keyboard navigation support
 * - Prevent body scroll when open
 * - Configurable sizes
 * - Accessibility built-in (ARIA attributes)
 */

import { useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with fade animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
            onClick={handleBackdropClick}
          />

          {/* Modal Container */}
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
              className={cn(
                'bg-white rounded-lg shadow-xl w-full max-h-[90vh] flex flex-col',
                maxWidthClasses[maxWidth],
                className
              )}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              aria-describedby={subtitle ? 'modal-subtitle' : undefined}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-200 flex-shrink-0">
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
                    aria-label={t('common.close')}
                  >
                    <X className="w-5 h-5 text-neutral-600" />
                  </button>
                )}
              </div>

              {/* Content with scroll */}
              <div className={cn('flex-1 overflow-y-auto p-4', contentClassName)}>
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Render in portal for proper z-index layering
  return createPortal(modal, document.body);
};
