/**
 * Failed Messages page (SuperAdmin only)
 * Tracks AI response parsing failures across all agents
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { useInfiniteFailedMessages } from '../hooks/useFailedMessages';
import { FailedMessagesTable } from '../components/FailedMessagesTable';
import { agentService } from '@/features/agents/services/agentService';
import { useQuery } from '@tanstack/react-query';
import ConversationViewDrawer from '@/features/conversations/components/ConversationViewDrawer';
import type { FailedMessageFilters } from '../types';

export function FailedMessagesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search input (400ms)
  useEffect(() => {
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(debounceTimerRef.current);
  }, [search]);

  // Build filters with debounced search
  const filters: FailedMessageFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
    }),
    [debouncedSearch]
  );

  // Fetch all agents (for agent name mapping)
  const { data: agentsData } = useQuery({
    queryKey: ['agents', 'all'],
    queryFn: () => agentService.getAgents(),
  });

  // Create agent name mapping
  const agentNames = useMemo(() => {
    if (!agentsData) return {};
    return agentsData.reduce((acc, agent) => {
      acc[agent.id] = agent.name;
      return acc;
    }, {} as Record<string, string>);
  }, [agentsData]);

  // Data fetching with cursor pagination
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteFailedMessages(filters);

  // Handlers
  const handleViewConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedConversationId(null);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <BaseHeader
        title="Failed Messages"
        subtitle="Track AI response parsing failures across all agents"
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by error reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <div className="text-neutral-500 text-sm">Loading failed messages...</div>
        </div>
      ) : (
        <FailedMessagesTable
          items={data?.items || []}
          hasMore={hasNextPage || false}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          onViewConversation={handleViewConversation}
          agentNames={agentNames}
        />
      )}

      {/* Conversation View Drawer */}
      <ConversationViewDrawer
        conversationId={selectedConversationId}
        isOpen={!!selectedConversationId}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
