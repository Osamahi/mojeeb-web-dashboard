/**
 * Lead Comments Section
 * Displays comment history timeline with add/edit/delete functionality
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import {
  useLeadComments,
  useCreateLeadComment,
  useUpdateLeadComment,
  useDeleteLeadComment,
} from '../hooks/useLeads';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { extractNameFromEmail } from '../utils/formatting';
import type { LeadComment } from '../types';

interface LeadCommentsSectionProps {
  leadId: string;
  onCommentAdded?: () => void;
}

export function LeadCommentsSection({ leadId, onCommentAdded }: LeadCommentsSectionProps) {
  const user = useAuthStore((state) => state.user);
  const { data: comments, isLoading } = useLeadComments(leadId);
  const createMutation = useCreateLeadComment();
  const updateMutation = useUpdateLeadComment();
  const deleteMutation = useDeleteLeadComment();

  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Handle adding a new comment
  const handleAddComment = () => {
    if (!newCommentText.trim()) return;

    createMutation.mutate(
      {
        leadId,
        request: { text: newCommentText, commentType: 'user_comment' },
      },
      {
        onSuccess: () => {
          setNewCommentText('');
          // Close modal after a brief delay for smooth UX
          if (onCommentAdded) {
            setTimeout(() => {
              onCommentAdded();
            }, 800);
          }
        },
      }
    );
  };

  // Handle editing a comment
  const handleStartEdit = (comment: LeadComment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editText.trim()) return;

    updateMutation.mutate(
      {
        leadId,
        commentId,
        request: { text: editText },
      },
      {
        onSuccess: () => {
          setEditingCommentId(null);
          setEditText('');
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  // Handle deleting a comment
  const handleDelete = (commentId: string) => {
    setCommentToDelete(commentId);
  };

  const handleConfirmDelete = () => {
    if (commentToDelete) {
      deleteMutation.mutate(
        { leadId, commentId: commentToDelete },
        {
          onSuccess: () => {
            setCommentToDelete(null);
          },
        }
      );
    }
  };

  // Check if user owns a comment
  const isOwnComment = (comment: LeadComment) => {
    return user?.id === comment.userId;
  };

  // Empty state
  if (!isLoading && (!comments || comments.length === 0)) {
    return (
      <div className="space-y-4">
        {/* Add Comment Input */}
        <div className="space-y-2">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none text-sm"
          />
          <div
            className={`transition-all duration-200 ease-in-out overflow-hidden ${
              newCommentText.trim()
                ? 'max-h-20 opacity-100'
                : 'max-h-0 opacity-0'
            }`}
          >
            <button
              onClick={handleAddComment}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? 'Adding...' : 'Add Comment'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Comment Input */}
      <div className="space-y-2">
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none text-sm"
        />
        <div
          className={`transition-all duration-200 ease-in-out overflow-hidden ${
            newCommentText.trim()
              ? 'max-h-20 opacity-100'
              : 'max-h-0 opacity-0'
          }`}
        >
          <button
            onClick={handleAddComment}
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createMutation.isPending ? 'Adding...' : 'Add Comment'}
          </button>
        </div>
      </div>

      {/* Comments Timeline */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-neutral-900">Activity Timeline</p>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-neutral-100 rounded w-1/4 mb-2"></div>
                <div className="h-16 bg-neutral-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {comments?.map((comment) => (
              <div
                key={comment.id}
                className="border-l-2 border-neutral-200 pl-4 pb-3 relative group"
              >
                {/* Comment Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900">
                      {extractNameFromEmail(comment.userName)}
                    </span>
                    {comment.commentType === 'status_change' && (
                      <span className="text-xs text-[#00D084] font-normal">
                        (status update)
                      </span>
                    )}
                    {comment.isEdited && (
                      <span className="text-xs text-neutral-400">(edited)</span>
                    )}
                  </div>

                  {/* Actions (only for own comments) */}
                  {isOwnComment(comment) && comment.commentType === 'user_comment' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingCommentId !== comment.id && (
                        <>
                          <button
                            onClick={() => handleStartEdit(comment)}
                            className="p-1 text-neutral-500 hover:text-neutral-900 transition-colors"
                            title="Edit comment"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="p-1 text-neutral-500 hover:text-red-600 transition-colors"
                            title="Delete comment"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Comment Body */}
                {editingCommentId === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none text-sm"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={!editText.trim() || updateMutation.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="inline-flex items-center gap-1 px-3 py-1 border border-neutral-300 text-neutral-700 text-xs font-medium rounded hover:bg-neutral-50 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">{comment.text}</p>
                )}

                {/* Timestamp */}
                <p className="text-xs text-neutral-400 mt-1">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
