import { Check } from 'lucide-react';
import { memo } from 'react';

interface PlanFeaturesListProps {
  /** Number of messages per month */
  messageLimit: number;
  /** Number of agents allowed */
  agentLimit: number;
  /** Optional features array (e.g., ['analytics', 'priority_support']) */
  features?: string[];
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
}: PlanFeaturesListProps) => {
  return (
    <ul className="space-y-2 text-sm">
      {/* Message Limit */}
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
        <span>{messageLimit.toLocaleString()} messages/month</span>
      </li>

      {/* Agent Limit */}
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
        <span>{agentLimit} {agentLimit === 1 ? 'agent' : 'agents'}</span>
      </li>

      {/* Optional Features */}
      {features.includes('analytics') && (
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span>Analytics</span>
        </li>
      )}

      {features.includes('priority_support') && (
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span>Priority Support</span>
        </li>
      )}

      {features.includes('api_access') && (
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span>API Access</span>
        </li>
      )}
    </ul>
  );
});

PlanFeaturesList.displayName = 'PlanFeaturesList';
