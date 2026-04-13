import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { STAGE_LABELS, type FunnelRecentEvent } from '../types/funnel.types';

interface FunnelEventsTableProps {
  events: FunnelRecentEvent[];
  isLoading: boolean;
  hasMore: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function FunnelEventsTable({ events, isLoading, hasMore, isFetchingNextPage, fetchNextPage }: FunnelEventsTableProps) {
  useInfiniteScroll({
    fetchNextPage,
    hasMore,
    isFetching: isFetchingNextPage,
    containerSelector: '[data-funnel-events]',
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <div className="h-4 bg-neutral-100 rounded w-32 mb-4 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-neutral-50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6" data-funnel-events>
      <h3 className="text-sm font-medium text-neutral-500 mb-4">Recent Activity</h3>

      {events.length === 0 ? (
        <p className="text-neutral-400 text-sm text-center py-8">
          No events yet. Funnel events will appear here as users go through the signup flow.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="pb-2 pr-4 font-medium">Event</th>
                  <th className="pb-2 pr-4 font-medium">User</th>
                  <th className="pb-2 pr-4 font-medium">Agent</th>
                  <th className="pb-2 pr-4 font-medium">Referrer</th>
                  <th className="pb-2 pr-4 font-medium">Session</th>
                  <th className="pb-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-2.5 pr-4">
                      <span className="font-medium text-neutral-800">{STAGE_LABELS[e.eventName] || e.eventName}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="min-w-0">
                        <p className="text-neutral-800 truncate">{e.userName || 'Anonymous'}</p>
                        {e.userEmail && (
                          <p className="text-xs text-neutral-400 truncate">{e.userEmail}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-neutral-600">{e.agentName || '-'}</td>
                    <td className="py-2.5 pr-4 text-neutral-500 truncate max-w-[150px]">
                      {e.referrer ? (() => {
                        try { return new URL(e.referrer).pathname; } catch { return e.referrer; }
                      })() : '-'}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="font-mono text-xs text-neutral-400">{e.sessionId?.slice(0, 8)}...</span>
                    </td>
                    <td className="py-2.5 text-neutral-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Infinite scroll loading indicator */}
          <div className="py-3 text-center text-xs text-neutral-400">
            {isFetchingNextPage ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading more...
              </span>
            ) : hasMore ? (
              <span>Scroll for more</span>
            ) : events.length > 50 ? (
              <span>All {events.length} events loaded</span>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
