/**
 * Knowledge Base Content Editor Component
 * Inline editor for KB name and content
 * Auto-save with minimal design
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';
import type { KnowledgeBase } from '../types/agent.types';
import { agentService } from '../services/agentService';
import { Textarea } from '@/components/ui/Textarea';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface KBContentEditorProps {
  knowledgeBase: KnowledgeBase;
  onUpdate: () => void;
}

export default function KBContentEditor({
  knowledgeBase,
  onUpdate,
}: KBContentEditorProps) {
  const [name, setName] = useState(knowledgeBase.name);
  const [content, setContent] = useState(knowledgeBase.content);
  const [isModified, setIsModified] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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
      setLastSaved(new Date());
      toast.success('Knowledge base updated');
      onUpdate();
    },
    onError: (error) => {
      logger.error('Error saving KB', error);
      toast.error('Failed to save knowledge base');
    },
  });

  // Auto-save handler
  const handleSave = useCallback(() => {
    if (isModified && !saveMutation.isPending) {
      saveMutation.mutate();
    }
  }, [isModified, saveMutation]);

  // Debounced auto-save
  useEffect(() => {
    if (!isModified) return;

    const timeout = setTimeout(() => {
      handleSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeout);
  }, [name, content, isModified, handleSave]);

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">
      {/* Save Status Indicator */}
      <div className="flex items-center justify-end text-sm">
        {saveMutation.isPending ? (
          <span className="text-neutral-600 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </span>
        ) : isModified ? (
          <span className="text-amber-600 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Unsaved changes
          </span>
        ) : lastSaved ? (
          <span className="text-green-600 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Saved {formatLastSaved()}
          </span>
        ) : null}
      </div>

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
    </div>
  );
}
