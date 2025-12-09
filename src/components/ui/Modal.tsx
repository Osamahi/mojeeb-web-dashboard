import { type HTMLAttributes, type ReactNode, forwardRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ className, isOpen, onClose, title, description, children, size = 'md', ...props }, ref) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
              onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                ref={ref}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                  'relative w-full bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col',
                  sizeClasses[size],
                  className
                )}
                onClick={(e) => e.stopPropagation()}
                {...props}
              >
                {/* Header */}
                {(title || description) && (
                  <div className="px-6 py-4 border-b border-neutral-200 flex-shrink-0">
                    <div className="flex items-start justify-between">
                      <div>
                        {title && (
                          <h2 className="text-xl font-semibold text-neutral-900">
                            {title}
                          </h2>
                        )}
                        {description && (
                          <p className="mt-1 text-sm text-neutral-600">
                            {description}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={onClose}
                        className="ml-4 p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                      >
                        <X className="w-5 h-5 text-neutral-500" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {children}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>,
      document.body
    );
  }
);

Modal.displayName = 'Modal';
