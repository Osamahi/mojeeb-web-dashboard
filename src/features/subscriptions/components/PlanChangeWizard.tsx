import { useState, useEffect, useCallback } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { subscriptionService } from '../services/subscriptionService';
import type { SubscriptionPlan, SubscriptionDetails } from '../types/subscription.types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { PlanSelectionGrid } from './PlanSelectionGrid';
import { PlanFeaturesList } from './PlanFeaturesList';

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

    // Validation: Ensure plan has valid pricing for current currency
    const pricing = selectedPlan.pricing[currentSubscription.currency];
    if (!pricing || typeof pricing.monthly !== 'number') {
      toast.error(t('plan_change_wizard.invalid_pricing'), {
        description: t('plan_change_wizard.plan_not_available', { currency: currentSubscription.currency }),
      });
      handleBack();
      return;
    }

    const isDowngrade = selectedPlan.messageLimit < currentSubscription.messageLimit;

    try {
      setUpgrading(true);

      await subscriptionService.changePlan(
        selectedPlan.code,
        currentSubscription.currency,
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

  const getPrice = (plan: SubscriptionPlan) => {
    const currency = currentSubscription.currency;
    const pricing = plan.pricing[currency];
    if (!pricing) return 0;
    return pricing.monthly || 0;
  };

  const isDowngrade = selectedPlan
    ? selectedPlan.messageLimit < currentSubscription.messageLimit
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
                        {currentSubscription.currency} {getPrice(selectedPlan)}
                      </span>
                      <span className="text-sm text-gray-500">/mo</span>
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
                      ? (isDowngrade ? t('plan_change_wizard.downgrading') : t('plan_change_wizard.upgrading'))
                      : (isDowngrade ? t('plan_change_wizard.confirm_downgrade') : t('plan_change_wizard.confirm_upgrade'))
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BaseModal>
  );
}
