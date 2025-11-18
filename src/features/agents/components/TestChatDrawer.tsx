/**
 * Test Chat Drawer Component
 * Slides in from right side as an overlay
 * Full-height drawer for testing agent
 */

import { useEffect } from 'react';
import { X } from 'lucide-react';
import TestChat from './TestChat';
import { cn } from '@/lib/utils';

interface TestChatDrawerProps {
  agentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TestChatDrawer({
  agentId,
  isOpen,
  onClose,
}: TestChatDrawerProps) {
  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50',
          'w-full sm:w-[600px] max-w-[90vw]',
          'bg-white shadow-2xl',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="absolute top-0 right-0 p-4 z-10">
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg bg-white/90 backdrop-blur-sm',
              'border border-neutral-200 shadow-sm',
              'hover:bg-neutral-50 transition-colors'
            )}
            title="Close (ESC)"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Test Chat Content */}
        <div className="h-full">
          <TestChat agentId={agentId} />
        </div>
      </div>
    </>
  );
}
