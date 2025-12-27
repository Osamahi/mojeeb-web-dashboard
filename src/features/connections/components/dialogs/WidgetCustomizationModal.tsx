/**
 * Widget Customization Modal
 * Allows users to customize their website chat widget
 * Simplified view with color, initial message, and message duration
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { widgetService } from '../../services/widgetService';
import { toast } from 'sonner';
import type { WidgetConfiguration, UpdateWidgetRequest } from '../../types/widget.types';

export interface WidgetCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
}

interface SimpleFormData {
  primaryColor: string;
  initialMessage: string;
}

export function WidgetCustomizationModal({
  isOpen,
  onClose,
  agentId,
}: WidgetCustomizationModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<SimpleFormData>({
    primaryColor: '#000000',
    initialMessage: '',
  });

  const queryClient = useQueryClient();

  // Fetch widget configuration
  const {
    data: widgetConfig,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['widget', agentId],
    queryFn: () => widgetService.getWidgetByAgentId(agentId),
    enabled: isOpen && !!agentId,
  });


  // Update widget mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateWidgetRequest) =>
      widgetService.updateWidget(widgetConfig!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget', agentId] });
      queryClient.invalidateQueries({ queryKey: ['widget-snippet', widgetConfig!.id] });
      toast.success(t('widget_customization.update_success'));
      onClose(); // Auto-close modal on success
    },
    onError: () => {
      toast.error(t('widget_customization.update_error'));
    },
  });

  // Initialize form with actual widget data when it loads
  useEffect(() => {
    if (widgetConfig) {
      setFormData({
        primaryColor: widgetConfig.primaryColor ?? '#000000',
        initialMessage: widgetConfig.initialMessage ?? '',
      });
    }
  }, [widgetConfig]);

  const handleInputChange = (field: keyof SimpleFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!widgetConfig) return;

    const updatePayload: UpdateWidgetRequest = {
      id: widgetConfig.id,
      primaryColor: formData.primaryColor,
      initialMessage: formData.initialMessage || null,
    };

    updateMutation.mutate(updatePayload);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={t('widget_customization.title')}
      isLoading={updateMutation.isPending}
      closable={!updateMutation.isPending}
    >
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="p-6 text-center">
          <p className="text-red-600">{t('widget_customization.load_error')}</p>
          <Button onClick={onClose} variant="secondary" className="mt-4">
            {t('common.close')}
          </Button>
        </div>
      )}

      {!isLoading && !error && widgetConfig && (
        <div className="flex flex-col">
          {/* Simple Form */}
          <div className="space-y-6">
            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                {t('widget_customization.primary_color_label')}
              </label>
              <div className="relative">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded border-0 cursor-pointer"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  placeholder="#000000"
                  className="pl-14"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {t('widget_customization.primary_color_help')}
              </p>
            </div>

            {/* Initial Message */}
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                {t('widget_customization.initial_message_label')}
              </label>
              <Textarea
                value={formData.initialMessage}
                onChange={(e) => handleInputChange('initialMessage', e.target.value)}
                placeholder={t('widget_customization.initial_message_placeholder')}
                rows={3}
              />
              <p className="text-xs text-neutral-500 mt-1">
                {t('widget_customization.initial_message_help')}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-200 p-6">
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? t('widget_customization.saving') : t('widget_customization.save_button')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
