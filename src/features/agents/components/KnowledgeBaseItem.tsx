/**
 * Mojeeb Knowledge Base Item Component
 * Simplified card design with minimal aesthetic
 * Clean, spacious layout for knowledge base list
 */

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Edit2, Trash2, Check, Loader2 } from 'lucide-react';
import type { KnowledgeBase } from '../types/agent.types';
import { agentService } from '../services/agentService';
import { useConfirm } from '@/hooks/useConfirm';
import { logger } from '@/lib/logger';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

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
  const [isEditing, setIsEditing] = useState(false);
  const [currentName, setCurrentName] = useState(knowledgeBase.name);
  const [editName, setEditName] = useState(knowledgeBase.name);
  const [editContent, setEditContent] = useState(knowledgeBase.content);
  const [isModified, setIsModified] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Check if data has been modified
  useEffect(() => {
    const hasChanges =
      editName !== knowledgeBase.name || editContent !== knowledgeBase.content;
    setIsModified(hasChanges);
  }, [editName, editContent, knowledgeBase]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      return agentService.updateKnowledgeBase(knowledgeBase.id, {
        name: editName,
        content: editContent,
      });
    },
    onSuccess: () => {
      setIsModified(false);
      setShowSuccessMessage(true);
      setCurrentName(editName);
      onUpdate();

      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
    },
    onError: (error) => {
      logger.error('Error saving KB', error);
      toast.error('Failed to save knowledge base');
    },
  });

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

  const handleSave = () => {
    if (isModified && !updateMutation.isPending) {
      updateMutation.mutate();
    }
  };

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
        <div className="flex items-start justify-between gap-4 mb-3">
          <div
            className="flex-1 min-w-0"
            onClick={() => {
              if (!isEditing) {
                setIsExpanded(!isExpanded);
                if (isExpanded) setIsEditing(false); // Close editing when collapsing
              }
            }}
          >
            {!isEditing ? (
              <div className="cursor-pointer">
                <h3 className="text-base font-semibold text-neutral-950 mb-1 truncate">
                  {toTitleCase(currentName)}
                </h3>
                {!isExpanded && (
                  <p className="text-sm text-neutral-500 line-clamp-2">
                    {contentPreview}
                  </p>
                )}
              </div>
            ) : (
              // Name input in header when editing
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Knowledge base name..."
                disabled={updateMutation.isPending}
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg',
                  'bg-neutral-50 border border-neutral-200',
                  'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
                  'placeholder:text-neutral-400',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'text-base text-neutral-950',
                  'transition-all duration-200'
                )}
              />
            )}
          </div>

          {/* Action Buttons - Icon Only */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isExpanded) setIsExpanded(true);
                setIsEditing(!isEditing);
              }}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600 hover:text-neutral-950"
              title={isEditing ? 'Cancel Edit' : 'Edit'}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={deleteMutation.isPending}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-neutral-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-neutral-100 space-y-4">
            {isEditing ? (
              <>
                {/* Content Editor */}
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Enter the knowledge base content..."
                  autoResize
                  minHeight={200}
                  maxHeight={600}
                  disabled={updateMutation.isPending}
                />

                {/* Save Button / Status */}
                <div className="flex items-center justify-end">
                  {updateMutation.isPending ? (
                    <span className="text-sm text-neutral-600 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : showSuccessMessage ? (
                    <span className="text-sm text-green-600 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Saved successfully
                    </span>
                  ) : isModified ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                    >
                      Save
                    </Button>
                  ) : null}
                </div>
              </>
            ) : (
              // Read-only view
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                  {knowledgeBase.content}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
