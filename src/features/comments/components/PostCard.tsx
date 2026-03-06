import { memo, useCallback, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useDateLocale } from '@/lib/dateConfig';
import { PlatformIcon } from '@/features/connections/components/PlatformIcon';
import type { SocialPost } from '../types/comment.types';

interface PostCardProps {
  post: SocialPost;
  isSelected: boolean;
  onSelect: (post: SocialPost) => void;
}

export const PostCard = memo(function PostCard({ post, isSelected, onSelect }: PostCardProps) {
  const { t } = useTranslation();
  const { formatSmartTimestamp } = useDateLocale();
  const [imgError, setImgError] = useState(false);

  const handleClick = useCallback(() => {
    onSelect(post);
  }, [post, onSelect]);

  const showPlaceholder = !post.postImageUrl || imgError;

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-start rounded-lg border p-3 transition-all',
        isSelected
          ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
          : 'border-neutral-200 bg-white hover:border-neutral-400'
      )}
    >
      <div className="flex gap-3">
        {/* Thumbnail with platform icon overlay */}
        <div className="relative flex-shrink-0">
          {showPlaceholder ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neutral-100">
              <ImageOff className="h-5 w-5 text-neutral-400" />
            </div>
          ) : (
            <img
              src={post.postImageUrl!}
              alt=""
              className="h-16 w-16 rounded-lg object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          )}
          {/* Platform icon — bottom-right corner */}
          <div className="absolute -bottom-1 ltr:-right-1 rtl:-left-1">
            <PlatformIcon
              platform={post.platform}
              size="sm"
              variant="brand"
              showBackground
              className="!w-5 !h-5 shadow-sm ring-1 ring-white [&_svg]:!w-2.5 [&_svg]:!h-2.5"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Caption preview */}
          <p className="text-sm text-neutral-900 line-clamp-2">
            {post.postCaption || t('comments_page.no_caption')}
          </p>

          {/* Time */}
          <span className="mt-1.5 block text-xs text-neutral-400">
            {formatSmartTimestamp(post.updatedAt)}
          </span>
        </div>
      </div>
    </button>
  );
});
