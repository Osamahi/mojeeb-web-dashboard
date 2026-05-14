/**
 * SideDrawer
 *
 * Generic side-drawer shell used by lead detail surfaces and anywhere else
 * a slide-from-edge panel is needed. Owns the cross-cutting concerns that
 * every drawer otherwise has to re-implement:
 *
 *   - Framer Motion enter/exit (backdrop fade + panel slide)
 *   - RTL-aware slide direction (slides from the user-perceived "end" edge)
 *   - ESC key to close
 *   - Body scroll lock while open
 *   - Backdrop click to close
 *   - Header with title + close button
 *
 * The body content is rendered as children — callers stay focused on their
 * own data fetching + UI, not on drawer plumbing.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Drawer title shown in the default header. Omit when the body already
   * renders its own header (e.g. ChatPanel) — the close button then floats
   * in the top corner instead, and no border-bottom is drawn.
   */
  title?: string;
  children: React.ReactNode;
  /** Tailwind max-width class for the panel. Defaults to `sm:max-w-xl`. */
  maxWidthClassName?: string;
  /** aria-label for the close button. Defaults to a localized "Close". */
  closeLabel?: string;
}

export function SideDrawer({
  isOpen,
  onClose,
  title,
  children,
  maxWidthClassName = 'sm:max-w-xl',
  closeLabel,
}: SideDrawerProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  // ESC closes the drawer. Inline editors inside the drawer body are expected
  // to stop event propagation with `e.nativeEvent.stopImmediatePropagation()`
  // so Escape only reaches us when no edit is in progress.
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Slide from the user-perceived "end" edge — right in LTR, left in RTL.
  const offscreenX = isRTL ? '-100%' : '100%';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            key="drawer"
            className={cn(
              'fixed top-0 end-0 bottom-0 z-50',
              'w-full bg-white shadow-2xl flex flex-col',
              maxWidthClassName
            )}
            initial={{ x: offscreenX }}
            animate={{ x: 0 }}
            exit={{ x: offscreenX }}
            transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.35 }}
          >
            {title ? (
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 flex-shrink-0">
                <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                  aria-label={closeLabel ?? t('conversation_drawer.close_title')}
                >
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>
            ) : (
              // Body renders its own header — float a close button in the
              // corner so the user always has an exit affordance.
              <div className="absolute top-0 end-0 p-4 z-10">
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/90 backdrop-blur-sm border border-neutral-200 shadow-sm hover:bg-neutral-50 transition-colors"
                  aria-label={closeLabel ?? t('conversation_drawer.close_title')}
                >
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>
            )}

            {title ? (
              <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
            ) : (
              // Headerless mode: body owns its own padding + scroll. Lets
              // ChatPanel keep its sticky header without double padding.
              <div className="flex-1 min-h-0">{children}</div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
