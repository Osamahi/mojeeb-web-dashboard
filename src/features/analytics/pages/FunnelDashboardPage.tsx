import { useState, useMemo, useCallback } from 'react';
import { subDays, startOfDay, format } from 'date-fns';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useFunnelSummary } from '../hooks/useFunnelSummary';
import { FunnelDateFilter } from '../components/FunnelDateFilter';
import { FunnelSummaryCards } from '../components/FunnelSummaryCards';
import { FunnelChart } from '../components/FunnelChart';
import { StepUsersModal } from '../components/StepUsersModal';
import type { DateRangePreset } from '../types/funnel.types';

function getDateRange(preset: DateRangePreset) {
  const end = new Date();
  const start = preset === 'today'
    ? startOfDay(end)
    : subDays(end, preset === '7d' ? 7 : preset === '30d' ? 30 : 90);
  return {
    startDate: format(start, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    endDate: format(end, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  };
}

export default function FunnelDashboardPage() {
  useDocumentTitle('pages.title_funnel_analytics');
  const [preset, setPreset] = useState<DateRangePreset>('30d');
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const { startDate, endDate } = useMemo(() => getDateRange(preset), [preset]);
  const { data: steps = [], isLoading } = useFunnelSummary(startDate, endDate);

  const skippedCount = useMemo(
    () => steps.find((s) => s.eventName === 'onboarding_skipped')?.uniqueUsers ?? 0,
    [steps]
  );

  const handlePresetChange = useCallback((p: DateRangePreset) => setPreset(p), []);
  const handleBarClick = useCallback((eventName: string) => setSelectedStep(eventName), []);
  const handleCloseModal = useCallback(() => setSelectedStep(null), []);

  return (
    <div className="space-y-6 p-6">
      <BaseHeader
        title="Funnel Analytics"
        subtitle="Signup to subscription conversion"
        additionalActions={<FunnelDateFilter selected={preset} onChange={handlePresetChange} />}
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-neutral-100 rounded w-24 mb-2" />
                <div className="h-7 bg-neutral-100 rounded w-16" />
              </div>
            ))}
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-neutral-100 rounded w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-6 bg-neutral-100 rounded" style={{ width: `${100 - i * 7}%` }} />
              ))}
            </div>
          </div>
        </div>
      ) : steps.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
          <p className="text-neutral-400">No funnel data for the selected period</p>
        </div>
      ) : (
        <>
          <FunnelSummaryCards steps={steps} />
          <FunnelChart steps={steps} skippedCount={skippedCount} onBarClick={handleBarClick} />
        </>
      )}

      <StepUsersModal
        isOpen={!!selectedStep}
        onClose={handleCloseModal}
        eventName={selectedStep}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
