/**
 * Create Agent Modal
 * Modal dialog for creating a new AI agent
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { agentService } from '../services/agentService';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { CreateAgentRequest } from '../types';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateAgentModal({ isOpen, onClose }: CreateAgentModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateAgentRequest>({
    name: '',
    personaPrompt: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAgentRequest) => agentService.createAgent(data),
    onSuccess: () => {
      toast.success('Agent created successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
      handleClose();
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message || 'Failed to create agent');
    },
  });

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

    createMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 className="text-xl font-semibold text-neutral-950">Create Agent</h2>
            <p className="text-sm text-neutral-600 mt-1">
              Set up your new AI assistant
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              placeholder="What should this agent do?"
              value={formData.personaPrompt || ''}
              onChange={(e) => setFormData({ ...formData, personaPrompt: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent min-h-[100px] resize-y text-sm"
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
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
