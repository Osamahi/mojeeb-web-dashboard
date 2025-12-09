/**
 * LeadStatsCards Component
 * Displays lead statistics in minimal card grid
 * Follows minimal design system (clean cards with borders, no shadows)
 */

import type { LeadStatistics } from '../types';

interface LeadStatsCardsProps {
  stats: LeadStatistics;
}

interface StatCard {
  label: string;
  value: number;
}

export default function LeadStatsCards({ stats }: LeadStatsCardsProps) {
  const cards: StatCard[] = [
    {
      label: 'New Leads',
      value: stats.new,
    },
    {
      label: 'Contacted',
      value: stats.contacted,
    },
    {
      label: 'Qualified',
      value: stats.qualified,
    },
    {
      label: 'Converted',
      value: stats.converted,
    },
    {
      label: 'Lost',
      value: stats.lost,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-lg border border-neutral-200 p-4"
        >
          <p className="text-sm font-medium text-neutral-600">{card.label}</p>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
