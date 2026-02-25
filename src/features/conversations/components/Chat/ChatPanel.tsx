/**
 * Chat Panel Component (Refactored)
 * WhatsApp-style chat interface using unified chat architecture
 * Now with optimistic updates, typing indicators, and non-blocking input
 */

import { useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, User, MoreVertical, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Conversation } from '../../types';
import { SenderRole, MessageType } from '../../types/conversation.types';
import { useChatStore } from '../../stores/chatStore';
import { useConversationStore } from '../../stores/conversationStore';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { toggleAIMode } from '../../services/conversationApi';
import { queryKeys } from '@/lib/queryKeys';
import { useChatEngine } from '../../hooks/useChatEngine';
import { useZustandChatStorage } from '../../hooks/useChatStorage';
import UnifiedChatView from './UnifiedChatView';
import { chatApiService } from '../../services/chatApiService';
import { Avatar } from '@/components/ui/Avatar';
import { logger } from '@/lib/logger';
import { chatToasts } from '../../utils/chatToasts';
import { useConfirm } from '@/hooks/useConfirm';
import { useDeleteConversation } from '../../hooks/useDeleteConversation';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatPanelProps {
  conversation: Conversation;
  onBack?: () => void;
}

export default function ChatPanel({ conversation, onBack }: ChatPanelProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const queryClient = useQueryClient();
  const globalSelectedAgent = useAgentStore((state) => state.globalSelectedAgent);
  const selectConversation = useConversationStore((state) => state.selectConversation);
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const deleteMutation = useDeleteConversation();
  const user = useAuthStore((state) => state.user);
  const canDelete = user?.role === Role.SuperAdmin || user?.role === Role.Admin;

  // Fetch initial messages using Zustand store
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const loadMoreMessages = useChatStore((state) => state.loadMore);
  const hasMore = useChatStore((state) => state.hasMore);
  const isStoreLoading = useChatStore((state) => state.isLoading);

  // Use Zustand storage adapter (persistent)
  const storage = useZustandChatStorage();

  // Use unified chat engine with optimistic updates
  const chatEngine = useChatEngine({
    conversationId: conversation.id,
    agentId: globalSelectedAgent?.id,
    storage,
    enablePagination: true,
    senderRole: SenderRole.HumanAgent, // Always send as admin in conversations view
    onError: (err) => {
      logger.error('Chat error', err, {
        conversationId: conversation.id,
        component: 'ChatPanel',
      });
      chatToasts.sendError();
    },
    sendMessageFn: async (params) => {
      // Validate agent ID is present
      if (!params.agentId) {
        throw new Error('Agent ID is required to send messages');
      }

      // Conversations view: Always send as admin message
      // No AI response generation, just platform delivery
      const response = await chatApiService.sendMessage({
        conversationId: params.conversationId,
        message: params.message,
        senderRole: SenderRole.HumanAgent, // Mark as admin message
        messageType: params.messageType || MessageType.Text,
        attachments: params.attachments,
      });
      return response;
    },
  });

  // Toggle AI/Human mode mutation
  const toggleModeMutation = useMutation({
    mutationFn: (isAI: boolean) => toggleAIMode(conversation.id, isAI),
    onMutate: async (newIsAI) => {
      // Optimistically update the selected conversation in Zustand
      const updatedConversation = {
        ...conversation,
        is_ai: newIsAI,
      };
      selectConversation(updatedConversation);
      return { previousConversation: conversation };
    },
    onSuccess: (_data, newIsAI) => {
      // Invalidate conversations to refresh the list
      if (globalSelectedAgent?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations(globalSelectedAgent.id) });
      }
      chatToasts.modeSwitch(newIsAI);
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousConversation) {
        selectConversation(context.previousConversation);
      }
      chatToasts.modeSwitchError();
      logger.error('Failed to toggle AI/Human mode', error, {
        conversationId: conversation.id,
        currentMode: conversation.is_ai,
        attemptedMode: !conversation.is_ai,
      });
    },
  });

  const handleModeToggle = () => {
    toggleModeMutation.mutate(!conversation.is_ai);
  };

  // Handle conversation deletion with confirmation
  const handleDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: t('conversations.delete_confirm_title'),
      message: t('conversations.delete_confirm_message', { name: conversation.customer_name }),
      confirmText: t('conversations.delete_confirm_button'),
      variant: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(conversation.id, {
        onSuccess: () => {
          // Navigate back only after deletion succeeds
          onBack?.();
        },
      });
    }
  }, [confirm, conversation.id, conversation.customer_name, deleteMutation, onBack, t]);

  // Fetch messages on conversation change
  useEffect(() => {
    if (!conversation.id) return;
    fetchMessages(conversation.id, true); // true = refresh
  }, [conversation.id, fetchMessages]);

  // Extract profile picture
  const profilePictureUrl = conversation.customer_metadata?.profile_picture;

  // Custom header for WhatsApp-style UI
  // Using position: sticky to work correctly in both mobile and desktop layouts
  const customHeader = useMemo(
    () => (
      <div className="sticky top-0 left-0 right-0 z-20 bg-white border-b border-neutral-200 p-4 flex items-center gap-3 h-16">
        {/* Back button (mobile) */}
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label={t('conversations.go_back')}
          >
            {isRTL ? (
              <ArrowRight className="w-5 h-5" />
            ) : (
              <ArrowLeft className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Customer Avatar */}
        <Avatar src={profilePictureUrl} name={conversation.customer_name} size="md" />

        {/* Customer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-neutral-950 truncate">
              {conversation.customer_name}
            </h3>
            {/* Human mode indicator */}
            {!conversation.is_ai && (
              <User className="w-3.5 h-3.5 text-brand-mojeeb flex-shrink-0" />
            )}
          </div>

          {/* Source and topic - subtle secondary text */}
          {(conversation.topic || conversation.source !== 'web') && (
            <p className="text-xs text-neutral-600 truncate">
              {conversation.source !== 'web' && conversation.source}
              {conversation.source !== 'web' && conversation.topic && ' • '}
              {conversation.topic}
            </p>
          )}
        </div>

        {/* Three-dot menu with delete option (SuperAdmin & Admin only) */}
        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label={t('conversations.more_options')}
              >
                <MoreVertical className="w-5 h-5 text-neutral-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 me-2" />
                {deleteMutation.isPending ? t('conversations.deleting') : t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    ),
    [conversation, onBack, profilePictureUrl, handleDelete, deleteMutation.isPending, isRTL, canDelete, t]
  );

  // Handle load more with Zustand store
  const handleLoadMore = () => {
    loadMoreMessages(conversation.id);
  };

  return (
    <>
      {/* Container for sticky header + scrollable content */}
      <div className="h-full flex flex-col relative">
        {/* STICKY HEADER - Stays at top while scrolling */}
        {customHeader}

        {/* SCROLLABLE CONTENT - UnifiedChatView without header */}
        <UnifiedChatView
          messages={chatEngine.messages}
          isLoading={isStoreLoading}
          isAITyping={chatEngine.isAITyping}
          onSendMessage={chatEngine.sendMessage}
          onRetryMessage={chatEngine.retryMessage}
          enablePagination={true}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          enableAIToggle={true}
          isAIMode={conversation.is_ai}
          onModeToggle={handleModeToggle}
          placeholder={
            conversation.is_ai
              ? t('conversations.ai_mode_placeholder')
              : t('conversations.human_mode_placeholder')
          }
          conversationId={conversation.id}
          agentId={conversation.agent_id
          }
          className="bg-white flex-1 min-h-0"
        />
      </div>
      {ConfirmDialogComponent}
    </>
  );
}
