/**
 * Widget Customization Modal
 * Allows users to customize their website chat widget
 * Simplified view with color, initial message, and message duration
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
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
      toast.success('Widget updated successfully!');
      onClose(); // Auto-close modal on success
    },
    onError: () => {
      toast.error('Failed to update widget. Please try again.');
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
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Customize Widget">
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="p-6 text-center">
          <p className="text-red-600">Failed to load widget configuration</p>
          <Button onClick={onClose} variant="secondary" className="mt-4">
            Close
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
                Primary Color
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
                This color will be used for the chat button and UI accents
              </p>
            </div>

            {/* Initial Message */}
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Initial Message
              </label>
              <Textarea
                value={formData.initialMessage}
                onChange={(e) => handleInputChange('initialMessage', e.target.value)}
                placeholder="Hi! Need any help?"
                rows={3}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Proactive message shown in notification bubble (optional)
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
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
