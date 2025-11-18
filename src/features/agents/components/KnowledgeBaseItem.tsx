/**
 * Mojeeb Knowledge Base Item Component
 * Simplified card design with minimal aesthetic
 * Clean, spacious layout for knowledge base list
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Edit2, Trash2 } from 'lucide-react';
import type { KnowledgeBase } from '../types/agent.types';
import { agentService } from '../services/agentService';
import { useConfirm } from '@/hooks/useConfirm';
import { logger } from '@/lib/logger';
import KBContentEditor from './KBContentEditor';

interface KnowledgeBaseItemProps {
  knowledgeBase: KnowledgeBase;
  onUpdate: () => void;
}

export default function KnowledgeBaseItem({
  knowledgeBase,
  onUpdate,
}: KnowledgeBaseItemProps) {
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentName, setCurrentName] = useState(knowledgeBase.name);

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

  // Convert to Title Case for consistent display
  const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
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
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-neutral-950 mb-1 truncate">
              {toTitleCase(currentName)}
            </h3>
            {!isExpanded && (
              <p className="text-sm text-neutral-500 line-clamp-2">
                {contentPreview}
              </p>
            )}
          </div>

          {/* Action Buttons - Icon Only */}
          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600 hover:text-neutral-950"
              title={isExpanded ? 'Close' : 'Edit'}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-neutral-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Editor */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <KBContentEditor
              knowledgeBase={knowledgeBase}
              onUpdate={onUpdate}
              onNameChange={setCurrentName}
            />
          </div>
        )}
      </div>
    </>
  );
}
