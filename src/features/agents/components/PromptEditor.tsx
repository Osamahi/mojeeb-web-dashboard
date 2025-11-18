/**
 * Mojeeb Prompt Editor Component
 * Simplified interface for editing agent prompt
 * Auto-save with minimal design
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';
import type { Agent } from '../types/agent.types';
import { agentService } from '../services/agentService';
import { queryKeys } from '@/lib/queryKeys';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface PromptEditorProps {
  agent: Agent;
}

export default function PromptEditor({ agent }: PromptEditorProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(agent.name);
  const [prompt, setPrompt] = useState(agent.personaPrompt || '');
  const [isModified, setIsModified] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Check if data has been modified
  useEffect(() => {
    const hasChanges =
      name !== agent.name ||
      prompt !== (agent.personaPrompt || '');
    setIsModified(hasChanges);
  }, [name, prompt, agent]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      return agentService.updateAgent(agent.id, {
        name,
        personaPrompt: prompt,
      });
    },
    onSuccess: (updatedAgent) => {
      // Update cache
      queryClient.setQueryData(queryKeys.agent(agent.id), updatedAgent);
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
      setIsModified(false);
      setLastSaved(new Date());
      toast.success('Agent updated successfully');
    },
    onError: (error) => {
      logger.error('Error saving agent', error);
      toast.error('Failed to save agent');
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
  }, [name, prompt, isModified, handleSave]);

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
      <div className="space-y-6 bg-white rounded-lg border border-neutral-200 p-4">
        {/* Agent Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Agent Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter agent name..."
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
        </div>

        {/* Persona Prompt */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Persona Instructions
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="You are a helpful assistant who..."
            showCharCount
            autoResize
            minHeight={200}
            maxHeight={600}
            disabled={saveMutation.isPending}
          />
          <p className="text-xs text-neutral-500 mt-2">
            Define your agent's personality, tone, and behavior. Be specific.
          </p>
        </div>
      </div>

      {/* Auto-save info */}
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Auto-saves after 2 seconds of inactivity</span>
      </div>
    </div>
  );
}
