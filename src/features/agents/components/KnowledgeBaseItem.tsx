/**
 * Mojeeb Knowledge Base Item Component
 * Simplified card design with minimal aesthetic
 * Clean, spacious layout for knowledge base list
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Edit2, Trash2, FileText } from 'lucide-react';
import type { KnowledgeBase } from '../types/agent.types';
import { agentService } from '../services/agentService';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/hooks/useConfirm';
import { logger } from '@/lib/logger';

interface KnowledgeBaseItemProps {
  knowledgeBase: KnowledgeBase;
  onUpdate: () => void;
}

export default function KnowledgeBaseItem({
  knowledgeBase,
  onUpdate,
}: KnowledgeBaseItemProps) {
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await agentService.deleteKnowledgeBase(knowledgeBase.id);
    },
    onSuccess: () => {
      toast.success('Knowledge base deleted');
      onUpdate();
    },
    onError: (error) => {
      logger.error('Error deleting KB', error);
      toast.error('Failed to delete knowledge base');
    },
  });

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Knowledge Base',
      message: `Are you sure you want to delete "${knowledgeBase.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Content preview
  const contentPreview = knowledgeBase.content.substring(0, 120) +
    (knowledgeBase.content.length > 120 ? '...' : '');

  return (
    <>
      {ConfirmDialogComponent}

      <div className="bg-white rounded-lg border border-neutral-200 p-4 hover:border-neutral-300 transition-colors">
        {/* Header with Name and Actions */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-neutral-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-neutral-950 mb-1 truncate">
                {knowledgeBase.name}
              </h3>
              <p className="text-sm text-neutral-600 line-clamp-2">
                {contentPreview}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit2 className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-neutral-500 mt-4 pt-4 border-t border-neutral-100">
          <span>
            Added {formatDate(knowledgeBase.createdAt || new Date())}
          </span>
          <span>•</span>
          <span>{knowledgeBase.content.length.toLocaleString()} characters</span>

          {/* Tags if present */}
          {knowledgeBase.tags && knowledgeBase.tags.length > 0 && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {knowledgeBase.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-neutral-100 rounded text-xs text-neutral-700"
                  >
                    {tag}
                  </span>
                ))}
                {knowledgeBase.tags.length > 2 && (
                  <span className="text-xs text-neutral-500">
                    +{knowledgeBase.tags.length - 2} more
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Modal - TODO: Create EditKnowledgeBaseModal component */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-4">
            <h2 className="text-lg font-semibold mb-4">Edit Knowledge Base</h2>
            <p className="text-sm text-neutral-600 mb-4">
              Editing functionality coming soon. For now, please delete and recreate.
            </p>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
