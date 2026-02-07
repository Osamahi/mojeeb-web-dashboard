import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { useExportStatus } from '../hooks';
import { Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ExportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
}

export function ExportProgressModal({
  isOpen,
  onClose,
  jobId,
}: ExportProgressModalProps) {
  const { t } = useTranslation();
  const { data: status, isLoading } = useExportStatus(jobId, isOpen);

  const handleDownload = () => {
    if (status?.blob_url) {
      window.open(status.blob_url, '_blank');
    }
  };

  const isProcessing = status?.status === 'pending' || status?.status === 'processing';
  const isCompleted = status?.status === 'completed';
  const isFailed = status?.status === 'failed';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('leads.export_progress_title')}
      subtitle={
        isCompleted
          ? t('leads.export_ready_subtitle')
          : isFailed
          ? t('leads.export_failed_subtitle')
          : t('leads.export_processing_subtitle')
      }
      maxWidth="md"
      closable={!isProcessing}
    >
      <div className="space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-brand-mojeeb" />
          </div>
        )}

        {/* Progress Bar (Pending/Processing) */}
        {!isLoading && isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-700 font-medium">
                {status?.status === 'pending' ? t('leads.preparing_export') : t('leads.processing_leads')}
              </span>
              <span className="text-neutral-600">{status?.progress || 0}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2.5">
              <div
                className="bg-brand-mojeeb h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${status?.progress || 0}%` }}
              />
            </div>
            {status?.status === 'processing' && status?.row_count != null && (
              <p className="text-sm text-neutral-600">
                {t('leads.processing_leads_count', { count: status.row_count })}
              </p>
            )}
          </div>
        )}

        {/* Completed State */}
        {!isLoading && isCompleted && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <CheckCircle2 className="w-16 h-16 text-success" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-neutral-900 font-medium">{t('leads.export_completed_successfully')}</p>
              {status?.row_count != null && (
                <p className="text-sm text-neutral-600">
                  {t('leads.leads_exported', { count: status.row_count })}
                </p>
              )}
              {status?.file_name && (
                <p className="text-sm text-neutral-500 font-mono">{status.file_name}</p>
              )}
            </div>
            <div className="p-3 bg-support-mint border border-info/30 rounded-lg">
              <p className="text-sm text-neutral-800">
                {t('leads.download_link_expires')}
              </p>
            </div>
          </div>
        )}

        {/* Failed State */}
        {!isLoading && isFailed && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <XCircle className="w-16 h-16 text-error" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-neutral-900 font-medium">{t('leads.export_failed_title')}</p>
              {status?.error_message && (
                <p className="text-sm text-error">{status.error_message}</p>
              )}
            </div>
            <div className="p-3 bg-red-50 border border-error/30 rounded-lg">
              <p className="text-sm text-neutral-800">
                {t('leads.export_failed_retry')}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          {isCompleted && (
            <>
              <Button variant="secondary" size="sm" onClick={onClose}>
                {t('leads.close_button')}
              </Button>
              <Button variant="primary" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                {t('leads.download_button')}
              </Button>
            </>
          )}
          {isFailed && (
            <Button variant="danger" size="sm" onClick={onClose}>
              {t('leads.close_button')}
            </Button>
          )}
          {isProcessing && (
            <div className="text-sm text-neutral-500">
              {t('leads.do_not_close_window')}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
