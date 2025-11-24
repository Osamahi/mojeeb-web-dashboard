/**
 * Test Chat Panel Component
 * Mobile-optimized slide-out panel for test chat functionality
 * Slides in from right with backdrop overlay
 */

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import TestChat from './TestChat';

interface TestChatPanelProps {
  agentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TestChatPanel({ agentId, isOpen, onClose }: TestChatPanelProps) {
  // Close panel on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden',
          'transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 bg-white shadow-2xl',
          'transition-transform duration-300 ease-out lg:hidden',
          'w-full sm:w-[400px]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Test Chat Panel"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white">
          <h2 className="text-lg font-semibold text-neutral-950">Test Chat</h2>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg hover:bg-neutral-100 transition-colors',
              'min-w-[44px] min-h-[44px] flex items-center justify-center'
            )}
            aria-label="Close test chat panel"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Chat Content - Full height minus header */}
        <div className="h-[calc(100%-57px)]">
          <TestChat agentId={agentId} />
        </div>
      </div>
    </>
  );
}
