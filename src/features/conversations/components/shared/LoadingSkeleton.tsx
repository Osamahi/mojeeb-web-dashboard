/**
 * Loading Skeleton Components
 * WhatsApp-style loading states with shimmer effect
 */

import { useTranslation } from 'react-i18next';

export function ConversationListSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg">
          {/* Avatar skeleton */}
          <div className="w-12 h-12 bg-neutral-200 rounded-full animate-pulse" />

          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-neutral-100 rounded w-full animate-pulse" />
          </div>

          {/* Timestamp skeleton */}
          <div className="h-3 w-12 bg-neutral-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function ChatMessagesSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex"
          style={{
            justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end',
          }}
        >
          <div
            className="max-w-[70%] p-4 rounded-2xl animate-pulse"
            style={{
              backgroundColor: i % 2 === 0 ? '#F5F5F5' : '#E5E5E5',
            }}
          >
            <div className="h-4 bg-neutral-300 rounded w-48 mb-2" />
            <div className="h-4 bg-neutral-300 rounded w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NoConversationsState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-neutral-950 mb-2">{t('conversations.no_conversations_title')}</h3>
      <p className="text-neutral-600 max-w-sm">
        {t('conversations.no_conversations_description')}
      </p>
    </div>
  );
}
