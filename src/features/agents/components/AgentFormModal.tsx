/**
 * Agent Form Modal
 * Modal dialog for creating or editing an AI agent
 * Refactored to use BaseModal component for consistency
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { agentService } from '../services/agentService';
import { queryKeys } from '@/lib/queryKeys';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Agent, CreateAgentRequest, UpdateAgentRequest } from '../types';

interface AgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  agent?: Agent; // Required for edit mode
}

export default function AgentFormModal({ isOpen, onClose, mode, agent }: AgentFormModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = mode === 'edit';

  const [formData, setFormData] = useState<CreateAgentRequest>({
    name: '',
    personaPrompt: '',
  });

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && agent && isOpen) {
      setFormData({
        name: agent.name,
        personaPrompt: agent.personaPrompt ?? '',
      });
    }
  }, [isEditMode, agent, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateAgentRequest) => agentService.createAgent(data),
    onSuccess: () => {
      toast.success('Agent created successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
      handleClose();
    },
    onError: (error: unknown) => {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to create agent');
      } else {
        toast.error('An unexpected error occurred');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateAgentRequest) => agentService.updateAgent(agent!.id, data),
    onSuccess: () => {
      toast.success('Agent updated successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
      handleClose();
    },
    onError: (error: unknown) => {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to update agent');
      } else {
        toast.error('An unexpected error occurred');
      }
    },
  });

  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending;

  const handleClose = () => {
    setFormData({ name: '', personaPrompt: '' });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter an agent name');
      return;
    }

    if (formData.name.trim().length < 2) {
      toast.error('Agent name must be at least 2 characters');
      return;
    }

    // Validate persona prompt is not empty
    if (!formData.personaPrompt?.trim()) {
      toast.error('Please enter agent instructions');
      return;
    }

    if (isEditMode) {
      if (!agent) {
        toast.error('Cannot update: agent data is missing');
        return;
      }
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit Agent' : 'Create Agent'}
      subtitle={isEditMode ? 'Update your AI assistant' : 'Set up your new AI assistant'}
      maxWidth="lg"
      isLoading={isPending}
      closable={!isPending}
      contentClassName="space-y-4"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Agent Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
            Agent Name
          </label>
          <Input
            id="name"
            type="text"
            placeholder="My Agent"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Agent Instructions */}
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-neutral-700 mb-1">
            Instructions
          </label>
          <textarea
            id="instructions"
            placeholder="Describe how the agent should behave and respond to customers. For example: 'You are a friendly customer support agent who helps users with product questions.'"
            value={formData.personaPrompt || ''}
            onChange={(e) => setFormData({ ...formData, personaPrompt: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-colors duration-200 min-h-[100px] resize-y text-base"
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isPending}
          >
            {isPending
              ? (isEditMode ? 'Saving...' : 'Creating...')
              : (isEditMode ? 'Save' : 'Create')
            }
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
