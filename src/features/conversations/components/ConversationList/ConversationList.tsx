/**
 * Conversation List Component
 * WhatsApp-style conversation list with infinite scroll and real-time updates
 */

import { useEffect, useRef, UIEvent } from 'react';
import { RefreshCw } from 'lucide-react';
import { useConversationStore } from '../../stores/conversationStore';
import ConversationListItem from './ConversationListItem';
import { ConversationListSkeleton, NoConversationsState } from '../shared/LoadingSkeleton';
import { Button } from '@/components/ui/Button';

interface ConversationListProps {
  agentId: string;
  onConversationSelect: (conversationId: string) => void;
}

export default function ConversationList({ agentId, onConversationSelect }: ConversationListProps) {
  const {
    conversations,
    selectedConversation,
    isLoading,
    hasMore,
    error,
    fetchConversations,
    selectConversation,
    loadMore,
    subscribe,
    unsubscribe,
  } = useConversationStore();

  const listRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Initial fetch and subscribe on mount or agent change
  useEffect(() => {
    if (!agentId) return;

    // Fetch conversations
    fetchConversations(agentId, true);

    // Subscribe to real-time updates
    subscribe(agentId);

    return () => {
      // Unsubscribe on unmount
      unsubscribe();
    };
  }, [agentId]); // Only agentId dependency to avoid loops

  // Handle scroll for infinite loading
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrolledToBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 200;

    if (scrolledToBottom && hasMore && !isLoading) {
      loadMore(agentId);
    }
  };

  // Handle conversation selection
  const handleSelect = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      selectConversation(conversation);
      onConversationSelect(conversationId);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchConversations(agentId, true);
  };

  // Loading state - initial load
  if (isLoading && conversations.length === 0) {
    return (
      <div className="h-full overflow-hidden bg-neutral-50">
        <div className="h-14 bg-white border-b border-neutral-200 flex items-center px-4">
          <h2 className="text-lg font-semibold text-neutral-950">Conversations</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100%-3.5rem)]">
          <ConversationListSkeleton />
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && conversations.length === 0) {
    return (
      <div className="h-full flex flex-col bg-neutral-50">
        <div className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4">
          <h2 className="text-lg font-semibold text-neutral-950">Conversations</h2>
          <Button
            onClick={handleRefresh}
            className="p-2"
            variant="ghost"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1">
          <NoConversationsState />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-neutral-50">
      {/* Header */}
      <div className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-neutral-950">
          Conversations ({conversations.length})
        </h2>
        <Button
          onClick={handleRefresh}
          className="p-2"
          variant="ghost"
          title="Refresh"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Conversation List */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-2 space-y-1"
        onScroll={handleScroll}
      >
        {conversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            isSelected={selectedConversation?.id === conversation.id}
            onSelect={() => handleSelect(conversation.id)}
          />
        ))}

        {/* Loading more indicator */}
        {isLoading && conversations.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        )}

        {/* No more conversations */}
        {!hasMore && conversations.length > 0 && (
          <div className="text-center py-4 text-sm text-neutral-500">
            No more conversations
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{error}</p>
          <Button
            onClick={handleRefresh}
            className="mt-2"
            variant="ghost"
            size="sm"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
