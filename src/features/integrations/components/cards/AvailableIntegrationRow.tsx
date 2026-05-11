/**
 * Available Integration Row
 *
 * One row per catalog entry — both available and coming-soon. Mirrors the layout
 * pattern from `features/connections/components/cards/AvailablePlatformRow.tsx`
 * so the two surfaces feel like cousins.
 *
 * Available rows: full color, "By Mojeeb · Native" trust badge, ops count subtitle,
 * primary [Connect] CTA. Whole row is clickable to launch the connect flow.
 *
 * Coming-soon rows: grayscale icon, neutral pill, ghost [Notify me] CTA. Clicking
 * Notify me triggers a frontend-only toast for v1 (no DB persistence yet).
 */

import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { IntegrationIcon } from '../IntegrationIcon';
import type { IntegrationMetadata } from '../../constants/integrations';

export interface AvailableIntegrationRowProps {
  integration: IntegrationMetadata;
  onConnect: (integrationId: string) => void;
  className?: string;
}

export function AvailableIntegrationRow({
  integration,
  onConnect,
  className,
}: AvailableIntegrationRowProps) {
  const { t } = useTranslation();
  const isComingSoon = integration.status === 'coming_soon';

  const handleConnect = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onConnect(integration.id);
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2.5 sm:gap-3 rounded-lg border p-2.5 sm:p-3 transition-all',
        isComingSoon
          ? 'border-neutral-200 bg-neutral-50/50 cursor-not-allowed'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm cursor-pointer',
        className
      )}
      onClick={() => !isComingSoon && handleConnect()}
    >
      {/* Vendor icon — grayscale + slight opacity for coming-soon (research: pair
          desaturation with reduced opacity so it reads "intentional" not "loading"). */}
      <IntegrationIcon
        connectorId={integration.id}
        brandBgColor={integration.brandBgColor}
        size="md"
        muted={isComingSoon}
      />

      {/* Name + trust badge + description + ops count */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          {/* Vendor name stays Latin even in AR per Salla/Zid convention. The
              dir="ltr" + bidi-isolate prevents stray punctuation reflow when the
              surrounding label is Arabic. */}
          <h3
            className={cn(
              'text-sm font-semibold truncate',
              isComingSoon ? 'text-neutral-500' : 'text-neutral-900'
            )}
            dir="ltr"
            style={{ unicodeBidi: 'isolate' }}
          >
            {integration.name}
          </h3>

        </div>

        <p
          className={cn(
            'text-[11px] line-clamp-2',
            isComingSoon ? 'text-neutral-400' : 'text-neutral-500'
          )}
        >
          {t(integration.descriptionKey)}
        </p>
      </div>

      {/* Right-side CTA — Connect (available) or static "Coming Soon" pill.
          The pill is informational only (no click affordance) — clicking a CTA
          that does nothing feels broken. When a notify-me / waitlist endpoint
          ships, swap this back to a button. */}
      {isComingSoon ? (
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
            {t('tools.coming_soon_pill')}
          </span>
        </div>
      ) : (
        <div className="flex-shrink-0">
          <Button
            onClick={handleConnect}
            // `inline-flex items-center justify-center gap-1.5` gives proper
            // vertical centering + a direction-aware gap between the label and
            // the icon. The previous `sm:ml-1` was a physical margin that put
            // the spacing on the wrong side in RTL, which left the + glyph
            // visually colliding with the Arabic label. Source order is
            // label-then-icon; in RTL the flex container reverses the visual
            // order automatically, so users see [+ ربط] without us needing to
            // swap the JSX based on direction.
            className="inline-flex items-center justify-center gap-1.5 h-7 sm:h-8 px-2.5 sm:px-3 bg-brand-mojeeb hover:bg-brand-mojeeb-hover text-white text-xs sm:text-sm"
            size="sm"
          >
            <span className="hidden sm:inline">{t('tools.connect_cta')}</span>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
