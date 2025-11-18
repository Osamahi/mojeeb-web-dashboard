/**
 * Floating Prompt Editor Component
 * Gmail compose-style floating card for editing agent prompt
 * Can minimize, maximize, and close
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Minimize2, Maximize2, Check, Loader2 } from 'lucide-react';
import type { Agent } from '../types/agent.types';
import { agentService } from '../services/agentService';
import { queryKeys } from '@/lib/queryKeys';
import { Textarea } from '@/components/ui/Textarea';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface FloatingPromptEditorProps {
  agent: Agent;
  onClose: () => void;
}

export default function FloatingPromptEditor({
  agent,
  onClose,
}: FloatingPromptEditorProps) {
  const queryClient = useQueryClient();
  const [isMinimized, setIsMinimized] = useState(false);
  const [name, setName] = useState(agent.name);
  const [prompt, setPrompt] = useState(agent.personaPrompt || '');
  const [isModified, setIsModified] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Check if data has been modified
  useEffect(() => {
    const hasChanges =
      name !== agent.name || prompt !== (agent.personaPrompt || '');
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
      queryClient.setQueryData(queryKeys.agent(agent.id), updatedAgent);
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
      setIsModified(false);
      setLastSaved(new Date());
      toast.success('Agent updated');
    },
    onError: (error) => {
      logger.error('Error saving agent', error);
      toast.error('Failed to save');
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
    const timeout = setTimeout(() => handleSave(), 2000);
    return () => clearTimeout(timeout);
  }, [name, prompt, isModified, handleSave]);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isMinimized) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, isMinimized]);

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg',
            'bg-white border border-neutral-300 shadow-lg',
            'hover:shadow-xl transition-shadow',
            'text-sm font-medium text-neutral-950'
          )}
        >
          <span>Edit Prompt</span>
          {isModified && (
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="fixed bottom-6 right-6 z-40 w-[500px] max-w-[calc(100vw-3rem)]">
      <div className="bg-white rounded-lg shadow-2xl border border-neutral-200 flex flex-col max-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-950">
              Edit Prompt
            </h3>
            {/* Save status */}
            <div className="text-xs">
              {saveMutation.isPending ? (
                <span className="text-neutral-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              ) : isModified ? (
                <span className="text-amber-600">Unsaved</span>
              ) : lastSaved ? (
                <span className="text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {formatLastSaved()}
                </span>
              ) : null}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 hover:bg-neutral-200 rounded transition-colors"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4 text-neutral-600" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-200 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Agent Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Agent Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter agent name..."
              disabled={saveMutation.isPending}
              className={cn(
                'w-full px-3 py-2 rounded-md text-sm',
                'bg-neutral-50 border border-neutral-200',
                'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
                'placeholder:text-neutral-400',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
            />
          </div>

          {/* Persona Prompt */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Persona Prompt
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="You are a helpful assistant who..."
              showCharCount
              autoResize
              minHeight={200}
              maxHeight={350}
              disabled={saveMutation.isPending}
            />
            <p className="text-xs text-neutral-500 mt-1.5">
              Auto-saves after 2 seconds • Press ESC to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
