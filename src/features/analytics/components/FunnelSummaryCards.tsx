import type { FunnelStep } from '../types/funnel.types';
import { FUNNEL_STAGES, STAGE_LABELS } from '../types/funnel.types';

interface FunnelSummaryCardsProps {
  steps: FunnelStep[];
}

export function FunnelSummaryCards({ steps }: FunnelSummaryCardsProps) {
  const stepMap = new Map(steps.map((s) => [s.eventName, s.uniqueUsers]));

  const totalSignups = stepMap.get('signup_completed') ?? 0;
  const totalSubscribed = stepMap.get('subscription_purchased') ?? 0;
  const conversionRate = totalSignups > 0 ? ((totalSubscribed / totalSignups) * 100).toFixed(1) : '0';

  // Find biggest drop-off between consecutive funnel stages
  let biggestDrop = '';
  let biggestDropPct = 0;
  for (let i = 1; i < FUNNEL_STAGES.length; i++) {
    const prev = stepMap.get(FUNNEL_STAGES[i - 1]) ?? 0;
    const curr = stepMap.get(FUNNEL_STAGES[i]) ?? 0;
    if (prev > 0) {
      const dropPct = ((prev - curr) / prev) * 100;
      if (dropPct > biggestDropPct) {
        biggestDropPct = dropPct;
        biggestDrop = `${STAGE_LABELS[FUNNEL_STAGES[i - 1]]} → ${STAGE_LABELS[FUNNEL_STAGES[i]]}`;
      }
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="Total Signups" value={totalSignups.toString()} />
      <StatCard label="Conversion Rate" value={`${conversionRate}%`} subtitle="Signup → Subscribed" />
      <StatCard
        label="Biggest Drop-off"
        value={biggestDropPct > 0 ? `-${biggestDropPct.toFixed(0)}%` : 'N/A'}
        subtitle={biggestDrop}
      />
    </div>
  );
}

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="text-2xl font-semibold text-neutral-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-neutral-400 mt-1 truncate">{subtitle}</p>}
    </div>
  );
}
