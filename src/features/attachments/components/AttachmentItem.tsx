/**
 * Accordion card for a single attachment on the Studio page.
 * Mirrors KnowledgeBaseItem accordion pattern.
 * Clicking the card expands/collapses; clicking the thumbnail opens media viewer.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Pencil, Trash2, Image, Film, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConfirm } from '@/hooks/useConfirm';
import { useDeleteAttachment } from '../hooks/useMutateAttachment';
import { EditAttachmentModal } from './EditAttachmentModal';
import { ImageModal } from '@/features/conversations/components/Chat/ImageModal';
import type { MessageAttachment } from '@/features/conversations/types';
import type { Attachment } from '../types/attachment.types';

interface AttachmentItemProps {
  attachment: Attachment;
  onUpdate: () => void;
}

export default function AttachmentItem({ attachment, onUpdate }: AttachmentItemProps) {
  const { t } = useTranslation();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const deleteMutation = useDeleteAttachment();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [mediaViewerIndex, setMediaViewerIndex] = useState<number | null>(null);

  // Build MessageAttachment[] for ImageModal from mediaConfig
  const mediaAttachments = getMediaAttachments(attachment);

  const handleThumbnailClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    // Documents: open SAS URL in a new tab (no lightbox)
    if (attachment.attachmentType === 'document') {
      const url = attachment.mediaConfig?.thumbnail_url;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    // Photos, videos, albums: open ImageModal
    if (mediaAttachments.length > 0) {
      setMediaViewerIndex(0);
    }
  }, [attachment, mediaAttachments.length]);

  const handleDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: t('attachments.delete_confirm_title', 'Delete Attachment'),
      message: t('attachments.delete_confirm_message', {
        name: attachment.name,
        defaultValue: `Are you sure you want to delete "${attachment.name}"?`,
      }),
      confirmText: t('common.delete', 'Delete'),
      cancelText: t('common.cancel', 'Cancel'),
      variant: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(
        { attachmentId: attachment.id, agentId: attachment.agentId },
        { onSuccess: onUpdate }
      );
    }
  }, [confirm, t, attachment, deleteMutation, onUpdate]);

  // Resolve thumbnail entries for the header
  const thumbnailEntries = getThumbnailEntries(attachment);

  const MediaIcon =
    attachment.attachmentType === 'video'
      ? Film
      : attachment.attachmentType === 'document'
        ? FileText
        : Image;

  return (
    <>
      {ConfirmDialogComponent}

      <div className="bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-all duration-200 group">
        {/* Accordion Header */}
        <div
          className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Chevron */}
          <ChevronRight
            className={cn(
              'w-5 h-5 text-neutral-400 transition-transform duration-200 flex-shrink-0 rtl:rotate-180',
              isExpanded && 'rotate-90 rtl:rotate-90'
            )}
          />

          {/* Name */}
          <h3 className="text-base font-semibold text-neutral-950 truncate min-w-0">
            {attachment.name}
          </h3>

          {/* Thumbnail(s) — right after name, click opens media viewer */}
          {thumbnailEntries.length > 0 ? (
            <StackedThumbnails entries={thumbnailEntries} alt={attachment.name} onClick={handleThumbnailClick} />
          ) : (
            <div
              className="w-8 h-8 rounded-md bg-white flex items-center justify-center flex-shrink-0 border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer"
              onClick={handleThumbnailClick}
            >
              <MediaIcon className="w-3.5 h-3.5 text-neutral-400" />
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Hover Actions */}
          <div className={cn(
            'flex items-center gap-1 transition-opacity',
            isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}>
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}
              className="p-2 sm:p-1.5 rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center hover:bg-neutral-100 text-neutral-600 hover:text-neutral-950"
              title={t('common.edit', 'Edit')}
            >
              <Pencil className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              disabled={deleteMutation.isPending}
              className="p-2 sm:p-1.5 hover:bg-red-50 rounded transition-colors text-neutral-600 hover:text-red-600 disabled:opacity-50 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              title={t('common.delete', 'Delete')}
            >
              <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Content — prompt only */}
        {isExpanded && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-neutral-100">
            <p className="pt-3 text-sm text-neutral-700 leading-relaxed">
              {attachment.triggerPrompt}
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditAttachmentModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); onUpdate(); }}
        attachment={attachment}
      />

      {/* Media Viewer (photo / video / album) */}
      {mediaViewerIndex !== null && mediaAttachments.length > 0 && (
        <ImageModal
          images={mediaAttachments}
          initialIndex={mediaViewerIndex}
          onClose={() => setMediaViewerIndex(null)}
        />
      )}

    </>
  );
}

interface ThumbnailEntry {
  url: string;
  isVideo: boolean;
}

/** Extract thumbnail entries from an attachment's mediaConfig (up to 3 for albums) */
function getThumbnailEntries(attachment: Attachment): ThumbnailEntry[] {
  const mc = attachment.mediaConfig;
  if (!mc) return [];

  // Album — collect up to 3 image thumbnails for the stacked effect
  if (attachment.attachmentType === 'album' && mc.images?.length) {
    const entries: ThumbnailEntry[] = [];
    for (const img of mc.images) {
      if (img?.content_type?.startsWith('image/') && img.thumbnail_url) {
        entries.push({ url: img.thumbnail_url, isVideo: false });
        if (entries.length >= 3) break;
      }
    }
    return entries;
  }

  // Single file — images and videos get thumbnails
  if (mc.thumbnail_url) {
    if (mc.content_type?.startsWith('image/')) {
      return [{ url: mc.thumbnail_url, isVideo: false }];
    }
    if (mc.content_type?.startsWith('video/')) {
      return [{ url: mc.thumbnail_url, isVideo: true }];
    }
  }

  return [];
}

/** Map attachment mediaConfig → MessageAttachment[] for ImageModal */
function getMediaAttachments(attachment: Attachment): MessageAttachment[] {
  const mc = attachment.mediaConfig;
  if (!mc) return [];

  // Album — all images with SAS URLs
  if (attachment.attachmentType === 'album' && mc.images?.length) {
    return mc.images
      .filter((img: any) => img?.thumbnail_url)
      .map((img: any) => ({
        url: img.thumbnail_url,
        type: img.content_type?.startsWith('video/') ? 'video' : 'image',
        filename: img.original_file_name || img.blob_name?.split('/').pop(),
        content_type: img.content_type,
      }));
  }

  // Single photo or video
  if (mc.thumbnail_url) {
    return [{
      url: mc.thumbnail_url,
      type: mc.content_type?.startsWith('video/') ? 'video' : 'image',
      filename: mc.original_file_name || mc.blob_name?.split('/').pop(),
      content_type: mc.content_type,
    }];
  }

  return [];
}

/** Stacked thumbnail cards — single image/video or up to 3 layered behind each other */
function StackedThumbnails({ entries, alt, onClick }: { entries: ThumbnailEntry[]; alt: string; onClick?: (e: React.MouseEvent) => void }) {
  const stackOffset = 5;
  const size = 32;
  const containerW = size + (entries.length - 1) * stackOffset;

  return (
    <div
      className="flex-shrink-0 relative group/thumb cursor-pointer"
      style={{ width: containerW, height: size }}
      onClick={onClick}
    >
      {entries.map((entry, i) => (
        <StackedThumb
          key={i}
          url={entry.url}
          isVideo={entry.isVideo}
          alt={`${alt} ${i + 1}`}
          index={i}
          total={entries.length}
          offset={stackOffset}
          size={size}
        />
      ))}
    </div>
  );
}

/** Individual thumbnail within a stack (image or video first-frame) */
function StackedThumb({
  url, isVideo, alt, index, total, offset, size,
}: {
  url: string; isVideo: boolean; alt: string; index: number; total: number; offset: number; size: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const zIndex = index;
  const left = (total - 1 - index) * offset;
  const scale = 1 - (total - 1 - index) * 0.04;

  if (error) return null;

  return (
    <div
      className="absolute top-0 rounded-md overflow-hidden bg-white border border-neutral-200 group-hover/thumb:border-neutral-300 transition-colors"
      style={{
        width: size,
        height: size,
        left,
        zIndex,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      {!loaded && (
        <div className="absolute inset-0 rounded-md bg-neutral-200 animate-pulse" />
      )}
      {isVideo ? (
        <>
          <video
            src={url}
            muted
            preload="metadata"
            onLoadedData={() => {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => setLoaded(true));
              });
            }}
            onError={() => setError(true)}
            className={cn(
              'w-full h-full rounded-md object-contain transition-opacity duration-300 ease-in-out',
              loaded ? 'opacity-100' : 'opacity-0'
            )}
          />
          {/* Play icon overlay */}
          {loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[7px] border-l-white ml-0.5" />
              </div>
            </div>
          )}
        </>
      ) : (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          onLoad={() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => setLoaded(true));
            });
          }}
          onError={() => setError(true)}
          className={cn(
            'w-full h-full rounded-md object-contain transition-opacity duration-300 ease-in-out',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
}
