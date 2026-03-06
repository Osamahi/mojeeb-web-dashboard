import { memo, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { PostCard } from './PostCard';
import type { SocialPost } from '../types/comment.types';

interface PostListProps {
  posts: SocialPost[];
  selectedPostId: string | null;
  onSelectPost: (post: SocialPost) => void;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export const PostList = memo(function PostList({
  posts,
  selectedPostId,
  onSelectPost,
  isLoading,
  isError,
  onRetry,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: PostListProps) {
  const { t } = useTranslation();

  const handleLoadMore = useCallback(() => {
    onLoadMore();
  }, [onLoadMore]);

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-3 rounded-lg border border-neutral-200 p-3">
            <Skeleton className="h-16 w-16 flex-shrink-0 rounded-lg" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-300 mb-3" />
        <p className="text-sm text-neutral-500">{t('comments_page.error_loading')}</p>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            {t('comments_page.error_retry')}
          </Button>
        )}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-sm text-neutral-500">{t('comments_page.no_posts')}</p>
        <p className="mt-1 text-xs text-neutral-400">
          {t('comments_page.no_posts_hint')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            isSelected={post.id === selectedPostId}
            onSelect={onSelectPost}
          />
        ))}
      </div>
      {hasNextPage && (
        <div className="p-3 border-t border-neutral-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadMore}
            isLoading={isFetchingNextPage}
            className="w-full"
          >
            {t('comments_page.load_more')}
          </Button>
        </div>
      )}
    </div>
  );
});
