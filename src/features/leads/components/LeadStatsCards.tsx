/**
 * LeadStatsCards Component
 * Displays lead statistics in minimal card grid
 * Follows minimal design system (clean cards with borders, no shadows)
 */

import { useTranslation } from 'react-i18next';
import type { LeadStatistics } from '../types';

interface LeadStatsCardsProps {
  stats: LeadStatistics;
}

interface StatCard {
  labelKey: string;
  value: number;
}

export default function LeadStatsCards({ stats }: LeadStatsCardsProps) {
  const { t } = useTranslation();

  const cards: StatCard[] = [
    {
      labelKey: 'lead_stats.new_leads',
      value: stats.new,
    },
    {
      labelKey: 'lead_stats.processing',
      value: stats.processing,
    },
    {
      labelKey: 'lead_stats.completed',
      value: stats.completed,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.labelKey}
          className="bg-white rounded-lg border border-neutral-200 p-4"
        >
          <p className="text-sm font-medium text-neutral-600">{t(card.labelKey)}</p>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
