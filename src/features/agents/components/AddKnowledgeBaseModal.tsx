/**
 * Mojeeb Add Knowledge Base Modal Component
 * Create and link a new knowledge base to an agent
 * Features: Form validation, auto-link on create
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  const [errors, setErrors] = useState<{ name?: string; content?: string }>({});

  // Create + link mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      // Validate
      const validationErrors: { name?: string; content?: string } = {};
      if (!name.trim()) {
        validationErrors.name = 'Title is required';
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
      });

      // Link to agent
      await agentService.linkKnowledgeBase(agentId, kb.id);

      return kb;
    },
    onSuccess: () => {
      toast.success('Knowledge created and linked');
      // Reset form
      setName('');
      setContent('');
      setErrors({});
      onClose();
      onSuccess();
    },
    onError: (error: Error) => {
      logger.error('Error creating KB', error);
      if (error.message !== 'Validation failed') {
        toast.error('Failed to create knowledge');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    createMutation.mutate();
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      setName('');
      setContent('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Knowledge"
      description="Create a new knowledge section for your agent"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <Input
          label="Title"
          placeholder="Enter knowledge title..."
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
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (errors.content) setErrors({ ...errors, content: undefined });
          }}
          error={errors.content}
          autoResize
          minHeight={150}
          maxHeight={400}
          disabled={createMutation.isPending}
          required
        />

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
            {createMutation.isPending ? 'Creating...' : 'Add Knowledge'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
