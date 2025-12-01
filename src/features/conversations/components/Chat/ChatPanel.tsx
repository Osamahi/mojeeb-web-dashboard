/**
 * Chat Panel Component (Refactored)
 * WhatsApp-style chat interface using unified chat architecture
 * Now with optimistic updates, typing indicators, and non-blocking input
 */

import { useMemo, useEffect, useState } from 'react';
import { ArrowLeft, Bot, User, MoreVertical, Trash2 } from 'lucide-react';
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
import { useConfirm } from '@/hooks/useConfirm';
import { useDeleteConversation } from '../../hooks/useDeleteConversation';
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
  const queryClient = useQueryClient();
  const globalSelectedAgent = useAgentStore((state) => state.globalSelectedAgent);
  const selectConversation = useConversationStore((state) => state.selectConversation);
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const deleteMutation = useDeleteConversation();

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
      // Validate agent ID is present
      if (!params.agentId) {
        throw new Error('Agent ID is required to send messages');
      }

      // Send message with AI response
      const response = await chatApiService.sendMessageWithAI({
        conversationId: params.conversationId,
        message: params.message,
        agentId: params.agentId,
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

  // Handle conversation deletion with confirmation
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Conversation',
      message: `Are you sure you want to delete the conversation with "${conversation.customer_name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(conversation.id);

      // Navigate back after successful deletion if onBack is provided
      if (onBack) {
        onBack();
      }
    }
  };

  // Fetch messages on conversation change
  useEffect(() => {
    if (!conversation.id) return;
    fetchMessages(conversation.id, true); // true = refresh
  }, [conversation.id, fetchMessages]);

  // Visual Viewport API listener for iOS keyboard handling
  // Ensures header stays visible when keyboard opens
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleViewportResize = () => {
      // On iOS, when keyboard opens, visualViewport shrinks
      // But our fixed header at top: 0 automatically stays visible!
      // This listener is here for future enhancements (e.g., adjusting composer)
      const keyboardHeight = window.innerHeight - window.visualViewport.height;

      if (keyboardHeight > 100) {
        // Keyboard is open - header remains fixed at top: 0
        // No adjustment needed with position: fixed!
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportResize);
    return () => {
      window.visualViewport.removeEventListener('resize', handleViewportResize);
    };
  }, []);

  // Extract profile picture
  const profilePictureUrl = conversation.customer_metadata?.profile_picture;

  // Custom header for WhatsApp-style UI
  // Using position: fixed for iOS keyboard reliability
  const customHeader = useMemo(
    () => (
      <div className="fixed top-0 left-0 right-0 z-20 bg-white border-b border-neutral-200 p-4 flex items-center gap-3 h-16">
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

        {/* Three-dot menu with delete option */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="More options"
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
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    [conversation, onBack, profilePictureUrl, handleDelete, deleteMutation.isPending]
  );

  // Handle load more with Zustand store
  const handleLoadMore = () => {
    loadMoreMessages(conversation.id);
  };

  return (
    <>
      {/* Container for fixed header + scrollable content */}
      <div className="h-full flex flex-col relative">
        {/* FIXED HEADER - Always visible, outside scroll container */}
        {customHeader}

        {/* SCROLLABLE CONTENT - UnifiedChatView without header */}
        <UnifiedChatView
          messages={chatEngine.messages}
          isLoading={chatEngine.isLoading}
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
              ? 'Type a message... (AI will respond)'
              : 'Type a message... (You are responding)'
          }
          className="bg-neutral-50 flex-1 pt-16"
        />
      </div>
      {ConfirmDialogComponent}
    </>
  );
}
