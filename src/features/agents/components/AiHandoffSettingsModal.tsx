import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
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

// Curated presets — covers the common cases (quick reply / coffee break / lunch / EOD / next-day)
const PRESETS = [5, 15, 60, 240, 1440] as const;

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

  // Single source of truth: total minutes. Derived state for the custom input below.
  const [minutes, setMinutes] = useState<number>(agent.aiHandoffWindowMinutes);
  const [isCustom, setIsCustom] = useState<boolean>(
    !PRESETS.includes(agent.aiHandoffWindowMinutes as (typeof PRESETS)[number])
  );

  const initialDecomposed = useMemo(
    () => decompose(agent.aiHandoffWindowMinutes),
    [agent.aiHandoffWindowMinutes]
  );
  const [customValue, setCustomValue] = useState<string>(String(initialDecomposed.value));
  const [customUnit, setCustomUnit] = useState<Unit>(initialDecomposed.unit);

  // Re-sync when modal opens or the underlying agent value changes
  useEffect(() => {
    if (!isOpen) return;
    setMinutes(agent.aiHandoffWindowMinutes);
    setIsCustom(!PRESETS.includes(agent.aiHandoffWindowMinutes as (typeof PRESETS)[number]));
    const d = decompose(agent.aiHandoffWindowMinutes);
    setCustomValue(String(d.value));
    setCustomUnit(d.unit);
  }, [isOpen, agent.aiHandoffWindowMinutes]);

  // When in custom mode, recompute minutes from the input + unit
  const customParsed = parseInt(customValue, 10);
  const customMinutes =
    !isNaN(customParsed) && customParsed > 0 ? toMinutes(customParsed, customUnit) : NaN;
  const customExceedsMax = !isNaN(customMinutes) && customMinutes > MAX_MINUTES;
  const customIsValid =
    !isNaN(customMinutes) && customMinutes >= MIN_MINUTES && customMinutes <= MAX_MINUTES;

  const effectiveMinutes = isCustom ? (customIsValid ? customMinutes : NaN) : minutes;
  const isValid = !isNaN(effectiveMinutes);
  const hasChanges = isValid && effectiveMinutes !== agent.aiHandoffWindowMinutes;

  const handlePresetClick = (presetMinutes: number) => {
    setIsCustom(false);
    setMinutes(presetMinutes);
  };

  const handleCustomToggle = () => {
    setIsCustom(true);
    // Seed the custom inputs with the current selection so users don't lose context
    const d = decompose(minutes);
    setCustomValue(String(d.value));
    setCustomUnit(d.unit);
  };

  const handleCustomUnitChange = (newUnit: Unit) => {
    setCustomUnit(newUnit);
    const p = parseInt(customValue, 10);
    if (!isNaN(p) && p > 0) {
      const total = toMinutes(p, newUnit);
      if (total > MAX_MINUTES) {
        const clamped = newUnit === 'hours' ? 24 : MAX_MINUTES;
        setCustomValue(String(clamped));
      }
    }
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      agentService.updateAgent(agent.id, {
        aiHandoffWindowMinutes: effectiveMinutes,
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

  // Format preset label compactly: "5m" / "15m" / "1h" / "4h" / "24h"
  const formatPreset = (m: number): string =>
    m < 60 ? `${m}${t('handoff_settings.unit_min_short')}` : `${m / 60}${t('handoff_settings.unit_hour_short')}`;

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
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            {t('handoff_settings.duration_label')}
          </label>

          {/* Preset pills + Custom — single row, wraps on small screens */}
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('handoff_settings.duration_label')}>
            {PRESETS.map((preset) => {
              const selected = !isCustom && minutes === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => handlePresetClick(preset)}
                  disabled={isBusy}
                  className={`h-9 px-4 rounded-full text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-mojeeb/30 disabled:opacity-50 disabled:cursor-not-allowed ${
                    selected
                      ? 'bg-brand-mojeeb text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {formatPreset(preset)}
                </button>
              );
            })}
            <button
              type="button"
              role="radio"
              aria-checked={isCustom}
              onClick={handleCustomToggle}
              disabled={isBusy}
              className={`h-9 px-4 rounded-full text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-mojeeb/30 disabled:opacity-50 disabled:cursor-not-allowed ${
                isCustom
                  ? 'bg-brand-mojeeb text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {t('handoff_settings.custom')}
            </button>
          </div>

          {/* Custom value editor — animated reveal */}
          <AnimatePresence initial={false}>
            {isCustom && (
              <motion.div
                key="custom-input"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={customUnit === 'hours' ? 24 : MAX_MINUTES}
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    disabled={isBusy}
                    className={`h-9 w-20 px-3 text-sm tabular-nums border rounded-md focus:outline-none focus:ring-1 transition-colors ${
                      customExceedsMax
                        ? 'border-red-300 focus:ring-red-400 focus:border-red-300'
                        : 'border-neutral-300 focus:ring-brand-mojeeb focus:border-brand-mojeeb'
                    }`}
                    autoFocus
                  />
                  <select
                    value={customUnit}
                    onChange={(e) => handleCustomUnitChange(e.target.value as Unit)}
                    disabled={isBusy}
                    className="h-9 px-3 text-sm border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-mojeeb focus:border-brand-mojeeb cursor-pointer"
                  >
                    <option value="minutes">{t('handoff_settings.unit_minutes')}</option>
                    <option value="hours">{t('handoff_settings.unit_hours')}</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
