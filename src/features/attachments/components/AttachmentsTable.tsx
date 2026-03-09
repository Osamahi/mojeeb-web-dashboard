/**
 * Table view for attachments
 * Shows attachments with toggle switch, infinite scroll, edit/delete buttons
 */

import { useCallback, useRef, useEffect } from 'react';
import { Pencil, Trash2, Upload, Image, FileText, Film } from 'lucide-react';
import type { Attachment } from '../types/attachment.types';
import { AttachmentTypeBadge } from './AttachmentTypeBadge';
import { truncateText, getPriorityColor, hasMedia } from '../utils/formatting';
import { useDateLocale } from '@/lib/dateConfig';
import { useToggleAttachment } from '../hooks/useMutateAttachment';

interface AttachmentsTableProps {
  attachments: Attachment[];
  hasMore: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onEdit: (attachment: Attachment) => void;
  onDelete: (attachment: Attachment) => void;
  onUpload: (attachment: Attachment) => void;
}

export function AttachmentsTable({
  attachments,
  hasMore,
  isLoading,
  isFetchingNextPage,
  onLoadMore,
  onEdit,
  onDelete,
  onUpload,
}: AttachmentsTableProps) {
  const { formatSmartTimestamp } = useDateLocale();
  const toggleMutation = useToggleAttachment();
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isFetchingNextPage, onLoadMore]);

  const togglingId = toggleMutation.isPending
    ? (toggleMutation.variables as { attachmentId: string } | undefined)?.attachmentId ?? null
    : null;

  const handleToggle = useCallback(
    (attachment: Attachment) => {
      toggleMutation.mutate({
        attachmentId: attachment.id,
        isActive: !attachment.isActive,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toggleMutation.mutate]
  );

  if (attachments.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
        <div className="text-neutral-500 text-sm">
          No attachments found. Create your first attachment to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Media
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Active
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {attachments.map((attachment) => (
              <tr key={attachment.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-medium text-neutral-900 truncate max-w-[200px] block">
                    {attachment.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <AttachmentTypeBadge type={attachment.attachmentType} />
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-neutral-600 line-clamp-2 max-w-[300px]">
                    {attachment.description || '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <MediaIndicator attachment={attachment} />
                </td>
                <td className="px-4 py-3">
                  <ToggleSwitch
                    checked={attachment.isActive}
                    onChange={() => handleToggle(attachment)}
                    disabled={togglingId === attachment.id}
                  />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(attachment.priority)}`}
                  >
                    {attachment.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-neutral-600">
                    {formatSmartTimestamp(attachment.createdAt)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onUpload(attachment)}
                      className="p-1.5 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Upload Media"
                      aria-label={`Upload media for ${attachment.name}`}
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(attachment)}
                      className="p-1.5 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit"
                      aria-label={`Edit ${attachment.name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(attachment)}
                      className="p-1.5 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                      aria-label={`Delete ${attachment.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-neutral-200">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-neutral-900 truncate">
                  {attachment.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <AttachmentTypeBadge type={attachment.attachmentType} />
                  <MediaIndicator attachment={attachment} />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpload(attachment)}
                  className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  aria-label={`Upload media for ${attachment.name}`}
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(attachment)}
                  className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  aria-label={`Edit ${attachment.name}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(attachment)}
                  className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  aria-label={`Delete ${attachment.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {attachment.description && (
              <p className="text-sm text-neutral-600 mb-2">
                {truncateText(attachment.description, 100)}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full border ${getPriorityColor(attachment.priority)}`}
                >
                  P{attachment.priority}
                </span>
                <span>{formatSmartTimestamp(attachment.createdAt)}</span>
              </div>
              <ToggleSwitch
                checked={attachment.isActive}
                onChange={() => handleToggle(attachment)}
                disabled={toggleMutation.isPending}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={observerTarget} className="py-4 text-center border-t border-neutral-200">
          {isFetchingNextPage ? (
            <div className="text-neutral-500 text-sm">Loading more...</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * Toggle switch component
 */
function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-blue-600' : 'bg-neutral-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

/**
 * Media upload status indicator
 */
function MediaIndicator({ attachment }: { attachment: Attachment }) {
  const uploaded = hasMedia(attachment.mediaConfig);

  if (!uploaded) {
    return (
      <span className="text-xs text-neutral-400">No media</span>
    );
  }

  const Icon =
    attachment.attachmentType === 'video'
      ? Film
      : attachment.attachmentType === 'document'
        ? FileText
        : Image;

  const count =
    attachment.attachmentType === 'album' && attachment.mediaConfig?.images
      ? `${attachment.mediaConfig.images.length} files`
      : '1 file';

  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-600">
      <Icon className="w-3.5 h-3.5" />
      {count}
    </span>
  );
}
