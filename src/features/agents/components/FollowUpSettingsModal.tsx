import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Trash2, Clock } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { agentService } from '../services/agentService';
import { queryKeys } from '@/lib/queryKeys';
import {
  useFollowUpSteps,
  useCreateFollowUpStep,
  useDeleteFollowUpStep,
  useUpdateFollowUpStep,
} from '../hooks/useFollowUpSteps';
import type { FollowUpStep } from '../types/followUp.types';
import type { Agent } from '../types/agent.types';

interface FollowUpSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
}

const ELIGIBLE_PLATFORMS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
] as const;

const MAX_STEPS = 3;

function formatDelay(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(minutes / 1440);
  const remainingH = Math.floor((minutes % 1440) / 60);
  return remainingH > 0 ? `${d}d ${remainingH}h` : `${d}d`;
}

export default function FollowUpSettingsModal({
  isOpen,
  onClose,
  agent,
}: FollowUpSettingsModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [followUpEnabled, setFollowUpEnabled] = useState(agent.followUpEnabled);
  const [followUpPlatforms, setFollowUpPlatforms] = useState<string[]>(agent.followUpPlatforms);

  const { data: steps = [], isLoading: isLoadingSteps } = useFollowUpSteps(agent.id);
  const createStep = useCreateFollowUpStep(agent.id);
  const updateStep = useUpdateFollowUpStep(agent.id);
  const deleteStep = useDeleteFollowUpStep(agent.id);

  // Sync local state when agent data changes
  useEffect(() => {
    if (isOpen) {
      setFollowUpEnabled(agent.followUpEnabled);
      setFollowUpPlatforms(agent.followUpPlatforms);
    }
  }, [isOpen, agent.followUpEnabled, agent.followUpPlatforms]);

  // Save master toggle + platforms
  const saveMutation = useMutation({
    mutationFn: () =>
      agentService.updateAgent(agent.id, {
        followUpEnabled,
        followUpPlatforms,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agent(agent.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
      toast.success(t('follow_up.saved'));
    },
    onError: () => {
      toast.error(t('follow_up.save_failed'));
    },
  });

  const handlePlatformToggle = useCallback((platform: string) => {
    setFollowUpPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }, []);

  const handleAddStep = useCallback(() => {
    const maxOrder = steps.length > 0 ? Math.max(...steps.map(s => s.stepOrder)) : 0;
    const nextOrder = maxOrder + 1;
    if (nextOrder > MAX_STEPS) return;
    createStep.mutate({
      stepOrder: nextOrder,
      delayMinutes: nextOrder === 1 ? 5 : nextOrder === 2 ? 30 : 1440,
      isEnabled: true,
    });
  }, [steps, createStep]);

  const handleDeleteStep = useCallback(
    (stepId: string) => {
      deleteStep.mutate(stepId);
    },
    [deleteStep]
  );

  const handleUpdateDelay = useCallback(
    (stepId: string, delayMinutes: number) => {
      if (delayMinutes < 1 || delayMinutes > 10080) return;
      updateStep.mutate({ stepId, request: { delayMinutes } });
    },
    [updateStep]
  );

  const handleToggleStep = useCallback(
    (stepId: string, isEnabled: boolean) => {
      updateStep.mutate({ stepId, request: { isEnabled } });
    },
    [updateStep]
  );

  const handleSave = useCallback(() => {
    saveMutation.mutate();
  }, [saveMutation]);

  const isBusy =
    saveMutation.isPending ||
    createStep.isPending ||
    updateStep.isPending ||
    deleteStep.isPending;

  const hasChanges =
    followUpEnabled !== agent.followUpEnabled ||
    JSON.stringify([...followUpPlatforms].sort()) !==
      JSON.stringify([...agent.followUpPlatforms].sort());

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('follow_up.title')}
      subtitle={t('follow_up.subtitle')}
      maxWidth="md"
      isLoading={isBusy}
      closable={!isBusy}
    >
      <div className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {t('follow_up.enable_label')}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {t('follow_up.enable_description')}
            </p>
          </div>
          <Switch checked={followUpEnabled} onChange={setFollowUpEnabled} />
        </div>

        {followUpEnabled && (
          <>
            {/* Platform Selection */}
            <div>
              <p className="text-sm font-medium text-neutral-900 mb-2">
                {t('follow_up.platforms_label')}
              </p>
              <div className="flex flex-wrap gap-2">
                {ELIGIBLE_PLATFORMS.map((platform) => {
                  const isActive = followUpPlatforms.includes(platform.value);
                  return (
                    <button
                      key={platform.value}
                      type="button"
                      onClick={() => handlePlatformToggle(platform.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        isActive
                          ? 'bg-brand-mojeeb/10 border-brand-mojeeb text-brand-mojeeb'
                          : 'bg-white border-neutral-300 text-neutral-600 hover:border-neutral-400'
                      }`}
                    >
                      {platform.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Steps Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-neutral-900">
                  {t('follow_up.steps_label')}
                </p>
                {steps.length < MAX_STEPS && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddStep}
                    disabled={createStep.isPending}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {t('follow_up.add_step')}
                  </Button>
                )}
              </div>

              {isLoadingSteps ? (
                <div className="text-sm text-neutral-500 py-4 text-center">
                  {t('common.loading')}
                </div>
              ) : steps.length === 0 ? (
                <div className="text-sm text-neutral-500 py-4 text-center border border-dashed border-neutral-300 rounded-lg">
                  {t('follow_up.no_steps')}
                </div>
              ) : (
                <div className="space-y-2">
                  {(steps as FollowUpStep[])
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map((step) => (
                      <StepCard
                        key={step.id}
                        step={step}
                        onUpdateDelay={handleUpdateDelay}
                        onToggle={handleToggleStep}
                        onDelete={handleDeleteStep}
                        disabled={isBusy}
                      />
                    ))}
                </div>
              )}
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                {t('follow_up.kb_hint')}
              </p>
            </div>
          </>
        )}

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end pt-2 border-t border-neutral-200">
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={saveMutation.isPending}
              disabled={isBusy}
            >
              {t('common.save_changes')}
            </Button>
          </div>
        )}
      </div>
    </BaseModal>
  );
}

// Step Card Sub-Component

interface StepCardProps {
  step: FollowUpStep;
  onUpdateDelay: (stepId: string, delayMinutes: number) => void;
  onToggle: (stepId: string, isEnabled: boolean) => void;
  onDelete: (stepId: string) => void;
  disabled: boolean;
}

function StepCard({ step, onUpdateDelay, onToggle, onDelete, disabled }: StepCardProps) {
  const { t } = useTranslation();
  const [localDelay, setLocalDelay] = useState(String(step.delayMinutes));

  useEffect(() => {
    setLocalDelay(String(step.delayMinutes));
  }, [step.delayMinutes]);

  const handleDelayBlur = () => {
    const parsed = parseInt(localDelay, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 10080 && parsed !== step.delayMinutes) {
      onUpdateDelay(step.id, parsed);
    } else {
      setLocalDelay(String(step.delayMinutes));
    }
  };

  const displayMinutes = parseInt(localDelay, 10);

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg">
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600 shrink-0">
        {step.stepOrder}
      </div>

      <Clock className="w-4 h-4 text-neutral-400 shrink-0" />

      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <input
          type="number"
          min={1}
          max={10080}
          value={localDelay}
          onChange={(e) => setLocalDelay(e.target.value)}
          onBlur={handleDelayBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleDelayBlur()}
          disabled={disabled}
          className="w-20 px-2 py-1 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-mojeeb"
        />
        <span className="text-xs text-neutral-500">{t('follow_up.minutes')}</span>
        <span className="text-xs text-neutral-400 ms-1">
          ({formatDelay(!isNaN(displayMinutes) ? displayMinutes : step.delayMinutes)})
        </span>
      </div>

      <Switch
        checked={step.isEnabled}
        onChange={(checked) => onToggle(step.id, checked)}
        disabled={disabled}
      />

      <button
        type="button"
        onClick={() => onDelete(step.id)}
        disabled={disabled}
        className="p-1 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
        aria-label={t('common.delete')}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
