/**
 * Conversation View Drawer Component
 * Slides in from right side as an overlay
 * Full-height drawer for viewing conversation from other contexts (e.g., Leads)
 */

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { fetchConversationById } from '../services/conversationApi';
import ChatPanel from './Chat/ChatPanel';
import type { Conversation } from '../types';
import { useMarkConversationAsRead } from '../hooks/useMarkConversationAsRead';

interface ConversationViewDrawerProps {
  conversationId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ConversationViewDrawer({
  conversationId,
  isOpen,
  onClose,
}: ConversationViewDrawerProps) {
  const { t } = useTranslation();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate: markAsRead } = useMarkConversationAsRead();

  // Fetch conversation when drawer opens
  useEffect(() => {
    if (!isOpen || !conversationId) {
      setConversation(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchConversationById(conversationId)
      .then((data) => {
        setConversation(data);
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.error('Error loading conversation:', err);
        }
        setError(t('conversation_drawer.failed_message'));
        toast.error(t('conversation_drawer.failed_title'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [conversationId, isOpen, t]);

  // Smart read logic: Mark as read when drawer opens OR when becomes unread while open
  // This ensures conversations stay read while user is viewing them, even if new messages arrive
  useEffect(() => {
    if (isOpen && conversation && !conversation.is_read) {
      markAsRead(conversation.id);
    }
  }, [isOpen, conversation?.id, conversation?.is_read, markAsRead]);

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
          'fixed top-0 end-0 bottom-0 z-50',
          'w-full sm:w-[600px] max-w-[90vw]',
          'bg-white shadow-2xl',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Close Button */}
        <div className="absolute top-0 end-0 p-4 z-10">
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg bg-white/90 backdrop-blur-sm',
              'border border-neutral-200 shadow-sm',
              'hover:bg-neutral-50 transition-colors'
            )}
            title={t('conversation_drawer.close_title')}
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <div className="h-full">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center p-6">
              <Loader2 className="w-12 h-12 animate-spin text-neutral-400 mb-4" />
              <p className="text-sm text-neutral-600">{t('conversation_drawer.loading')}</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-neutral-900 font-medium mb-2">{t('conversation_drawer.failed_title')}</p>
              <p className="text-sm text-neutral-600 max-w-sm mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                {t('conversation_drawer.close_button')}
              </button>
            </div>
          ) : conversation ? (
            <ChatPanel conversation={conversation} onBack={onClose} />
          ) : null}
        </div>
      </div>
    </>
  );
}
