import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isToastHandled } from '@/lib/errors';
import { commentService } from '../services/commentService';
import type { SocialComment } from '../types/comment.types';

const POST_COMMENTS_PREFIX = ['post-comments'] as const;
const COMMENT_STATS_PREFIX = ['comment-stats'] as const;

interface ManualReplyParams {
  commentId: string;
  message: string;
}

export function useManualReply() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ commentId, message }: ManualReplyParams) =>
      commentService.manualReply(commentId, message),
    onMutate: async ({ commentId, message }) => {
      await queryClient.cancelQueries({ queryKey: POST_COMMENTS_PREFIX });

      const previousData = queryClient.getQueriesData({ queryKey: POST_COMMENTS_PREFIX });

      // Optimistically show the reply as "replied"
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
                  ? {
                      ...comment,
                      aiResponse: message,
                      status: 'replied' as const,
                      repliedAt: new Date().toISOString(),
                      errorMessage: null,
                    }
                  : comment
              ),
            })),
          };
        }
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success(t('comments_page.manual_reply_success'));
      queryClient.invalidateQueries({ queryKey: POST_COMMENTS_PREFIX });
      queryClient.invalidateQueries({ queryKey: COMMENT_STATS_PREFIX });
    },
    onError: (_error, _params, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      if (!isToastHandled(_error)) toast.error(t('comments_page.manual_reply_failed'));
    },
  });
}
