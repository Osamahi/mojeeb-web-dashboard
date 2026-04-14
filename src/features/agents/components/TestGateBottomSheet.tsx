/**
 * Test Gate Bottom Sheet
 * Shown on mobile when user tries to test agent without any knowledge base.
 * Prevents the "ugh moment" of bad responses by guiding to add knowledge first.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface TestGateBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddKnowledge: () => void;
  onTestAnyway: () => void;
}

export default function TestGateBottomSheet({
  isOpen,
  onClose,
  onAddKnowledge,
  onTestAnyway,
}: TestGateBottomSheetProps) {
  const { t } = useTranslation();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-40',
          'transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50',
          'bg-white rounded-t-2xl shadow-2xl',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          'safe-area-inset-bottom'
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-300" />
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-2">
          {/* Icon + Title */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              {t('test_gate.title')}
            </h3>
            <p className="text-sm text-neutral-600 mt-2 max-w-sm">
              {t('test_gate.description')}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                onClose();
                onAddKnowledge();
              }}
            >
              {t('test_gate.add_first')}
            </Button>
            <button
              onClick={() => {
                onClose();
                onTestAnyway();
              }}
              className="w-full py-2.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              {t('test_gate.test_anyway')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
