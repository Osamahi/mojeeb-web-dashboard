import { Check } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

interface PlanFeaturesListProps {
  /** Number of messages per month */
  messageLimit: number;
  /** Number of agents allowed */
  agentLimit: number;
  /** Optional features array (e.g., ['analytics', 'priority_support']) */
  features?: string[];
  /** Plan code (used to determine static features like WhatsApp) */
  planCode?: string;
}

/**
 * PlanFeaturesList Component
 *
 * Displays a list of features for a subscription plan with checkmark icons.
 * Extracted from duplicate code in PlanSelectionGrid and PlanChangeWizard.
 *
 * Features displayed:
 * - Message limit (always shown)
 * - Agent limit (always shown)
 * - Analytics (if in features array)
 * - Priority Support (if in features array)
 * - API Access (if in features array)
 */
export const PlanFeaturesList = memo(({
  messageLimit,
  agentLimit,
  features = [],
  planCode,
}: PlanFeaturesListProps) => {
  const { t } = useTranslation();

  // Determine if WhatsApp Integration should be shown (static, website-level feature)
  const showWhatsAppIntegration = planCode === 'starter_production' || planCode === 'professional_production';

  return (
    <ul className="space-y-2 text-sm">
      {/* Message Limit */}
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
        <span>{t('plan_features.messages_per_month', { count: messageLimit.toLocaleString() })}</span>
      </li>

      {/* Agent Limit */}
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
        <span>{agentLimit === 1 ? t('plan_features.agent_singular', { count: agentLimit }) : t('plan_features.agent_plural', { count: agentLimit })}</span>
      </li>

      {/* Optional Features */}
      {features.includes('analytics') && (
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span>{t('plan_features.analytics')}</span>
        </li>
      )}

      {features.includes('priority_support') && (
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span>{t('plan_features.priority_support')}</span>
        </li>
      )}

      {features.includes('api_access') && (
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span>{t('plan_features.api_access')}</span>
        </li>
      )}

      {/* WhatsApp Integration - Static feature for Starter and Professional plans */}
      {showWhatsAppIntegration && (
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span>{t('plan_features.whatsapp_integration')}</span>
        </li>
      )}
    </ul>
  );
});

PlanFeaturesList.displayName = 'PlanFeaturesList';
