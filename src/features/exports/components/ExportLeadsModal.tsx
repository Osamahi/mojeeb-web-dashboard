import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { useCreateExportMutation } from '../hooks';
import { toast } from 'sonner';
import type { CreateExportRequest } from '../types/export.types';

interface ExportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  filters?: {
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  };
  onExportCreated: (jobId: string) => void;
}

export function ExportLeadsModal({
  isOpen,
  onClose,
  agentId,
  filters = {},
  onExportCreated,
}: ExportLeadsModalProps) {
  const { t } = useTranslation();
  const [format, setFormat] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
  const createExport = useCreateExportMutation();

  const handleExport = async () => {
    try {
      const request: CreateExportRequest = {
        agent_id: agentId,
        format,
        ...filters,
      };

      const response = await createExport.mutateAsync(request);

      toast.success('Export started successfully');
      onExportCreated(response.job_id);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create export');
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('leads.export_leads_title')}
      subtitle={t('leads.export_leads_subtitle')}
      maxWidth="md"
      isLoading={createExport.isPending}
      closable={!createExport.isPending}
    >
      <div className="space-y-6">
        {/* Format Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-neutral-700">{t('leads.export_format_label')}</label>
          <div className="space-y-2">
            {/* Excel Option */}
            <label className="flex items-start p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
              <input
                type="radio"
                value="xlsx"
                checked={format === 'xlsx'}
                onChange={(e) => setFormat(e.target.value as 'xlsx')}
                className="mt-0.5 ltr:mr-3 rtl:ml-3"
                disabled={createExport.isPending}
              />
              <div>
                <div className="font-medium text-neutral-900">{t('leads.format_excel_title')}</div>
                <div className="text-sm text-neutral-600">
                  {t('leads.format_excel_description')}
                </div>
              </div>
            </label>

            {/* CSV Option */}
            <label className="flex items-start p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
              <input
                type="radio"
                value="csv"
                checked={format === 'csv'}
                onChange={(e) => setFormat(e.target.value as 'csv')}
                className="mt-0.5 ltr:mr-3 rtl:ml-3"
                disabled={createExport.isPending}
              />
              <div>
                <div className="font-medium text-neutral-900">{t('leads.format_csv_title')}</div>
                <div className="text-sm text-neutral-600">
                  {t('leads.format_csv_description')}
                </div>
              </div>
            </label>

            {/* JSON Option */}
            <label className="flex items-start p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
              <input
                type="radio"
                value="json"
                checked={format === 'json'}
                onChange={(e) => setFormat(e.target.value as 'json')}
                className="mt-0.5 ltr:mr-3 rtl:ml-3"
                disabled={createExport.isPending}
              />
              <div>
                <div className="font-medium text-neutral-900">{t('leads.format_json_title')}</div>
                <div className="text-sm text-neutral-600">
                  {t('leads.format_json_description')}
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Current Filters Info */}
        {(filters.status || filters.search || filters.date_from) && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-1">Current Filters Applied</div>
            <div className="text-sm text-blue-700 space-y-1">
              {filters.status && <div>• Status: {filters.status}</div>}
              {filters.search && <div>• Search: {filters.search}</div>}
              {filters.date_from && <div>• Date range applied</div>}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={createExport.isPending}
          >
            {t('leads.cancel_button')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            isLoading={createExport.isPending}
          >
            {t('leads.start_export_button')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
