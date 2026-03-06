import { memo, useCallback, useState } from 'react';
import { AlertCircle, ArrowLeft, ExternalLink, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { CommentBubble } from './CommentBubble';
import { usePostComments } from '../hooks/usePostComments';
import { useRetryComment } from '../hooks/useRetryComment';
import { useDeleteCommentReply } from '../hooks/useDeleteCommentReply';
import { useManualReply } from '../hooks/useManualReply';
import type { SocialPost } from '../types/comment.types';

interface CommentThreadProps {
  post: SocialPost | null;
  pageName?: string | null;
  onBack?: () => void;
}

export const CommentThread = memo(function CommentThread({ post, pageName, onBack }: CommentThreadProps) {
  const { t } = useTranslation();
  const {
    comments,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = usePostComments(post?.id ?? null);

  const retryMutation = useRetryComment();
  const deleteMutation = useDeleteCommentReply();
  const manualReplyMutation = useManualReply();

  const handleRetry = useCallback((commentId: string) => {
    retryMutation.mutate(commentId);
  }, [retryMutation.mutate]);

  const handleDeleteReply = useCallback((commentId: string) => {
    deleteMutation.mutate(commentId);
  }, [deleteMutation.mutate]);

  const handleManualReply = useCallback((commentId: string, message: string) => {
    manualReplyMutation.mutate({ commentId, message });
  }, [manualReplyMutation.mutate]);

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const [headerImgError, setHeaderImgError] = useState(false);

  if (!post) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Post header */}
      <div className="border-b border-neutral-200 p-4">
        <div className="flex items-start gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-shrink-0 mt-0.5 rounded-md p-1 hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-neutral-500" />
            </button>
          )}
          {post.postImageUrl && !headerImgError && (
            <img
              src={post.postImageUrl}
              alt=""
              className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
              onError={() => setHeaderImgError(true)}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-neutral-900 line-clamp-3">
              {post.postCaption || t('comments_page.no_caption')}
            </p>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {t('comments_page.comments_count', { count: post.commentCount })}
              </span>
              {post.postPermalink && (
                <a
                  href={post.postPermalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-neutral-500 hover:text-neutral-700"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t('comments_page.view_post')}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                {/* Commenter skeleton */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-2/3 rounded" />
                </div>
                {/* AI reply skeleton */}
                <div className="ml-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-16 rounded" />
                    <Skeleton className="h-3 w-14 rounded" />
                  </div>
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-4/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-300 mb-2" />
            <p className="text-sm text-red-500">{t('comments_page.error_loading_comments')}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="mt-2"
            >
              {t('comments_page.error_retry')}
            </Button>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-500">{t('comments_page.no_comments')}</p>
          </div>
        ) : (
          <>
            {comments.map(comment => (
              <CommentBubble
                key={comment.id}
                comment={comment}
                pageName={pageName}
                onRetry={handleRetry}
                onDeleteReply={handleDeleteReply}
                onManualReply={handleManualReply}
                isRetrying={retryMutation.isPending && retryMutation.variables === comment.id}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === comment.id}
                isReplying={manualReplyMutation.isPending && manualReplyMutation.variables?.commentId === comment.id}
              />
            ))}
            {hasNextPage && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  isLoading={isFetchingNextPage}
                  className="w-full"
                >
                  {t('comments_page.load_more_comments')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
