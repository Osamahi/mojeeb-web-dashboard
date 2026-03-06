import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Trash2, Send, Reply, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useDateLocale } from '@/lib/dateConfig';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import type { SocialComment } from '../types/comment.types';

interface CommentBubbleProps {
  comment: SocialComment;
  pageName?: string | null;
  onRetry?: (commentId: string) => void;
  onDeleteReply?: (commentId: string) => void;
  onManualReply?: (commentId: string, message: string) => void;
  isRetrying?: boolean;
  isDeleting?: boolean;
  isReplying?: boolean;
}

export const CommentBubble = memo(function CommentBubble({
  comment,
  pageName,
  onRetry,
  onDeleteReply,
  onManualReply,
  isRetrying,
  isDeleting,
  isReplying,
}: CommentBubbleProps) {
  const { t } = useTranslation();
  const { formatSmartTimestamp } = useDateLocale();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState('');
  const wasReplyingRef = useRef(false);

  // Close modals when mutation succeeds (comment gets a reply after submitting)
  // Only close if the optimistic update stuck (success). On error, rollback leaves
  // aiResponse unchanged so the modal stays open for the user to retry.
  useEffect(() => {
    if (wasReplyingRef.current && !isReplying) {
      const succeeded = comment.status === 'replied' && !!comment.aiResponse;
      if (succeeded) {
        setShowReplyModal(false);
        setShowEditModal(false);
        setReplyText('');
        setEditText('');
      }
    }
    wasReplyingRef.current = !!isReplying;
  }, [isReplying, comment.status, comment.aiResponse]);

  const handleRetry = useCallback(() => {
    onRetry?.(comment.id);
  }, [comment.id, onRetry]);

  const handleDeleteReply = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    onDeleteReply?.(comment.id);
  }, [comment.id, onDeleteReply]);

  const handleManualReply = useCallback(() => {
    if (replyText.trim() && onManualReply) {
      onManualReply(comment.id, replyText.trim());
    }
  }, [comment.id, replyText, onManualReply]);

  const handleReplyKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleManualReply();
    }
  }, [handleManualReply]);

  const handleCloseReplyModal = useCallback(() => {
    setShowReplyModal(false);
    setReplyText('');
  }, []);

  const handleOpenEditModal = useCallback(() => {
    setEditText(comment.aiResponse || '');
    setShowEditModal(true);
  }, [comment.aiResponse]);

  const handleEditReply = useCallback(() => {
    if (editText.trim() && onManualReply) {
      onManualReply(comment.id, editText.trim());
    }
  }, [comment.id, editText, onManualReply]);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditReply();
    }
  }, [handleEditReply]);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditText('');
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  // Can delete if replied and has a platform reply ID
  const canDelete = comment.status === 'replied' && !!comment.platformReplyId && !!onDeleteReply;
  const canEdit = comment.status === 'replied' && !!comment.aiResponse && !!onManualReply;
  const hasReply = comment.status !== 'pending';

  return (
    <div className="group/comment space-y-2">
      {/* User comment */}
      <div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-900">
              {comment.commenterName || comment.commenterUsername || t('common.unknown')}
            </span>
            {comment.commentCreatedAt && (
              <span className="text-xs text-neutral-400">
                {formatSmartTimestamp(comment.commentCreatedAt)}
              </span>
            )}
            {/* Reply button — icon only, visible on hover, hidden if already replied */}
            {onManualReply && !comment.aiResponse && (
              <button
                onClick={() => setShowReplyModal(true)}
                className="rounded-md p-1 text-neutral-400 hover:text-brand-mojeeb hover:bg-brand-mojeeb/10 opacity-0 group-hover/comment:opacity-100 transition-all"
                title={t('comments_page.reply')}
                aria-label={t('comments_page.reply')}
              >
                <Reply className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="mt-0.5 text-sm text-neutral-700">{comment.commentText}</p>
        </div>
      </div>

      {/* AI/Manual reply (only shown when there IS a reply — not for pending) */}
      {hasReply && (
        <div className="ms-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-900">{pageName || t('common.app_name')}</span>
              {comment.repliedAt && (
                <span className="text-xs text-neutral-400">
                  {formatSmartTimestamp(comment.repliedAt)}
                </span>
              )}
              {/* Edit button — icon only, visible on hover */}
              {canEdit && (
                <button
                  onClick={handleOpenEditModal}
                  className="rounded-md p-1 text-neutral-400 hover:text-brand-mojeeb hover:bg-brand-mojeeb/10 opacity-0 group-hover/comment:opacity-100 transition-all"
                  title={t('comments_page.edit_reply')}
                  aria-label={t('comments_page.edit_reply')}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {/* Delete button — icon only, visible on hover */}
              {canDelete && (
                <button
                  onClick={handleDeleteReply}
                  disabled={isDeleting}
                  className="rounded-md p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 opacity-0 group-hover/comment:opacity-100 transition-all"
                  title={t('comments_page.delete_reply')}
                  aria-label={t('comments_page.delete_reply')}
                >
                  <Trash2 className={cn('h-3.5 w-3.5', isDeleting && 'animate-spin')} />
                </button>
              )}
            </div>

            {comment.aiResponse ? (
              <div className="mt-0.5">
                <p className="text-sm text-neutral-700">{comment.aiResponse}</p>
              </div>
            ) : comment.status === 'failed' ? (
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-sm text-red-500">{comment.errorMessage || t('comments_page.failed')}</p>
                {onRetry && (
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                  >
                    <RefreshCw className={cn('h-3 w-3', isRetrying && 'animate-spin')} />
                    {isRetrying ? t('comments_page.retrying') : t('comments_page.retry')}
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-0.5 text-sm text-neutral-400 italic">{t(`comments_page.status_${comment.status}`)}</p>
            )}
          </div>
        </div>
      )}

      {/* Reply modal */}
      <BaseModal
        isOpen={showReplyModal}
        onClose={handleCloseReplyModal}
        title={t('comments_page.reply')}
        maxWidth="sm"
        isLoading={isReplying}
        closable={!isReplying}
      >
        <div className="space-y-4">
          {/* Original comment preview */}
          <div className="rounded-md bg-neutral-50 p-3">
            <p className="text-xs font-medium text-neutral-500 mb-1">
              {comment.commenterName || comment.commenterUsername || t('common.unknown')}
            </p>
            <p className="text-sm text-neutral-700 line-clamp-3">{comment.commentText}</p>
          </div>

          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleReplyKeyDown}
            placeholder={t('comments_page.reply_placeholder')}
            rows={3}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            disabled={isReplying}
            autoFocus
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCloseReplyModal}
              disabled={isReplying}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualReply}
              disabled={!replyText.trim()}
              isLoading={isReplying}
            >
              <Send className="h-4 w-4 ltr:mr-1.5 rtl:ml-1.5" />
              {t('comments_page.reply')}
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Edit reply modal */}
      <BaseModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title={t('comments_page.edit_reply')}
        maxWidth="sm"
        isLoading={isReplying}
        closable={!isReplying}
      >
        <div className="space-y-4">
          <div className="rounded-md bg-neutral-50 p-3">
            <p className="text-xs font-medium text-neutral-500 mb-1">
              {comment.commenterName || comment.commenterUsername || t('common.unknown')}
            </p>
            <p className="text-sm text-neutral-700 line-clamp-3">{comment.commentText}</p>
          </div>

          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleEditKeyDown}
            placeholder={t('comments_page.reply_placeholder')}
            rows={3}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            disabled={isReplying}
            autoFocus
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCloseEditModal}
              disabled={isReplying}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleEditReply}
              disabled={!editText.trim() || editText.trim() === comment.aiResponse}
              isLoading={isReplying}
            >
              <Send className="h-4 w-4 ltr:mr-1.5 rtl:ml-1.5" />
              {t('common.save')}
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Delete confirmation modal */}
      <BaseModal
        isOpen={showDeleteConfirm}
        onClose={handleCloseDeleteModal}
        title={t('comments_page.delete_reply')}
        maxWidth="sm"
        isLoading={isDeleting}
        closable={!isDeleting}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            {t('comments_page.delete_reply_confirm', { platform: comment.platform })}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCloseDeleteModal}
              disabled={isDeleting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              {t('comments_page.delete_reply')}
            </Button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
});
