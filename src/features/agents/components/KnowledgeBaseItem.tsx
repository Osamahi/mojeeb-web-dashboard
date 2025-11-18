/**
 * Mojeeb Knowledge Base Item Component
 * Simplified card design with minimal aesthetic
 * Clean, spacious layout for knowledge base list
 */

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronRight, Edit2, Trash2, Check, X } from 'lucide-react';
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
      setIsEditing(false); // Close edit mode after save
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

      <div className="bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-all duration-200 group">
        {/* Accordion Header - GitHub Style */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer"
          onClick={() => {
            if (!isEditing) {
              setIsExpanded(!isExpanded);
            }
          }}
        >
          {/* Chevron indicator */}
          <ChevronRight
            className={cn(
              'w-5 h-5 text-neutral-400 transition-transform duration-200 flex-shrink-0',
              isExpanded && 'rotate-90'
            )}
          />

          {/* Title */}
          <h3 className="flex-1 text-base font-semibold text-neutral-950 truncate">
            {toTitleCase(currentName)}
          </h3>

          {/* Hover Actions - GitHub Style (visible on hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isEditing && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isExpanded) setIsExpanded(true);
                    setIsEditing(true);
                  }}
                  className="p-1.5 hover:bg-neutral-100 rounded transition-colors text-neutral-600 hover:text-neutral-950"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 hover:bg-red-50 rounded transition-colors text-neutral-600 hover:text-red-600 disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Accordion Content - Smooth Transition */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-neutral-100">
            {isEditing ? (
              <>
                {/* Edit Mode - Inline */}
                <div className="pt-4 space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Knowledge base name..."
                    disabled={updateMutation.isPending}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg text-sm',
                      'bg-neutral-50 border border-neutral-200',
                      'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
                      'placeholder:text-neutral-400',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  />

                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Enter the knowledge base content..."
                    autoResize
                    minHeight={150}
                    maxHeight={500}
                    disabled={updateMutation.isPending}
                  />
                </div>

                {/* Actions - GitHub Style */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(knowledgeBase.name);
                      setEditContent(knowledgeBase.content);
                    }}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={!isModified || updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </>
            ) : (
              // View Mode - Clean Read-only
              <div className="pt-4 space-y-3">
                <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                  {knowledgeBase.content}
                </p>

                {/* Success Message */}
                {showSuccessMessage && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    Saved successfully
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
