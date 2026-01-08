/**
 * Mojeeb Knowledge Base Item Component
 * Simplified card design with minimal aesthetic
 * Clean, spacious layout for knowledge base list
 */

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronRight, Edit2, Trash2, Check, X, FileText } from 'lucide-react';
import type { KnowledgeBase } from '../types/agent.types';
import { agentService } from '../services/agentService';
import { useConfirm } from '@/hooks/useConfirm';
import { logger } from '@/lib/logger';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { plainTextToHtml } from '@/lib/textUtils';

interface KnowledgeBaseItemProps {
  knowledgeBase: KnowledgeBase;
  onUpdate: () => void;
}

export default function KnowledgeBaseItem({
  knowledgeBase,
  onUpdate,
}: KnowledgeBaseItemProps) {
  const { t } = useTranslation();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentName, setCurrentName] = useState(knowledgeBase.name);
  const [editName, setEditName] = useState(knowledgeBase.name);
  // Convert plain text to HTML on initial load (handle NULL content for documents)
  const [editContent, setEditContent] = useState(
    knowledgeBase.content ? plainTextToHtml(knowledgeBase.content) : ''
  );
  const [isModified, setIsModified] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Check if KB is document-based (content stored in chunks, not in KB record)
  const isDocumentBased = knowledgeBase.source_type === 'document';

  // Check if data has been modified
  useEffect(() => {
    const originalContent = knowledgeBase.content ? plainTextToHtml(knowledgeBase.content) : '';
    const hasChanges =
      editName !== knowledgeBase.name ||
      editContent !== originalContent;
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
      toast.error(t('studio.save_failed'));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await agentService.deleteKnowledgeBase(knowledgeBase.id);
    },
    onSuccess: () => {
      toast.success(t('studio.delete_success'));
      onUpdate();
    },
    onError: (error) => {
      logger.error('Error deleting KB', error);
      toast.error(t('studio.delete_failed'));
    },
  });

  const handleSave = () => {
    if (isModified && !updateMutation.isPending) {
      updateMutation.mutate();
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('studio.delete_confirm_title'),
      message: t('studio.delete_confirm_message', { name: knowledgeBase.name }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
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

  // Content preview (handle NULL for document-based KBs)
  const contentPreview = knowledgeBase.content
    ? knowledgeBase.content.substring(0, 120) + (knowledgeBase.content.length > 120 ? '...' : '')
    : null;

  // Render different card types based on source type
  if (isDocumentBased) {
    // Document KB: Simple card with document icon (not expandable)
    return (
      <>
        {ConfirmDialogComponent}

        <div className="bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-all duration-200 group">
          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
            {/* Document icon */}
            <FileText className="w-5 h-5 text-neutral-400 flex-shrink-0" />

            {/* Title */}
            <h3 className="flex-1 text-base font-semibold text-neutral-950 truncate">
              {toTitleCase(currentName)}
            </h3>

            {/* Action buttons - visible on hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="p-2 sm:p-1.5 hover:bg-red-50 rounded transition-colors text-neutral-600 hover:text-red-600 disabled:opacity-50 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                title={t('knowledge_base.delete_title')}
                aria-label={t('knowledge_base.delete_aria_label')}
              >
                <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Manual KB: Expandable accordion (existing behavior)
  return (
    <>
      {ConfirmDialogComponent}

      <div className="bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-all duration-200 group">
        {/* Accordion Header - GitHub Style */}
        <div
          className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer"
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

          {/* Hover Actions - GitHub Style (visible on hover or when expanded) */}
          <div className={cn(
            'flex items-center gap-1 transition-opacity',
            isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}>
            {!isEditing && (
              <>
                {/* Edit button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isExpanded) setIsExpanded(true);
                    setIsEditing(true);
                  }}
                  className="p-2 sm:p-1.5 rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center hover:bg-neutral-100 text-neutral-600 hover:text-neutral-950"
                  title={t('knowledge_base.edit_title')}
                  aria-label={t('knowledge_base.edit_aria_label')}
                >
                  <Edit2 className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={deleteMutation.isPending}
                  className="p-2 sm:p-1.5 hover:bg-red-50 rounded transition-colors text-neutral-600 hover:text-red-600 disabled:opacity-50 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                  title={t('knowledge_base.delete_title')}
                  aria-label={t('knowledge_base.delete_aria_label')}
                >
                  <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Accordion Content - Smooth Transition */}
        {isExpanded && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3 border-t border-neutral-100">
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

                  <RichTextEditor
                    value={editContent}
                    onChange={(value) => setEditContent(value)}
                    placeholder="Enter the knowledge base content..."
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
                      setEditContent(knowledgeBase.content ? plainTextToHtml(knowledgeBase.content) : '');
                    }}
                    disabled={updateMutation.isPending}
                  >
                    {t('common.cancel')}
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
                {knowledgeBase.content ? (
                  // Manual KB with content
                  <div
                    className="text-sm text-neutral-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: plainTextToHtml(knowledgeBase.content) }}
                  />
                ) : (
                  // Edge case: manual KB with no content
                  <div className="text-sm text-neutral-400 italic">No content available</div>
                )}

                {/* Success Message */}
                {showSuccessMessage && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    {t('knowledge_base.saved_successfully')}
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
