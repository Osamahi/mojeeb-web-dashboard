/**
 * Agent Form Modal
 * Modal dialog for creating or editing an AI agent
 * Refactored to use BaseModal component for consistency
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      toast.success(t('agent_form.success_created'));
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
      handleClose();
    },
    onError: (error: unknown) => {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || t('agent_form.error_create'));
      } else {
        toast.error(t('agent_form.error_unexpected'));
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateAgentRequest) => agentService.updateAgent(agent!.id, data),
    onSuccess: () => {
      toast.success(t('agent_form.success_updated'));
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
      handleClose();
    },
    onError: (error: unknown) => {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || t('agent_form.error_update'));
      } else {
        toast.error(t('agent_form.error_unexpected'));
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
      toast.error(t('agent_form.validation_name_required'));
      return;
    }

    if (formData.name.trim().length < 2) {
      toast.error(t('agent_form.validation_name_too_short'));
      return;
    }

    // Validate persona prompt is not empty
    if (!formData.personaPrompt?.trim()) {
      toast.error(t('agent_form.validation_instructions_required'));
      return;
    }

    if (isEditMode) {
      if (!agent) {
        toast.error(t('agent_form.error_missing_data'));
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
      title={t(isEditMode ? 'agent_form.title_edit' : 'agent_form.title_create')}
      subtitle={t(isEditMode ? 'agent_form.subtitle_edit' : 'agent_form.subtitle_create')}
      maxWidth="lg"
      isLoading={isPending}
      closable={!isPending}
      contentClassName="space-y-4"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Agent Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('agent_form.name_label')}
          </label>
          <Input
            id="name"
            type="text"
            placeholder={t('agent_form.name_placeholder')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Agent Instructions */}
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('agent_form.instructions_label')}
          </label>
          <textarea
            id="instructions"
            placeholder={t('agent_form.instructions_placeholder')}
            value={formData.personaPrompt || ''}
            onChange={(e) => setFormData({ ...formData, personaPrompt: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-mojeeb/20 focus:border-brand-mojeeb transition-colors duration-200 min-h-[100px] resize-y text-base"
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
            {t('agent_form.cancel_button')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isPending}
          >
            {isPending
              ? t(isEditMode ? 'agent_form.saving_button' : 'agent_form.creating_button')
              : t(isEditMode ? 'agent_form.save_button' : 'agent_form.create_button')
            }
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
