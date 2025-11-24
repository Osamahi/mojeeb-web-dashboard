/**
 * Chat Panel Component (Refactored)
 * WhatsApp-style chat interface using unified chat architecture
 * Now with optimistic updates, typing indicators, and non-blocking input
 */

import { useMemo, useEffect } from 'react';
import { ArrowLeft, Bot, User } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Conversation } from '../../types';
import { useChatStore } from '../../stores/chatStore';
import { useConversationStore } from '../../stores/conversationStore';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { toggleAIMode } from '../../services/conversationService';
import { queryKeys } from '@/lib/queryKeys';
import { useChatEngine } from '../../hooks/useChatEngine';
import { useZustandChatStorage } from '../../hooks/useChatStorage';
import UnifiedChatView from './UnifiedChatView';
import { chatApiService } from '../../services/chatApiService';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { logger } from '@/lib/logger';
import { chatToasts } from '../../utils/chatToasts';

interface ChatPanelProps {
  conversation: Conversation;
  onBack?: () => void;
}

export default function ChatPanel({ conversation, onBack }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const globalSelectedAgent = useAgentStore((state) => state.globalSelectedAgent);
  const selectConversation = useConversationStore((state) => state.selectConversation);

  // Fetch initial messages using Zustand store
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const loadMoreMessages = useChatStore((state) => state.loadMore);
  const hasMore = useChatStore((state) => state.hasMore);

  // Use Zustand storage adapter (persistent)
  const storage = useZustandChatStorage();

  // Use unified chat engine with optimistic updates
  const chatEngine = useChatEngine({
    conversationId: conversation.id,
    agentId: globalSelectedAgent?.id,
    storage,
    enablePagination: true,
    onError: (err) => {
      logger.error('Chat error', err, {
        conversationId: conversation.id,
        component: 'ChatPanel',
      });
      chatToasts.sendError();
    },
    sendMessageFn: async (params) => {
      // Send message with AI response
      const response = await chatApiService.sendMessageWithAI({
        conversationId: params.conversationId,
        message: params.message,
        agentId: params.agentId!,
      });

      // Return as ChatMessage format (backend returns user message)
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

  // Fetch messages on conversation change
  useEffect(() => {
    if (!conversation.id) return;
    fetchMessages(conversation.id, true); // true = refresh
  }, [conversation.id, fetchMessages]);

  // Extract profile picture
  const profilePictureUrl = conversation.customer_metadata?.profile_picture;

  // Custom header for WhatsApp-style UI
  const customHeader = useMemo(
    () => (
      <div className="bg-white border-b border-neutral-200 p-4 flex items-center gap-3 flex-shrink-0">
        {/* Back button (mobile) */}
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Go back to conversations list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Customer Avatar */}
        <Avatar src={profilePictureUrl} name={conversation.customer_name} size="md" />

        {/* Customer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-neutral-950 truncate">
              {conversation.customer_name}
            </h3>

            {/* AI/Human Mode Indicator */}
            {conversation.is_ai ? (
              <Badge variant="primary" className="text-xs gap-1">
                <Bot className="w-3 h-3" />
                AI Mode
              </Badge>
            ) : (
              <Badge variant="warning" className="text-xs gap-1">
                <User className="w-3 h-3" />
                Human Mode
              </Badge>
            )}
          </div>

          {/* Topic or source */}
          {conversation.topic && (
            <p className="text-xs text-neutral-600 truncate">Topic: {conversation.topic}</p>
          )}
        </div>

        {/* Source badge */}
        {conversation.source !== 'web' && (
          <Badge variant="default" className="text-xs">
            {conversation.source}
          </Badge>
        )}
      </div>
    ),
    [conversation, onBack, profilePictureUrl]
  );

  // Handle load more with Zustand store
  const handleLoadMore = () => {
    loadMoreMessages(conversation.id);
  };

  return (
    <UnifiedChatView
      messages={chatEngine.messages}
      isLoading={chatEngine.isLoading}
      isAITyping={chatEngine.isAITyping}
      onSendMessage={chatEngine.sendMessage}
      onRetryMessage={chatEngine.retryMessage}
      header={customHeader}
      enablePagination={true}
      onLoadMore={handleLoadMore}
      hasMore={hasMore}
      enableAIToggle={true}
      isAIMode={conversation.is_ai}
      onModeToggle={handleModeToggle}
      placeholder={
        conversation.is_ai
          ? 'Type a message... (AI will respond)'
          : 'Type a message... (You are responding)'
      }
      className="bg-neutral-50"
    />
  );
}
