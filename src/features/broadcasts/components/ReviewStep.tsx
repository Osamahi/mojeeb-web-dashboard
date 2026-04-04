import { AlertTriangle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MessageTemplate } from '@/features/whatsapp/types/whatsapp.types';
import type { CsvValidationResult } from '../types/broadcast.types';

interface ReviewStepProps {
  campaignName: string;
  template: MessageTemplate;
  recipientCount: number;
  validationResult: CsvValidationResult;
  paramValues: Record<string, string>;
}

export function ReviewStep({
  campaignName,
  template,
  recipientCount,
  validationResult,
  paramValues,
}: ReviewStepProps) {
  const { t } = useTranslation();
  const usNumbers = validationResult.valid.filter((r) => r.phone.startsWith('+1')).length;
  const isMarketing = template.category === 'MARKETING';

  return (
    <div className="space-y-4">
      <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">{t('broadcasts.review_campaign')}</span>
          <span className="font-medium text-neutral-900">{campaignName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">{t('broadcasts.review_template')}</span>
          <span className="font-medium text-neutral-900">{template.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">{t('broadcasts.review_category')}</span>
          <span className="font-medium text-neutral-900">{template.category}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">{t('broadcasts.review_language')}</span>
          <span className="font-medium text-neutral-900">{template.language}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">{t('broadcasts.review_recipients')}</span>
          <span className="font-medium text-neutral-900">{recipientCount}</span>
        </div>
        {Object.entries(paramValues).length > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">{t('broadcasts.review_variables')}</span>
            <span className="font-medium text-neutral-900">
              {Object.entries(paramValues)
                .map(([k, v]) => `{{${k}}} = "${v}"`)
                .join(', ')}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {isMarketing && usNumbers > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700">
              <strong>{t('broadcasts.review_us_warning', { count: usNumbers })}</strong>
            </p>
          </div>
        )}

        {isMarketing && (
          <div className="bg-brand-mojeeb/5 border border-brand-mojeeb/20 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-mojeeb mt-0.5 shrink-0" />
            <p className="text-xs text-brand-mojeeb">
              {t('broadcasts.review_pacing_notice')}
            </p>
          </div>
        )}

        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
          <p className="text-xs text-neutral-500">
            {t('broadcasts.review_frequency_notice')}
          </p>
        </div>
      </div>
    </div>
  );
}
