/**
 * LeadStatsCards Component
 * Displays lead statistics in minimal card grid (dynamic status rendering)
 * Follows minimal design system (clean cards with borders, no shadows)
 *
 * Dynamic Rendering:
 * - Automatically renders cards for ANY status values from the API
 * - Uses translation keys: `lead_stats.{status}` (e.g., lead_stats.new, lead_stats.processing)
 * - Falls back to capitalized status name if translation key missing
 * - Excludes 'total' from card display
 */

import { useTranslation } from 'react-i18next';
import type { LeadStatistics } from '../types';

interface LeadStatsCardsProps {
  stats: LeadStatistics;
}

export default function LeadStatsCards({ stats }: LeadStatsCardsProps) {
  const { t } = useTranslation();

  // Extract status keys dynamically (exclude 'total')
  const statusKeys = Object.keys(stats).filter((key) => key !== 'total');

  // Generate cards dynamically from API response
  const cards = statusKeys.map((status) => ({
    status,
    labelKey: `lead_stats.${status}`,
    value: stats[status] ?? 0,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.status}
          className="bg-white rounded-lg border border-neutral-200 p-4"
        >
          <p className="text-sm font-medium text-neutral-600">
            {t(card.labelKey, { defaultValue: card.status.charAt(0).toUpperCase() + card.status.slice(1) })}
          </p>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
