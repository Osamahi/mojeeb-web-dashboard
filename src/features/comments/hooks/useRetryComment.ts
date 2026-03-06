import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { commentService } from '../services/commentService';
import type { SocialComment } from '../types/comment.types';

// Partial key prefix to match all post-comments queries regardless of postDbId
const POST_COMMENTS_PREFIX = ['post-comments'] as const;
const COMMENT_STATS_PREFIX = ['comment-stats'] as const;

export function useRetryComment() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (commentId: string) => commentService.retryComment(commentId),
    onMutate: async (commentId) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: POST_COMMENTS_PREFIX });

      // Snapshot previous value for rollback
      const previousData = queryClient.getQueriesData({ queryKey: POST_COMMENTS_PREFIX });

      // Optimistically update the comment status to "pending"
      queryClient.setQueriesData(
        { queryKey: POST_COMMENTS_PREFIX },
        (oldData: unknown) => {
          if (!oldData || typeof oldData !== 'object' || !('pages' in (oldData as Record<string, unknown>))) return oldData;
          const data = oldData as { pages: Array<{ items: SocialComment[] }> };
          return {
            ...data,
            pages: data.pages.map(page => ({
              ...page,
              items: page.items.map(comment =>
                comment.id === commentId
                  ? { ...comment, status: 'pending' as const, errorMessage: null }
                  : comment
              ),
            })),
          };
        }
      );

      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POST_COMMENTS_PREFIX });
      queryClient.invalidateQueries({ queryKey: COMMENT_STATS_PREFIX });
    },
    onError: (_error, _commentId, context) => {
      // Rollback on error
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error(t('comments_page.retry_failed'));
    },
  });
}
