import { useMutation } from '@tanstack/react-query';
import { markConversationAsUnread } from '../services/conversationApi';

/**
 * React Query mutation hook for marking a conversation as unread.
 *
 * This hook silently marks a conversation as unread without showing notifications.
 * The realtime subscription (useConversationRealtime) handles UI updates automatically.
 *
 * Features:
 * - Silently marks conversation as unread (API call only)
 * - No cache manipulation (realtime handles UI updates)
 * - No toast notifications (user-initiated action, silent per requirements)
 *
 * @returns {UseMutationResult} React Query mutation result object
 *
 * @example
 * ```tsx
 * function ConversationContextMenu({ conversation }) {
 *   const { mutate: markAsUnread } = useMarkConversationAsUnread();
 *
 *   const handleMarkAsUnread = () => {
 *     markAsUnread(conversation.id);
 *   };
 *
 *   return (
 *     <button onClick={handleMarkAsUnread}>
 *       Mark as Unread
 *     </button>
 *   );
 * }
 * ```
 */
export function useMarkConversationAsUnread() {
  return useMutation({
    mutationFn: markConversationAsUnread,

    onError: (error) => {
      // Silent failure - log error but don't show toast (user-initiated action)
      console.error('Failed to mark conversation as unread:', error);
    },
  });
}
