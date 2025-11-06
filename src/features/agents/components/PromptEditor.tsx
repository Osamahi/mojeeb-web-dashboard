/**
 * Mojeeb Prompt Editor Component
 * Edit agent name and persona prompt with auto-save
 * Features: Dirty state tracking, character count, debounced auto-save
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Check } from 'lucide-react';
import type { Agent } from '../types/agent.types';
import { agentService } from '../services/agentService';
import { queryKeys } from '@/lib/queryKeys';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/logger';

interface PromptEditorProps {
  agent: Agent;
}

export default function PromptEditor({ agent }: PromptEditorProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(agent.name);
  const [prompt, setPrompt] = useState(agent.personaPrompt || '');
  const [description, setDescription] = useState(agent.description || '');
  const [isModified, setIsModified] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Check if data has been modified
  useEffect(() => {
    const hasChanges =
      name !== agent.name ||
      prompt !== (agent.personaPrompt || '') ||
      description !== (agent.description || '');
    setIsModified(hasChanges);
  }, [name, prompt, description, agent]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      return agentService.updateAgent(agent.id, {
        name,
        personaPrompt: prompt,
        description,
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

  // Define handleSave BEFORE using it in useEffect (fixes hoisting error)
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
  }, [name, prompt, description, isModified, handleSave]);

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (seconds < 60) return 'Saved just now';
    const minutes = Math.floor(seconds / 60);
    return `Saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950">
            Agent Configuration
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Edit your agent's name, description, and persona prompt
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Save status indicator */}
          {saveMutation.isPending ? (
            <span className="text-sm text-neutral-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-cyan rounded-full animate-pulse" />
              Saving...
            </span>
          ) : isModified ? (
            <span className="text-sm text-warning flex items-center gap-2">
              <span className="w-2 h-2 bg-warning rounded-full" />
              Unsaved changes
            </span>
          ) : lastSaved ? (
            <span className="text-sm text-success flex items-center gap-2">
              <Check className="w-4 h-4" />
              {formatLastSaved()}
            </span>
          ) : null}

          {/* Manual save button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!isModified || saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Agent Name */}
      <Input
        label="Agent Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter agent name..."
        disabled={saveMutation.isPending}
      />

      {/* Description (Optional) */}
      <Input
        label="Description (Optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Brief description of your agent..."
        disabled={saveMutation.isPending}
      />

      {/* Persona Prompt */}
      <Textarea
        label="Persona Prompt"
        helperText="Define your agent's personality, tone, and behavior"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="You are a helpful assistant..."
        showCharCount
        autoResize
        minHeight={120}
        maxHeight={500}
        disabled={saveMutation.isPending}
      />
    </div>
  );
}
