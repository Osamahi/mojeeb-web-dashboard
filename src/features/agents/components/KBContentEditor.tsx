/**
 * Knowledge Base Content Editor Component
 * Inline editor for KB name and content
 * Manual save with minimal design
 */

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';
import type { KnowledgeBase } from '../types/agent.types';
import { agentService } from '../services/agentService';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface KBContentEditorProps {
  knowledgeBase: KnowledgeBase;
  onUpdate: () => void;
  onNameChange: (newName: string) => void;
}

export default function KBContentEditor({
  knowledgeBase,
  onUpdate,
  onNameChange,
}: KBContentEditorProps) {
  const [name, setName] = useState(knowledgeBase.name);
  const [content, setContent] = useState(knowledgeBase.content);
  const [isModified, setIsModified] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Check if data has been modified
  useEffect(() => {
    const hasChanges =
      name !== knowledgeBase.name || content !== knowledgeBase.content;
    setIsModified(hasChanges);
  }, [name, content, knowledgeBase]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      return agentService.updateKnowledgeBase(knowledgeBase.id, {
        name,
        content,
      });
    },
    onSuccess: () => {
      setIsModified(false);
      setShowSuccessMessage(true);
      onNameChange(name); // Update parent's displayed name immediately
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

  const handleSave = () => {
    if (isModified && !saveMutation.isPending) {
      saveMutation.mutate();
    }
  };

  return (
    <div className="space-y-4">
      {/* Form Fields */}
      <div className="space-y-4 bg-white rounded-lg border border-neutral-200 p-4">
        {/* Knowledge Base Name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Knowledge base name..."
          disabled={saveMutation.isPending}
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

        {/* Content */}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter the knowledge base content..."
          autoResize
          minHeight={200}
          maxHeight={600}
          disabled={saveMutation.isPending}
        />
      </div>

      {/* Save Button / Status */}
      <div className="flex items-center justify-end">
        {saveMutation.isPending ? (
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
    </div>
  );
}
