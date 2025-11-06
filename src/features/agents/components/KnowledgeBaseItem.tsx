/**
 * Mojeeb Knowledge Base Item Component
 * Collapsible KB card with inline editing
 * Features: Expand/collapse, edit, delete, tag management
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Save,
  X,
  Tag,
  Plus,
} from 'lucide-react';
import type { KnowledgeBase } from '../types/agent.types';
import { agentService } from '../services/agentService';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useConfirm } from '@/hooks/useConfirm';
import { logger } from '@/lib/logger';

interface KnowledgeBaseItemProps {
  knowledgeBase: KnowledgeBase;
  agentId: string;
  onUpdate: () => void;
}

export default function KnowledgeBaseItem({
  knowledgeBase,
  agentId,
  onUpdate,
}: KnowledgeBaseItemProps) {
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit state
  const [name, setName] = useState(knowledgeBase.name);
  const [content, setContent] = useState(knowledgeBase.content);
  const [tags, setTags] = useState<string[]>(knowledgeBase.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isModified, setIsModified] = useState(false);

  // Check if modified
  useEffect(() => {
    const hasChanges =
      name !== knowledgeBase.name ||
      content !== knowledgeBase.content ||
      JSON.stringify(tags) !== JSON.stringify(knowledgeBase.tags || []);
    setIsModified(hasChanges);
  }, [name, content, tags, knowledgeBase]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      return agentService.updateKnowledgeBase(knowledgeBase.id, {
        name,
        content,
        tags: tags.length > 0 ? tags : null,
      });
    },
    onSuccess: () => {
      toast.success('Knowledge base updated');
      setIsEditing(false);
      onUpdate();
    },
    onError: (error) => {
      logger.error('Error updating KB', error);
      toast.error('Failed to update knowledge base');
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
    if (isModified) {
      updateMutation.mutate();
    }
  };

  const handleCancel = () => {
    setName(knowledgeBase.name);
    setContent(knowledgeBase.content);
    setTags(knowledgeBase.tags || []);
    setIsEditing(false);
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

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const contentPreview = content.substring(0, 80) + (content.length > 80 ? '...' : '');

  return (
    <>
      {ConfirmDialogComponent}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        {/* Collapsed Header */}
        <div
        className={cn(
          'p-4 cursor-pointer hover:bg-neutral-50 transition-colors',
          isExpanded && 'border-b border-neutral-200'
        )}
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Expand/Collapse Icon */}
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" />
            ) : (
              <ChevronRight className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" />
            )}

            {/* KB Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-neutral-950 truncate">{knowledgeBase.name}</h3>
              {!isExpanded && (
                <>
                  <p className="text-sm text-neutral-500 mt-1 line-clamp-1">
                    {contentPreview}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                    <span>{content.length} characters</span>
                    {tags.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-neutral-100 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {tags.length > 3 && <span>+{tags.length - 3} more</span>}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!isExpanded && (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setIsExpanded(true);
                  setIsEditing(true);
                }}
                className="p-2 hover:bg-neutral-100 rounded-md transition-colors"
                title="Edit"
              >
                <Edit2 className="w-4 h-4 text-neutral-600" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="p-2 hover:bg-error/10 rounded-md transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-error" />
              </button>
            </div>
          )}
        </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
        <div className="p-4 space-y-4 bg-white">
          {isEditing ? (
            <>
              {/* Edit Mode */}
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Knowledge base name..."
              />

              <Textarea
                label="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter knowledge base content..."
                showCharCount
                autoResize
                minHeight={150}
                maxHeight={500}
              />

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tags
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button variant="secondary" size="sm" onClick={handleAddTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 rounded text-sm"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-error"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={!isModified || updateMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* View Mode */}
              <div>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap">{content}</p>
              </div>

              {tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-neutral-200">
                  <Tag className="w-4 h-4 text-neutral-500" />
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-neutral-100 rounded text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons in Expanded View */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                <span className="text-xs text-neutral-500">
                  {content.length} characters
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
        )}
      </div>
    </>
  );
}
