import { useState, useEffect, useCallback } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useDateLocale } from '@/lib/dateConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { subscriptionService } from '../services/subscriptionService';
import type { SubscriptionPlan, SubscriptionDetails } from '../types/subscription.types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { PlanSelectionGrid } from './PlanSelectionGrid';
import { PlanFeaturesList } from './PlanFeaturesList';
import { StripeCheckoutButton } from '@/features/billing/components/StripeCheckoutButton';
import { BillingCurrency, BillingInterval } from '@/features/billing/types/billing.types';
import { requiresPayment } from '../utils/planComparison';

interface PlanChangeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription: SubscriptionDetails;
  onSuccess: () => void;
}

type WizardStep = 'select-plan' | 'confirm';

export function PlanChangeWizard({
  isOpen,
  onClose,
  currentSubscription,
  onSuccess,
}: PlanChangeWizardProps) {
  const { t } = useTranslation();
  const { format } = useDateLocale();
  const [step, setStep] = useState<WizardStep>('select-plan');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  // Always use monthly for now
  const billingInterval = 'monthly';

  useEffect(() => {
    if (isOpen) {
      setStep('select-plan');
      setSelectedPlan(null);
    }
  }, [isOpen]);

  const handleSelectPlan = useCallback((plan: SubscriptionPlan) => {
    // Prevent selecting current plan
    if (plan.code === currentSubscription.planCode) {
      return;
    }

    setSelectedPlan(plan);
    setStep('confirm');
  }, [currentSubscription.planCode]);

  const handleBack = useCallback(() => {
    setStep('select-plan');
    setSelectedPlan(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    // Validation: Ensure a plan is selected
    if (!selectedPlan) {
      toast.error(t('plan_change_wizard.no_plan_selected'), {
        description: t('plan_change_wizard.select_plan_first'),
      });
      return;
    }

    // Validation: Prevent changing to current plan (defense-in-depth)
    if (selectedPlan.code === currentSubscription.planCode) {
      toast.error(t('plan_change_wizard.cannot_change_current'), {
        description: t('plan_change_wizard.already_on_plan'),
      });
      handleBack();
      return;
    }

    // Validation: Ensure plan has valid pricing (try current currency, fallback to first available)
    const { price, currency: actualCurrency } = getPriceAndCurrency(selectedPlan);
    // Allow price = 0 for free plans, only reject if pricing is undefined/null
    if (price === undefined || price === null) {
      toast.error(t('plan_change_wizard.invalid_pricing'), {
        description: t('plan_change_wizard.no_pricing_available'),
      });
      handleBack();
      return;
    }

    const isDowngrade = selectedPlan.messageLimit < currentSubscription.messageLimit;

    try {
      setUpgrading(true);

      // Use the actual currency that has pricing available
      await subscriptionService.changePlan(
        selectedPlan.code,
        actualCurrency,
        billingInterval
      );

      toast.success(
        isDowngrade
          ? t('plan_change_wizard.downgrade_success', { name: selectedPlan.name })
          : t('plan_change_wizard.upgrade_success', { name: selectedPlan.name }),
        {
          description: t('plan_change_wizard.new_limits', {
            messages: selectedPlan.messageLimit.toLocaleString(),
            agents: selectedPlan.agentLimit
          }),
        }
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to change plan:', error);
      toast.error(t('plan_change_wizard.change_failed'), {
        description: t('plan_change_wizard.try_again'),
      });
    } finally {
      setUpgrading(false);
    }
  }, [selectedPlan, currentSubscription.planCode, currentSubscription.messageLimit, currentSubscription.currency, billingInterval, handleBack, onSuccess, onClose, t]);

  const getPriceAndCurrency = (plan: SubscriptionPlan): { price: number; currency: string } => {
    // Try current subscription currency
    const currency = currentSubscription.currency;
    const pricingByCurrency = plan.pricing[currency];

    // Fallback - try first available currency
    const availableCurrencyKey = Object.keys(plan.pricing)[0];
    const pricingByFirstKey = plan.pricing[availableCurrencyKey];

    // Use whichever works
    const pricing = pricingByCurrency || pricingByFirstKey;
    const actualCurrency = pricingByCurrency ? currency : availableCurrencyKey;

    if (!pricing) {
      if (import.meta.env.DEV) {
        console.error('[PlanChangeWizard] No pricing found for plan', plan.code);
      }
      return { price: 0, currency: currentSubscription.currency };
    }

    const price = pricing.monthly || 0;
    return { price, currency: actualCurrency };
  };

  const isDowngrade = selectedPlan
    ? selectedPlan.messageLimit < currentSubscription.messageLimit
    : false;

  // Check if plan change requires Stripe payment
  const needsPayment = selectedPlan
    ? requiresPayment(currentSubscription.planCode, selectedPlan.code)
    : false;

  // Slide transition variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -50 : 50,
      opacity: 0,
    }),
  };

  const direction = step === 'confirm' ? 1 : -1;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'select-plan' ? t('plan_change_wizard.title') : (isDowngrade ? t('plan_change_wizard.confirm_downgrade') : t('plan_change_wizard.confirm_upgrade'))}
      subtitle={step === 'select-plan' ? t('plan_change_wizard.subtitle') : undefined}
      maxWidth="2xl"
      isLoading={upgrading}
      closable={!upgrading}
      className={step === 'select-plan' ? '!max-w-[1200px]' : undefined}
    >
      <div className="relative">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          {step === 'select-plan' && (
            <motion.div
              key="select-plan"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <PlanSelectionGrid
                currentPlanCode={currentSubscription.planCode}
                currentMessageLimit={currentSubscription.messageLimit}
                currency={currentSubscription.currency}
                onSelectPlan={handleSelectPlan}
                showCurrentBadge={true}
                allowSelectCurrent={false}
              />
            </motion.div>
          )}

          {step === 'confirm' && selectedPlan && (
            <motion.div
              key="confirm"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="space-y-6">
                {/* Plan Change Summary */}
                <div className={`rounded-lg p-4 ${isDowngrade ? 'bg-orange-50' : 'bg-green-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isDowngrade ? 'bg-orange-100' : 'bg-green-100'
                    }`}>
                      {isDowngrade ? (
                        <TrendingDown className="h-5 w-5 text-orange-600" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {isDowngrade ? t('plan_change_wizard.downgrading_to', { name: selectedPlan.name }) : t('plan_change_wizard.upgrading_to', { name: selectedPlan.name })}
                      </h3>
                      <p className="text-sm text-gray-600">{t('plan_change_wizard.limits_take_effect')}</p>
                    </div>
                  </div>
                </div>

                {/* New Plan Card */}
                <div className="rounded-lg border-2 border-green-500 bg-white p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedPlan.name}</h3>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">
                        {(() => {
                          const { price, currency } = getPriceAndCurrency(selectedPlan);
                          return `${currency} ${price}`;
                        })()}
                      </span>
                      <span className="text-sm text-gray-500">{t('billing.per_month_abbr')}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <PlanFeaturesList
                      messageLimit={selectedPlan.messageLimit}
                      agentLimit={selectedPlan.agentLimit}
                      features={selectedPlan.features}
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      {t('plan_change_wizard.next_billing')}: <span className="font-medium text-gray-900">
                        {format(new Date(currentSubscription.currentPeriodEnd), 'MMM d, yyyy')}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleBack}
                    disabled={upgrading}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.back')}
                  </button>

                  {needsPayment ? (
                    /* Stripe checkout button for upgrades */
                    <div className="flex-1">
                      <StripeCheckoutButton
                        planId={selectedPlan.id}
                        currency={(() => {
                          const { currency } = getPriceAndCurrency(selectedPlan);
                          return currency as BillingCurrency;
                        })()}
                        billingInterval={billingInterval as BillingInterval}
                        label={t('plan_change_wizard.pay_with_stripe') || 'Next'}
                        className="w-full bg-neutral-950 hover:bg-neutral-900 text-white"
                      />
                    </div>
                  ) : (
                    /* Direct plan change button for downgrades/lateral moves */
                    <button
                      onClick={handleConfirm}
                      disabled={upgrading}
                      className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDowngrade
                          ? 'bg-orange-600 hover:bg-orange-700'
                          : 'bg-neutral-950 hover:bg-neutral-900'
                      }`}
                    >
                      {upgrading
                        ? (isDowngrade ? t('plan_change_wizard.downgrading') : t('plan_change_wizard.changing'))
                        : (isDowngrade ? t('plan_change_wizard.confirm_downgrade') : t('plan_change_wizard.confirm_change'))
                      }
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BaseModal>
  );
}
