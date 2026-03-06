/**
 * Table view for failed messages (desktop + mobile)
 * Shows AI response errors with expandable raw response and conversation link
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import type { FailedMessage } from '../types';
import { useDateLocale } from '@/lib/dateConfig';

interface FailedMessagesTableProps {
  items: FailedMessage[];
  hasMore: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onViewConversation: (conversationId: string) => void;
  agentNames: Record<string, string>;
}

export function FailedMessagesTable({
  items,
  hasMore,
  isLoading,
  isFetchingNextPage,
  onLoadMore,
  onViewConversation,
  agentNames,
}: FailedMessagesTableProps) {
  const { formatSmartTimestamp } = useDateLocale();
  const observerTarget = useRef<HTMLDivElement>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isFetchingNextPage, onLoadMore]);

  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  if (items.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
        <div className="text-neutral-500 text-sm">
          No failed messages found.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Error Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Agent
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Error Reason
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Parsing Method
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {items.map((item) => (
              <TableRow
                key={item.id}
                item={item}
                agentName={agentNames[item.agentId] || 'Unknown Agent'}
                isExpanded={expandedRows.has(item.id)}
                onToggle={() => toggleRow(item.id)}
                onViewConversation={onViewConversation}
                formatSmartTimestamp={formatSmartTimestamp}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-neutral-200">
        {items.map((item) => (
          <MobileCard
            key={item.id}
            item={item}
            agentName={agentNames[item.agentId] || 'Unknown Agent'}
            isExpanded={expandedRows.has(item.id)}
            onToggle={() => toggleRow(item.id)}
            onViewConversation={onViewConversation}
            formatSmartTimestamp={formatSmartTimestamp}
          />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={observerTarget} className="py-4 text-center border-t border-neutral-200">
          {isFetchingNextPage ? (
            <div className="text-neutral-500 text-sm">Loading more...</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Error type badge component
function ErrorTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
      {type.replace(/_/g, ' ')}
    </span>
  );
}

// Platform badge component
function PlatformBadge({ platform }: { platform: string | null }) {
  if (!platform) return <span className="text-sm text-neutral-400">-</span>;

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
      {platform}
    </span>
  );
}

// Table row component
interface TableRowProps {
  item: FailedMessage;
  agentName: string;
  isExpanded: boolean;
  onToggle: () => void;
  onViewConversation: (conversationId: string) => void;
  formatSmartTimestamp: (date: string) => string;
}

function TableRow({
  item,
  agentName,
  isExpanded,
  onToggle,
  onViewConversation,
  formatSmartTimestamp,
}: TableRowProps) {
  const handleViewConversation = useCallback(
    () => onViewConversation(item.conversationId),
    [item.conversationId, onViewConversation]
  );

  return (
    <>
      <tr className="hover:bg-neutral-50 transition-colors">
        {/* Error Type */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggle}
              className="p-1 hover:bg-neutral-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-neutral-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-600" />
              )}
            </button>
            <ErrorTypeBadge type={item.errorType} />
          </div>
        </td>

        {/* Agent */}
        <td className="px-4 py-3">
          <span className="text-sm text-neutral-700">{agentName}</span>
        </td>

        {/* Platform */}
        <td className="px-4 py-3">
          <PlatformBadge platform={item.platform} />
        </td>

        {/* Error Reason */}
        <td className="px-4 py-3">
          <span className="text-sm text-neutral-600 line-clamp-2 max-w-[300px]">
            {item.errorReason}
          </span>
        </td>

        {/* Parsing Method */}
        <td className="px-4 py-3">
          <span className="text-sm text-neutral-600">
            {item.parsingMethod || '-'}
          </span>
        </td>

        {/* Created */}
        <td className="px-4 py-3">
          <span className="text-sm text-neutral-600">
            {formatSmartTimestamp(item.createdAt)}
          </span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={handleViewConversation}
              className="p-1.5 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="View Conversation"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded row - Raw Response */}
      {isExpanded && (
        <tr className="bg-neutral-50">
          <td colSpan={7} className="px-4 py-3">
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-neutral-700">
                  Raw Response:
                </span>
                <pre className="text-xs text-neutral-900 mt-1 whitespace-pre-wrap bg-neutral-100 p-3 rounded-lg border border-neutral-200 max-h-64 overflow-y-auto font-mono">
                  {item.rawResponse || '(empty)'}
                </pre>
              </div>
              <div className="flex gap-4 text-xs text-neutral-500">
                <span>
                  <span className="font-medium">Conversation ID:</span>{' '}
                  <code className="bg-neutral-100 px-1.5 py-0.5 rounded">{item.conversationId}</code>
                </span>
                <span>
                  <span className="font-medium">Organization ID:</span>{' '}
                  <code className="bg-neutral-100 px-1.5 py-0.5 rounded">{item.organizationId}</code>
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Mobile card component
interface MobileCardProps {
  item: FailedMessage;
  agentName: string;
  isExpanded: boolean;
  onToggle: () => void;
  onViewConversation: (conversationId: string) => void;
  formatSmartTimestamp: (date: string) => string;
}

function MobileCard({
  item,
  agentName,
  isExpanded,
  onToggle,
  onViewConversation,
  formatSmartTimestamp,
}: MobileCardProps) {
  const handleViewConversation = useCallback(
    () => onViewConversation(item.conversationId),
    [item.conversationId, onViewConversation]
  );

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ErrorTypeBadge type={item.errorType} />
            <PlatformBadge platform={item.platform} />
          </div>
          <div className="text-xs text-neutral-600 mt-1">
            <span className="font-medium">Agent:</span> {agentName}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleViewConversation}
            className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="View Conversation"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={onToggle}
            className="p-2 text-neutral-600 hover:bg-neutral-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
        {item.errorReason}
      </p>

      <div className="flex items-center gap-3 text-xs text-neutral-500">
        <span>{item.parsingMethod || 'No method'}</span>
        <span>{formatSmartTimestamp(item.createdAt)}</span>
      </div>

      {/* Expanded - Raw Response */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-neutral-200">
          <span className="text-xs font-medium text-neutral-700">
            Raw Response:
          </span>
          <pre className="text-xs text-neutral-900 mt-1 whitespace-pre-wrap bg-neutral-100 p-3 rounded-lg border border-neutral-200 max-h-48 overflow-y-auto font-mono">
            {item.rawResponse || '(empty)'}
          </pre>
        </div>
      )}
    </div>
  );
}
