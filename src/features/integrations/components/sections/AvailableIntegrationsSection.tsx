/**
 * Available Integrations Section
 *
 * Lists the full integration catalog (available + coming-soon mixed) below the
 * user's connections on the Tools page. Mirrors `AvailablePlatformsSection` from
 * /connections: single sorted list with available items first, coming-soon at end.
 *
 * The "mixed list" choice (vs. two separate sub-sections) is intentional at this
 * catalog scale (≤10 items): the visual treatment (grayscale icon + neutral pill /
 * Notify CTA) carries the rank without needing a separate header. When the catalog
 * grows past ~15 items we'll split into "Available" + "Coming Soon" sub-sections.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AvailableIntegrationRow } from '../cards/AvailableIntegrationRow';
import { INTEGRATIONS } from '../../constants/integrations';

export interface AvailableIntegrationsSectionProps {
  onConnect: (integrationId: string) => void;
  isLoading?: boolean;
}

export function AvailableIntegrationsSection({
  onConnect,
  isLoading = false,
}: AvailableIntegrationsSectionProps) {
  const { t } = useTranslation();

  // Sort: available first (in catalog order), then coming-soon (in catalog order).
  // Catalog order is curated in `INTEGRATIONS` so authors control priority —
  // alphabetical sorting is meaningless at small catalog sizes (research-backed).
  const sortedIntegrations = useMemo(() => {
    return [...INTEGRATIONS].sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'available' ? -1 : 1;
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t('tools.available_heading')}
        </h2>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-neutral-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          {sortedIntegrations.map((integration) => (
            <AvailableIntegrationRow
              key={integration.id}
              integration={integration}
              onConnect={onConnect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
