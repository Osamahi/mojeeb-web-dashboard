/**
 * Mojeeb Prompt Editor Component
 * Simplified interface for editing agent prompt
 * Manual save matching KB cards pattern
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import type { Agent } from '../types/agent.types';
import { agentService } from '../services/agentService';
import { queryKeys } from '@/lib/queryKeys';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { plainTextToHtml } from '@/lib/textUtils';

interface PromptEditorProps {
  agent: Agent;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function PromptEditor({ agent, onSave, onCancel }: PromptEditorProps) {
  const queryClient = useQueryClient();
  const [editName, setEditName] = useState(agent.name || '');
  const [editPrompt, setEditPrompt] = useState(plainTextToHtml(agent.personaPrompt || ''));
  const [isModified, setIsModified] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Update form when agent changes (for agent switching)
  useEffect(() => {
    if (agent?.id) {
      setEditName(agent.name || '');
      setEditPrompt(plainTextToHtml(agent.personaPrompt || ''));
    }
  }, [agent?.id]);

  // Check if data has been modified
  useEffect(() => {
    const hasChanges =
      editName !== (agent.name || '') ||
      editPrompt !== plainTextToHtml(agent.personaPrompt || '');
    setIsModified(hasChanges);
  }, [editName, editPrompt, agent.name, agent.personaPrompt]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      return agentService.updateAgent(agent.id, {
        name: editName,
        personaPrompt: editPrompt,
      });
    },
    onSuccess: (updatedAgent) => {
      // Update cache
      queryClient.setQueryData(queryKeys.agent(agent.id), updatedAgent);
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
      setIsModified(false);
      setShowSuccessMessage(true);

      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);

      // Call onSave callback if provided
      if (onSave) {
        onSave();
      }
    },
    onError: (error) => {
      logger.error('Error saving agent', error);
      toast.error('Failed to save agent');
    },
  });

  const handleSave = () => {
    if (isModified && !saveMutation.isPending) {
      saveMutation.mutate();
    }
  };

  return (
    <div className="space-y-3">
      {/* Form Fields - Matching KB Cards */}
      <div className="space-y-3">
        <input
          type="text"
          value={editName || ''}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Agent name..."
          disabled={saveMutation.isPending}
          className={cn(
            'w-full px-3 py-2 rounded-lg text-sm',
            'bg-neutral-50 border border-neutral-200',
            'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
            'placeholder:text-neutral-400',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />

        <RichTextEditor
          value={editPrompt || '<p></p>'}
          onChange={(value) => setEditPrompt(value)}
          placeholder="You are a helpful assistant who..."
          minHeight={150}
          maxHeight={500}
          disabled={saveMutation.isPending}
        />
      </div>

      {/* Actions - GitHub Style */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditName(agent.name || '');
            setEditPrompt(plainTextToHtml(agent.personaPrompt || ''));
            if (onCancel) {
              onCancel();
            }
          }}
          disabled={saveMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={!isModified || saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="w-4 h-4" />
          Saved successfully
        </div>
      )}
    </div>
  );
}
