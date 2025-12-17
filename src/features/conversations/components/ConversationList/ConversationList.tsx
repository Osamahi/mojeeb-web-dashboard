/**
 * Conversation List Component
 * WhatsApp-style conversation list with real-time updates via React Query
 * Infinite scroll pagination for better performance
 */

import { useRef, UIEvent, useMemo } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useInfiniteConversations } from '../../hooks/useInfiniteConversations';
import { useConversationSubscription } from '../../hooks/useConversationSubscription';
import { useConversationStore } from '../../stores/conversationStore';
import ConversationListItem from './ConversationListItem';
import { ConversationListSkeleton, NoConversationsState } from '../shared/LoadingSkeleton';
import { Button } from '@/components/ui/Button';

interface ConversationListProps {
  agentId: string;
  onConversationSelect: (conversationId: string) => void;
}

export default function ConversationList({ agentId, onConversationSelect }: ConversationListProps) {
  // Fetch conversations with infinite scroll via React Query
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useInfiniteConversations();

  // Subscribe to real-time updates - automatically syncs with React Query cache
  useConversationSubscription();

  // UI state from Zustand store
  const selectedConversation = useConversationStore((state) => state.selectedConversation);
  const selectConversation = useConversationStore((state) => state.selectConversation);

  const listRef = useRef<HTMLDivElement>(null);

  // Flatten paginated data into single array
  const conversations = useMemo(() => {
    return data?.pages.flatMap((page) => page) ?? [];
  }, [data]);

  // Handle scroll for infinite loading
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrolledToBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 200;

    if (scrolledToBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
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
    refetch();
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
            disabled={isRefetching}
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
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
          disabled={isRefetching}
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
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
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
            <span className="ml-2 text-sm text-neutral-500">Loading more conversations...</span>
          </div>
        )}

        {/* End of list indicator */}
        {!hasNextPage && conversations.length > 0 && (
          <div className="text-center py-4 text-sm text-neutral-500">
            No more conversations
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : 'Failed to load conversations'}
          </p>
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
