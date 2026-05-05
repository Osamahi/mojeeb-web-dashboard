import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { agentService } from '../services/agentService';
import { queryKeys } from '@/lib/queryKeys';
import type { Agent } from '../types/agent.types';

interface AiHandoffSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
}

const MIN_MINUTES = 1;
const MAX_MINUTES = 1440;

type Unit = 'minutes' | 'hours';

function decompose(totalMinutes: number): { value: number; unit: Unit } {
  if (totalMinutes >= 60 && totalMinutes % 60 === 0) {
    return { value: totalMinutes / 60, unit: 'hours' };
  }
  return { value: totalMinutes, unit: 'minutes' };
}

function toMinutes(value: number, unit: Unit): number {
  return unit === 'hours' ? value * 60 : value;
}

export default function AiHandoffSettingsModal({
  isOpen,
  onClose,
  agent,
}: AiHandoffSettingsModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const initial = decompose(agent.aiHandoffWindowMinutes);
  const [localValue, setLocalValue] = useState<string>(String(initial.value));
  const [unit, setUnit] = useState<Unit>(initial.unit);

  // Re-sync when modal opens or the agent changes
  useEffect(() => {
    if (!isOpen) return;
    const d = decompose(agent.aiHandoffWindowMinutes);
    setLocalValue(String(d.value));
    setUnit(d.unit);
  }, [isOpen, agent.aiHandoffWindowMinutes]);

  const parsed = parseInt(localValue, 10);
  const totalMinutes = !isNaN(parsed) && parsed > 0 ? toMinutes(parsed, unit) : 0;
  const exceedsMax = totalMinutes > MAX_MINUTES;
  const isValid =
    !isNaN(parsed) &&
    parsed > 0 &&
    totalMinutes >= MIN_MINUTES &&
    totalMinutes <= MAX_MINUTES;

  const hasChanges = isValid && totalMinutes !== agent.aiHandoffWindowMinutes;

  const handleUnitChange = (newUnit: Unit) => {
    setUnit(newUnit);
    const p = parseInt(localValue, 10);
    if (!isNaN(p) && p > 0) {
      const total = toMinutes(p, newUnit);
      if (total > MAX_MINUTES) {
        // Clamp when switching minutes -> hours would overflow
        const clamped = newUnit === 'hours' ? 24 : MAX_MINUTES;
        setLocalValue(String(clamped));
      }
    }
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      agentService.updateAgent(agent.id, {
        aiHandoffWindowMinutes: totalMinutes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agent(agent.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents() });
      toast.success(t('handoff_settings.saved'));
      onClose();
    },
    onError: () => {
      toast.error(t('handoff_settings.save_failed'));
    },
  });

  const handleSave = useCallback(() => {
    if (!isValid || !hasChanges) return;
    saveMutation.mutate();
  }, [isValid, hasChanges, saveMutation]);

  const isBusy = saveMutation.isPending;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('handoff_settings.title')}
      subtitle={t('handoff_settings.subtitle')}
      maxWidth="md"
      isLoading={isBusy}
      closable={!isBusy}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('handoff_settings.duration_label')}
          </label>
          <div
            className={`flex items-center gap-2 p-3 bg-white border rounded-lg transition-colors ${
              exceedsMax ? 'border-red-300' : 'border-neutral-200'
            }`}
          >
            <input
              type="number"
              min={1}
              max={unit === 'hours' ? 24 : MAX_MINUTES}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              disabled={isBusy}
              className={`w-20 px-3 py-1.5 text-sm tabular-nums border rounded-md focus:outline-none focus:ring-1 ${
                exceedsMax
                  ? 'border-red-300 focus:ring-red-400'
                  : 'border-neutral-300 focus:ring-brand-mojeeb focus:border-brand-mojeeb'
              }`}
            />
            <select
              value={unit}
              onChange={(e) => handleUnitChange(e.target.value as Unit)}
              disabled={isBusy}
              className="px-3 py-1.5 text-sm border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-mojeeb focus:border-brand-mojeeb cursor-pointer"
            >
              <option value="minutes">{t('handoff_settings.unit_minutes')}</option>
              <option value="hours">{t('handoff_settings.unit_hours')}</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2 border-t border-neutral-200">
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saveMutation.isPending}
            disabled={isBusy || !hasChanges || !isValid}
          >
            {t('common.save_changes')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
