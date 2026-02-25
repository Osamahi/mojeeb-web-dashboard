import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { chatApiService } from '../services/chatApiService';
import { useConversationStore } from '../stores/conversationStore';
import { useAgentContext } from '@/hooks/useAgentContext';
import { queryKeys } from '@/lib/queryKeys';

/**
 * React Query mutation hook for deleting a conversation.
 *
 * Authorization is handled by the backend:
 * - SuperAdmins can delete any conversation
 * - Regular users can only delete conversations from agents they have access to
 *
 * Features:
 * - Automatic toast notifications (success/error)
 * - Clears selection if deleted conversation was currently selected
 * - Invalidates and refetches conversations list
 * - Handles 403 Forbidden, 404 Not Found, and other errors
 *
 * @returns {UseMutationResult} React Query mutation result object
 *
 * @example
 * ```tsx
 * function ChatHeader() {
 *   const deleteMutation = useDeleteConversation();
 *   const { confirm } = useConfirm();
 *
 *   const handleDelete = async () => {
 *     const confirmed = await confirm({
 *       title: 'Delete Conversation',
 *       message: 'Are you sure? This action cannot be undone.',
 *       confirmText: 'Delete',
 *       variant: 'danger',
 *     });
 *
 *     if (confirmed && conversationId) {
 *       deleteMutation.mutate(conversationId);
 *     }
 *   };
 *
 *   return (
 *     <button
 *       onClick={handleDelete}
 *       disabled={deleteMutation.isPending}
 *     >
 *       {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();
  const clearSelection = useConversationStore((state) => state.clearSelection);
  const selectedConversation = useConversationStore((state) => state.selectedConversation);

  return useMutation({
    mutationFn: (conversationId: string) => chatApiService.deleteConversation(conversationId),

    onSuccess: (_, conversationId) => {
      // Show success toast
      toast.success('Conversation deleted successfully');

      // Clear selection if deleted conversation was currently selected
      if (selectedConversation?.id === conversationId) {
        clearSelection();
      }

      // Remove the deleted conversation directly from cache
      // (don't use invalidateQueries — the refetch races with realtime and can re-add it)
      // Use setQueriesData for partial key matching — updates all filtered views
      if (agentId) {
        const queryKey = queryKeys.conversations(agentId);
        queryClient.setQueriesData({ queryKey }, (oldData: any) => {
          if (!oldData?.pages) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.filter((conv: any) => conv.id !== conversationId),
            })),
          };
        });
      }
    },

    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        // Handle specific error codes
        if (status === 403) {
          toast.error(message || "You don't have permission to delete this conversation");
        } else if (status === 404) {
          toast.error('Conversation not found');
        } else {
          toast.error(message || 'Failed to delete conversation');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    },
  });
}
