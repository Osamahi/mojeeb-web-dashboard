/**
 * Conversation View Drawer
 *
 * Side-drawer wrapper around ChatPanel for viewing a conversation from
 * other contexts (Leads page, Action Executions, Failed Messages, Follow-ups).
 *
 * Uses the shared `SideDrawer` shell so the animation, ESC handling, body
 * scroll lock, and RTL slide direction are identical to every other side
 * drawer in the app. Renders no title header — ChatPanel has its own sticky
 * header — so SideDrawer floats a close button in the corner instead.
 */

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { SideDrawer } from '@/components/ui/SideDrawer';
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

  // Fetch conversation when drawer opens.
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

  // Smart-read: keep the conversation marked read while it's open, even if a
  // new message arrives mid-view.
  useEffect(() => {
    if (isOpen && conversation && !conversation.is_read) {
      markAsRead(conversation.id);
    }
  }, [isOpen, conversation?.id, conversation?.is_read, markAsRead]);

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose}>
      {/* No `title` → SideDrawer renders no header bar and floats a close
          button in the corner; ChatPanel's sticky header becomes the visual
          header of the drawer. */}
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
        // hideLeadButton: this drawer is opened from contexts that already
        // represent the lead (Leads page "View conversation", Action
        // Executions, Failed Messages, Follow-ups). Showing "View lead" there
        // would create a redundant lead ↔ conversation navigation loop.
        <ChatPanel conversation={conversation} onBack={onClose} hideLeadButton />
      ) : null}
    </SideDrawer>
  );
}
