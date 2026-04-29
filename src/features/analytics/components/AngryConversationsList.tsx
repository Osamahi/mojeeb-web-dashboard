import { useTranslation } from 'react-i18next';
import { Frown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDateLocale } from '@/lib/dateConfig';
import type { AngryConversation } from '../types/analytics.types';

interface AngryConversationsListProps {
  conversations: AngryConversation[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

/**
 * Drilldown panel for conversations that crossed the angry threshold
 * (sentiment ≤ 2). Deduped at source — each conversation shown once.
 *
 * Each row links to the conversation detail view so the user can act on it.
 */
export function AngryConversationsList({
  conversations,
  isLoading,
  isError,
  onRetry,
}: AngryConversationsListProps) {
  const { t } = useTranslation();
  const { formatSmartTimestamp } = useDateLocale();

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Frown className="h-5 w-5 text-amber-500" />
        <h3 className="text-base font-semibold text-neutral-900">
          {t('analytics.angry_conversations_title')}
        </h3>
        {conversations && conversations.length > 0 && (
          <span className="ml-auto inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
            {conversations.length}
          </span>
        )}
      </div>

      {isError ? (
        <ErrorState
          title={t('analytics.error_loading_angry')}
          onRetry={onRetry}
        />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : !conversations || conversations.length === 0 ? (
        <EmptyState
          title={t('analytics.no_angry_conversations')}
          description={t('analytics.no_angry_conversations_hint')}
        />
      ) : (
        <ul className="divide-y divide-neutral-100">
          {conversations.map((conv) => (
            <li key={conv.conversationId}>
              <Link
                to={`/conversations?conversationId=${conv.conversationId}`}
                className="flex items-center gap-3 py-3 hover:bg-neutral-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-medium">
                  {(conv.customerName ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {conv.customerName ?? t('analytics.unknown_customer')}
                    </p>
                    <span className="text-xs text-neutral-500 flex-shrink-0">
                      {formatSmartTimestamp(conv.firstBecameAngryAt)}
                    </span>
                  </div>
                  {conv.lastMessage && (
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {conv.lastMessage}
                    </p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-300 flex-shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
