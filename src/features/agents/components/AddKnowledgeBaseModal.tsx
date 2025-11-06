/**
 * Mojeeb Add Knowledge Base Modal Component
 * Create and link a new knowledge base to an agent
 * Features: Form validation, tag management, auto-link on create
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, X, Tag } from 'lucide-react';
import { agentService } from '../services/agentService';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/logger';

interface AddKnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  onSuccess: () => void;
}

export default function AddKnowledgeBaseModal({
  isOpen,
  onClose,
  agentId,
  onSuccess,
}: AddKnowledgeBaseModalProps) {
  // Form state
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<{ name?: string; content?: string }>({});

  // Create + link mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      // Validate
      const validationErrors: { name?: string; content?: string } = {};
      if (!name.trim()) {
        validationErrors.name = 'Name is required';
      }
      if (!content.trim()) {
        validationErrors.content = 'Content is required';
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error('Validation failed');
      }

      // Create KB
      const kb = await agentService.createKnowledgeBase({
        name: name.trim(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined,
      });

      // Link to agent
      await agentService.linkKnowledgeBase(agentId, kb.id);

      return kb;
    },
    onSuccess: () => {
      toast.success('Knowledge base created and linked');
      // Reset form
      setName('');
      setContent('');
      setTags([]);
      setNewTag('');
      setErrors({});
      onClose();
      onSuccess();
    },
    onError: (error: any) => {
      logger.error('Error creating KB', error);
      if (error.message !== 'Validation failed') {
        toast.error('Failed to create knowledge base');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    createMutation.mutate();
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

  const handleClose = () => {
    if (!createMutation.isPending) {
      setName('');
      setContent('');
      setTags([]);
      setNewTag('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Knowledge Base"
      description="Create a new knowledge base and link it to this agent"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <Input
          label="Name"
          placeholder="Enter knowledge base name..."
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors({ ...errors, name: undefined });
          }}
          error={errors.name}
          disabled={createMutation.isPending}
          required
        />

        {/* Content */}
        <Textarea
          label="Content"
          placeholder="Enter the knowledge base content..."
          helperText="This content will be used to provide context to your agent"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (errors.content) setErrors({ ...errors, content: undefined });
          }}
          error={errors.content}
          showCharCount
          autoResize
          minHeight={150}
          maxHeight={400}
          disabled={createMutation.isPending}
          required
        />

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Tags (Optional)
          </label>
          <div className="flex items-center gap-2 mb-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              disabled={createMutation.isPending}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddTag}
              disabled={createMutation.isPending}
            >
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
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-error"
                    disabled={createMutation.isPending}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Knowledge Base'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
