/**
 * WhatsAppUpgradeModal
 *
 * Shown when a Free-plan user clicks the "Upgrade" button on the WhatsApp
 * connection row. Explains that WhatsApp is a paid channel, lists the
 * qualifying plans with price + key limits, and routes to /my-subscription
 * with ?highlight=whatsapp so the subscription page can auto-open the plan
 * change wizard.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Rocket, MessageCircle, Check } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { usePlanStore } from '@/features/subscriptions/stores/planStore';
import { PlanCode } from '@/features/subscriptions/types/subscription.types';
import type { SubscriptionPlan } from '@/features/subscriptions/types/subscription.types';

export interface WhatsAppUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUALIFYING_PLAN_CODES: string[] = [PlanCode.Starter, PlanCode.Professional];

function getMonthlyPrice(plan: SubscriptionPlan): { amount: number; currency: string } {
  const currency = Object.keys(plan.pricing)[0] ?? 'USD';
  const amount = plan.pricing[currency]?.monthly ?? 0;
  return { amount, currency };
}

export function WhatsAppUpgradeModal({ isOpen, onClose }: WhatsAppUpgradeModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { plans, loadPlans } = usePlanStore();

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen, loadPlans]);

  const qualifyingPlans = plans
    .filter((p) => QUALIFYING_PLAN_CODES.includes(p.code))
    .sort((a, b) => getMonthlyPrice(a).amount - getMonthlyPrice(b).amount);

  const handleSeePlans = () => {
    onClose();
    navigate('/my-subscription?highlight=whatsapp');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('connections.whatsapp_upgrade_modal.title')}
      subtitle={t('connections.whatsapp_upgrade_modal.subtitle')}
      maxWidth="lg"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-100 p-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
            <MessageCircle className="h-5 w-5" />
          </div>
          <p className="text-sm text-neutral-700">
            {t('connections.whatsapp_upgrade_modal.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {qualifyingPlans.length === 0 ? (
            <div className="col-span-full text-sm text-neutral-500 text-center py-4">
              {t('connections.whatsapp_upgrade_modal.loading_plans')}
            </div>
          ) : (
            qualifyingPlans.map((plan) => {
              const { amount, currency } = getMonthlyPrice(plan);
              return (
                <div
                  key={plan.code}
                  className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-300 transition-colors"
                >
                  <h3 className="text-sm font-semibold text-neutral-900">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1" dir="ltr">
                    <span className="text-2xl font-bold text-neutral-900">
                      {amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {currency}/{t('plan_card.month')}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-neutral-600">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                      {t('connections.whatsapp_upgrade_modal.feature_messages', {
                        count: plan.messageLimit,
                      })}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                      {t('connections.whatsapp_upgrade_modal.feature_agents', {
                        count: plan.agentLimit,
                      })}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                      {t('connections.whatsapp_upgrade_modal.feature_whatsapp')}
                    </li>
                  </ul>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            {t('connections.whatsapp_upgrade_modal.cancel')}
          </Button>
          <Button
            onClick={handleSeePlans}
            className="bg-neutral-900 hover:bg-neutral-800 text-white"
          >
            <Rocket className="w-4 h-4 me-2" />
            {t('connections.whatsapp_upgrade_modal.see_plans_cta')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}

export default WhatsAppUpgradeModal;
