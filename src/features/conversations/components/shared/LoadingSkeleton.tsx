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

/**
 * Skeleton bubble configuration for realistic chat loading state.
 * Each entry defines: side (assistant/user), number of text lines, and widths.
 */
const SKELETON_BUBBLES = [
  { side: 'assistant' as const, lines: [{ w: 'w-44' }, { w: 'w-56' }, { w: 'w-36' }] },
  { side: 'user' as const, lines: [{ w: 'w-32' }] },
  { side: 'assistant' as const, lines: [{ w: 'w-52' }, { w: 'w-40' }] },
  { side: 'user' as const, lines: [{ w: 'w-48' }, { w: 'w-28' }] },
  { side: 'assistant' as const, lines: [{ w: 'w-60' }, { w: 'w-44' }, { w: 'w-32' }] },
  { side: 'user' as const, lines: [{ w: 'w-36' }] },
  { side: 'assistant' as const, lines: [{ w: 'w-48' }, { w: 'w-24' }] },
];

function SkeletonBubble({
  side,
  lines,
  delay,
}: {
  side: 'assistant' | 'user';
  lines: { w: string }[];
  delay: number;
}) {
  const isUser = side === 'user';

  return (
    <div
      className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`flex flex-col max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div
          className={`relative overflow-hidden p-4 border ${
            isUser
              ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-md border-neutral-200 bg-white'
              : 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-md border-neutral-800 bg-neutral-900'
          }`}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          {/* Skeleton text lines */}
          <div className="space-y-2.5">
            {lines.map((line, i) => (
              <div
                key={i}
                className={`h-3.5 rounded-full ${line.w} ${
                  isUser ? 'bg-neutral-200' : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Timestamp skeleton */}
        <div className={`flex items-center gap-1.5 mt-0.5 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <div className="h-2.5 w-10 rounded-full bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}

export function ChatMessagesSkeleton() {
  return (
    <div className="flex flex-col p-3 sm:p-4" role="status" aria-label="Loading messages">
      {/* Date separator skeleton */}
      <div className="flex items-center justify-center my-3">
        <div className="h-6 w-16 bg-neutral-100 rounded-full" />
      </div>

      {/* Message bubbles */}
      {SKELETON_BUBBLES.map((bubble, i) => (
        <SkeletonBubble
          key={i}
          side={bubble.side}
          lines={bubble.lines}
          delay={i * 80}
        />
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
