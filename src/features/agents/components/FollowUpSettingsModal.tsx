import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { agentService } from '../services/agentService';
import { queryKeys } from '@/lib/queryKeys';
import { useFollowUpSteps } from '../hooks/useFollowUpSteps';
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
const MAX_DELAY_MINUTES = 1440; // 24 hours

type TimeUnit = 'minutes' | 'hours';

/** Decompose total minutes into a value + unit (prefer hours if evenly divisible) */
function decomposeMinutes(totalMinutes: number): { value: number; unit: TimeUnit } {
  if (totalMinutes >= 60 && totalMinutes % 60 === 0) {
    return { value: totalMinutes / 60, unit: 'hours' };
  }
  return { value: totalMinutes, unit: 'minutes' };
}

/** Convert value + unit back to total minutes */
function toMinutes(value: number, unit: TimeUnit): number {
  return unit === 'hours' ? value * 60 : value;
}

// Local step type — includes a temp ID for newly added steps (not yet on server)
interface LocalStep {
  id: string;
  stepOrder: number;
  delayMinutes: number;
  isEnabled: boolean;
  isNew?: boolean; // true = needs to be created on save
}

let tempIdCounter = 0;
function generateTempId() {
  return `temp_${++tempIdCounter}_${Date.now()}`;
}

export default function FollowUpSettingsModal({
  isOpen,
  onClose,
  agent,
}: FollowUpSettingsModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Agent-level local state
  const [followUpEnabled, setFollowUpEnabled] = useState(agent.followUpEnabled);
  const [followUpPlatforms, setFollowUpPlatforms] = useState<string[]>(agent.followUpPlatforms);

  // Fetch server steps (read-only reference)
  const { data: serverSteps = [], isLoading: isLoadingSteps } = useFollowUpSteps(agent.id);

  // Local steps state — all edits happen here until Save
  const [localSteps, setLocalSteps] = useState<LocalStep[]>([]);
  const [deletedStepIds, setDeletedStepIds] = useState<string[]>([]);

  // Sync local state when modal opens or server data changes
  useEffect(() => {
    if (isOpen) {
      setFollowUpEnabled(agent.followUpEnabled);
      setFollowUpPlatforms(agent.followUpPlatforms);
    }
  }, [isOpen, agent.followUpEnabled, agent.followUpPlatforms]);

  // Sync local steps from server steps when they load/change (only when no unsaved changes)
  useEffect(() => {
    if (isOpen && serverSteps.length >= 0) {
      setLocalSteps(
        serverSteps.map((s) => ({
          id: s.id,
          stepOrder: s.stepOrder,
          delayMinutes: s.delayMinutes,
          isEnabled: s.isEnabled,
        }))
      );
      setDeletedStepIds([]);
    }
  }, [isOpen, serverSteps]);

  // Save ALL changes in one batch
  const saveMutation = useMutation({
    mutationFn: async () => {
      const promises: Promise<unknown>[] = [];

      // 1. Update agent toggle + platforms
      promises.push(
        agentService.updateAgent(agent.id, {
          followUpEnabled,
          followUpPlatforms,
        })
      );

      // 2. Delete removed steps
      for (const stepId of deletedStepIds) {
        promises.push(agentService.deleteFollowUpStep(agent.id, stepId));
      }

      // 3. Create new steps
      for (const step of localSteps.filter((s) => s.isNew)) {
        promises.push(
          agentService.createFollowUpStep(agent.id, {
            stepOrder: step.stepOrder,
            delayMinutes: step.delayMinutes,
            isEnabled: step.isEnabled,
          })
        );
      }

      // 4. Update modified existing steps
      for (const localStep of localSteps.filter((s) => !s.isNew)) {
        const serverStep = serverSteps.find((ss) => ss.id === localStep.id);
        if (serverStep && serverStep.delayMinutes !== localStep.delayMinutes) {
          promises.push(
            agentService.updateFollowUpStep(agent.id, localStep.id, {
              delayMinutes: localStep.delayMinutes,
            })
          );
        }
      }

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agent(agent.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
      queryClient.invalidateQueries({ queryKey: queryKeys.followUpSteps(agent.id) });
      toast.success(t('follow_up.saved'));
      onClose();
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
    setLocalSteps((prev) => {
      if (prev.length >= MAX_STEPS) return prev;

      // Find a default delay that doesn't conflict with existing steps
      let defaultDelay = 5;
      const existingDelays = new Set(prev.map(s => s.delayMinutes));
      const suggestions = [5, 30, 60, 120, 240, 480, 1440];
      for (const suggestion of suggestions) {
        if (!existingDelays.has(suggestion)) {
          defaultDelay = suggestion;
          break;
        }
      }

      return [
        ...prev,
        {
          id: generateTempId(),
          stepOrder: prev.length + 1, // Temporary, will be auto-sorted
          delayMinutes: defaultDelay,
          isEnabled: true,
          isNew: true,
        },
      ].sort((a, b) => a.delayMinutes - b.delayMinutes).map((s, i) => ({ ...s, stepOrder: i + 1 }));
    });
  }, []);

  const handleDeleteStep = useCallback((stepId: string) => {
    setLocalSteps((prev) => {
      const step = prev.find((s) => s.id === stepId);
      // If it's a server step, track for deletion
      if (step && !step.isNew) {
        setDeletedStepIds((ids) => [...ids, stepId]);
      }
      // Remove from local list, auto-sort by delay, and re-number
      return prev
        .filter((s) => s.id !== stepId)
        .sort((a, b) => a.delayMinutes - b.delayMinutes)
        .map((s, i) => ({ ...s, stepOrder: i + 1 }));
    });
  }, []);

  const handleUpdateDelay = useCallback((stepId: string, delayMinutes: number) => {
    if (delayMinutes < 1 || delayMinutes > MAX_DELAY_MINUTES) return;
    setLocalSteps((prev) => {
      // Check for duplicate delay times
      const hasDuplicate = prev.some(s => s.id !== stepId && s.delayMinutes === delayMinutes);
      if (hasDuplicate) {
        toast.error(t('follow_up.duplicate_time_error'));
        return prev;
      }

      // Update and auto-sort by delay time
      return prev
        .map((s) => (s.id === stepId ? { ...s, delayMinutes } : s))
        .sort((a, b) => a.delayMinutes - b.delayMinutes)
        .map((s, i) => ({ ...s, stepOrder: i + 1 }));
    });
  }, [t]);

  const handleSave = useCallback(() => {
    saveMutation.mutate();
  }, [saveMutation]);

  const isBusy = saveMutation.isPending;

  // Detect if anything changed from the server state
  const agentChanged =
    followUpEnabled !== agent.followUpEnabled ||
    JSON.stringify([...followUpPlatforms].sort()) !==
      JSON.stringify([...agent.followUpPlatforms].sort());

  const stepsChanged =
    deletedStepIds.length > 0 ||
    localSteps.some((s) => s.isNew) ||
    localSteps.some((local) => {
      const server = serverSteps.find((ss) => ss.id === local.id);
      return server && server.delayMinutes !== local.delayMinutes;
    });

  const hasChanges = agentChanged || stepsChanged;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('follow_up.title')}
      subtitle={t('follow_up.subtitle_detailed')}
      maxWidth="md"
      isLoading={isBusy}
      closable={!isBusy}
    >
      <div className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-900">
            {t('follow_up.enable_label')}
          </p>
          <Switch checked={followUpEnabled} onChange={setFollowUpEnabled} />
        </div>

        {followUpEnabled && (
          <>
            {/* Platform Selection */}
            <div>
              <p className="text-sm font-medium text-neutral-900 mb-2">
                {t('follow_up.platforms_label')}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {ELIGIBLE_PLATFORMS.map((platform) => {
                  const isActive = followUpPlatforms.includes(platform.value);
                  return (
                    <label
                      key={platform.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => handlePlatformToggle(platform.value)}
                        className="w-4 h-4 rounded border-neutral-300 cursor-pointer accent-brand-mojeeb"
                      />
                      <span className="text-sm text-neutral-700">{platform.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Steps Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-neutral-900">
                  {t('follow_up.send_after_label')}
                </p>
                {localSteps.length < MAX_STEPS && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddStep}
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
              ) : localSteps.length === 0 ? (
                <div className="text-sm text-neutral-500 py-4 text-center border border-dashed border-neutral-300 rounded-lg">
                  {t('follow_up.no_steps')}
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {localSteps
                      .sort((a, b) => a.stepOrder - b.stepOrder)
                      .map((step) => (
                        <motion.div
                          key={step.id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }}
                        >
                          <StepCard
                            step={step}
                            onUpdateDelay={handleUpdateDelay}
                            onDelete={handleDeleteStep}
                            disabled={isBusy}
                          />
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-2 border-t border-neutral-200">
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saveMutation.isPending}
            disabled={isBusy || !hasChanges}
            className="!bg-[#00bd6f] hover:!bg-[#00a862] active:!bg-[#009457]"
          >
            {t('common.save_changes')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}

// Step Card Sub-Component

interface StepCardProps {
  step: LocalStep;
  onUpdateDelay: (stepId: string, delayMinutes: number) => void;
  onDelete: (stepId: string) => void;
  disabled: boolean;
}

function StepCard({ step, onUpdateDelay, onDelete, disabled }: StepCardProps) {
  const { t } = useTranslation();
  const decomposed = decomposeMinutes(step.delayMinutes);
  const [localValue, setLocalValue] = useState(String(decomposed.value));
  const [localUnit, setLocalUnit] = useState<TimeUnit>(decomposed.unit);

  // Sync when parent step data changes
  useEffect(() => {
    const d = decomposeMinutes(step.delayMinutes);
    setLocalValue(String(d.value));
    setLocalUnit(d.unit);
  }, [step.delayMinutes]);

  // Check if current input exceeds max
  const parsed = parseInt(localValue, 10);
  const currentTotalMinutes = !isNaN(parsed) && parsed > 0 ? toMinutes(parsed, localUnit) : 0;
  const exceedsMax = currentTotalMinutes > MAX_DELAY_MINUTES;

  const commitDelay = (value: string, unit: TimeUnit) => {
    const p = parseInt(value, 10);
    if (isNaN(p) || p < 1) {
      const d = decomposeMinutes(step.delayMinutes);
      setLocalValue(String(d.value));
      setLocalUnit(d.unit);
      return;
    }
    const totalMinutes = toMinutes(p, unit);
    if (totalMinutes < 1 || totalMinutes > MAX_DELAY_MINUTES) {
      const d = decomposeMinutes(step.delayMinutes);
      setLocalValue(String(d.value));
      setLocalUnit(d.unit);
      return;
    }
    if (totalMinutes !== step.delayMinutes) {
      onUpdateDelay(step.id, totalMinutes);
    }
  };

  const handleValueBlur = () => {
    commitDelay(localValue, localUnit);
  };

  const handleUnitChange = (newUnit: TimeUnit) => {
    setLocalUnit(newUnit);
    const p = parseInt(localValue, 10);
    if (!isNaN(p) && p > 0) {
      const totalMinutes = toMinutes(p, newUnit);
      if (totalMinutes > MAX_DELAY_MINUTES) {
        // Clamp to max (24 hours or 1440 minutes)
        const clamped = newUnit === 'hours' ? 24 : MAX_DELAY_MINUTES;
        setLocalValue(String(clamped));
        commitDelay(String(clamped), newUnit);
        return;
      }
    }
    commitDelay(localValue, newUnit);
  };

  return (
    <div>
      <div className={`flex items-center gap-3 p-3 bg-white border rounded-lg ${exceedsMax ? 'border-red-300' : 'border-neutral-200'}`}>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <input
            type="number"
            min={1}
            max={localUnit === 'hours' ? 24 : MAX_DELAY_MINUTES}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleValueBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleValueBlur()}
            disabled={disabled}
            className={`w-16 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 ${exceedsMax ? 'border-red-300 focus:ring-red-400' : 'border-neutral-300 focus:ring-brand-mojeeb'}`}
          />
          <select
            value={localUnit}
            onChange={(e) => handleUnitChange(e.target.value as TimeUnit)}
            disabled={disabled}
            className="px-2 py-1 text-sm border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-mojeeb cursor-pointer"
          >
            <option value="minutes">{t('follow_up.unit_minutes')}</option>
            <option value="hours">{t('follow_up.unit_hours')}</option>
          </select>
        </div>

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
      {exceedsMax && (
        <p className="text-xs text-red-500 mt-1">
          {t('follow_up.max_delay', { minutes: MAX_DELAY_MINUTES })}
        </p>
      )}
    </div>
  );
}
