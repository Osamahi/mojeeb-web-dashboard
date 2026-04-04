import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BaseModal } from '@/components/ui/BaseModal';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useTranslation } from 'react-i18next';
import { useCreateBroadcast } from '../hooks/useBroadcasts';
import { CsvUploadStep } from './CsvUploadStep';
import { TemplateSelectStep } from './TemplateSelectStep';
import { ReviewStep } from './ReviewStep';
import type { MessageTemplate } from '@/features/whatsapp/types/whatsapp.types';
import type { CsvValidationResult } from '../types/broadcast.types';
import { toast } from 'sonner';

type WizardStep = 'upload' | 'template' | 'review';

const STEP_KEYS: Record<WizardStep, string> = {
  upload: 'broadcasts.wizard_step_upload',
  template: 'broadcasts.wizard_step_template',
  review: 'broadcasts.wizard_step_review',
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 200 : -200,
    opacity: 0,
  }),
};

interface CreateBroadcastWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBroadcastWizard({ isOpen, onClose }: CreateBroadcastWizardProps) {
  const { agentId } = useAgentContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const createMutation = useCreateBroadcast();

  const [step, setStep] = useState<WizardStep>('upload');
  const [direction, setDirection] = useState(0);
  const [campaignName, setCampaignName] = useState('');
  const [validationResult, setValidationResult] = useState<CsvValidationResult | null>(null);
  const [connectionId, setConnectionId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  const handleNext = useCallback(() => {
    setDirection(1);
    if (step === 'upload') setStep('template');
    else if (step === 'template') setStep('review');
  }, [step]);

  const handleBack = useCallback(() => {
    setDirection(-1);
    if (step === 'template') setStep('upload');
    else if (step === 'review') setStep('template');
  }, [step]);

  const handleParamChange = useCallback((key: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canProceed = useMemo(() => {
    if (step === 'upload') {
      return campaignName.trim().length > 0 && (validationResult?.valid.length ?? 0) > 0;
    }
    if (step === 'template') {
      return !!connectionId && !!selectedTemplate;
    }
    return true;
  }, [step, campaignName, validationResult, connectionId, selectedTemplate]);

  const handleSend = useCallback(async () => {
    if (!agentId || !selectedTemplate || !validationResult) return;

    const bodyComponent = selectedTemplate.components?.find((c) => c.type === 'BODY');
    const params = Object.keys(paramValues).length > 0 ? paramValues : undefined;

    createMutation.mutate(
      {
        agentId,
        request: {
          campaign_name: campaignName.trim(),
          connection_id: connectionId,
          template_name: selectedTemplate.name,
          language_code: selectedTemplate.language,
          parameters: params,
          template_body: bodyComponent?.text,
          recipients: validationResult.valid,
        },
      },
      {
        onSuccess: (campaign) => {
          toast.success(t('broadcasts.send_success', { count: validationResult.valid.length }));
          resetState();
          onClose();
          navigate(`/broadcasts/${campaign.id}`);
        },
        onError: (error: Error) => {
          toast.error(error.message || t('broadcasts.send_error'));
        },
      }
    );
  }, [agentId, selectedTemplate, validationResult, paramValues, campaignName, connectionId, createMutation, onClose, navigate, t]);

  const resetState = useCallback(() => {
    setStep('upload');
    setDirection(0);
    setCampaignName('');
    setValidationResult(null);
    setConnectionId('');
    setSelectedTemplate(null);
    setParamValues({});
  }, []);

  const handleClose = useCallback(() => {
    if (!createMutation.isPending) {
      resetState();
      onClose();
    }
  }, [createMutation.isPending, resetState, onClose]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('broadcasts.wizard_title')}
      subtitle={t(STEP_KEYS[step])}
      maxWidth="lg"
      isLoading={createMutation.isPending}
      closable={!createMutation.isPending}
    >
      <div className="min-h-[350px]">
        <div className="flex items-center gap-2 mb-6">
          {(['upload', 'template', 'review'] as WizardStep[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  s === step
                    ? 'bg-neutral-900 text-white'
                    : i < ['upload', 'template', 'review'].indexOf(step)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="w-8 h-px bg-neutral-200" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {step === 'upload' && (
              <CsvUploadStep
                campaignName={campaignName}
                onCampaignNameChange={setCampaignName}
                onValidated={setValidationResult}
                validationResult={validationResult}
              />
            )}
            {step === 'template' && (
              <TemplateSelectStep
                connectionId={connectionId}
                onConnectionChange={setConnectionId}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={setSelectedTemplate}
                paramValues={paramValues}
                onParamChange={handleParamChange}
              />
            )}
            {step === 'review' && selectedTemplate && validationResult && (
              <ReviewStep
                campaignName={campaignName}
                template={selectedTemplate}
                recipientCount={validationResult.valid.length}
                validationResult={validationResult}
                paramValues={paramValues}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-4">
        <button
          onClick={step === 'upload' ? handleClose : handleBack}
          disabled={createMutation.isPending}
          className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors disabled:opacity-50"
        >
          {step === 'upload' ? t('broadcasts.cancel') : t('broadcasts.back')}
        </button>

        {step === 'review' ? (
          <button
            onClick={handleSend}
            disabled={!canProceed || createMutation.isPending}
            className="px-4 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? t('broadcasts.sending') : t('broadcasts.send_now')}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="px-4 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {t('broadcasts.next')}
          </button>
        )}
      </div>
    </BaseModal>
  );
}
