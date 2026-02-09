import { useMutation } from '@tanstack/react-query';
import { markConversationAsRead } from '../services/conversationApi';

/**
 * React Query mutation hook for marking a conversation as read.
 *
 * This hook silently marks a conversation as read without showing notifications.
 * The realtime subscription (useConversationRealtime) handles UI updates automatically.
 *
 * Features:
 * - Silently marks conversation as read (API call only)
 * - No cache manipulation (realtime handles UI updates)
 * - No toast notifications (automatic action, not user-initiated)
 *
 * @returns {UseMutationResult} React Query mutation result object
 *
 * @example
 * ```tsx
 * function ConversationViewDrawer({ conversationId, isOpen }) {
 *   const { mutate: markAsRead } = useMarkConversationAsRead();
 *   const { data: conversation } = useConversationById(conversationId);
 *
 *   // Smart logic: Mark as read when drawer opens OR when becomes unread while open
 *   useEffect(() => {
 *     if (isOpen && conversation && !conversation.is_read) {
 *       markAsRead(conversation.id);
 *     }
 *   }, [isOpen, conversation?.id, conversation?.is_read, markAsRead]);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useMarkConversationAsRead() {
  return useMutation({
    mutationFn: markConversationAsRead,

    onError: (error) => {
      // Silent failure - log error but don't show toast (automatic action)
      console.error('Failed to mark conversation as read:', error);
    },
  });
}
