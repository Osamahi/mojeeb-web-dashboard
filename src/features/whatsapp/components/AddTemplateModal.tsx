/**
 * Add Template Modal
 * Modal for creating a new WhatsApp message template
 * Pre-filled with sample template text
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { whatsappService } from '../services/whatsappService';

interface AddTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionId: string;
}

const SAMPLE_TEMPLATE = {
  name: 'my_custom_template',
  language: 'en_US',
  category: 'UTILITY' as const,
  body: 'Hello! Thank you for contacting us. How can we help you today?',
};

export function AddTemplateModal({ isOpen, onClose, connectionId }: AddTemplateModalProps) {
  const [templateName, setTemplateName] = useState(SAMPLE_TEMPLATE.name);
  const [language, setLanguage] = useState(SAMPLE_TEMPLATE.language);
  const [category, setCategory] = useState(SAMPLE_TEMPLATE.category);
  const [body, setBody] = useState(SAMPLE_TEMPLATE.body);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () => whatsappService.createTemplate(connectionId, {
      name: templateName,
      language,
      category,
      body,
    }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Template "${templateName}" created successfully! Status: ${data.status || 'PENDING'}`);
        queryClient.invalidateQueries({ queryKey: ['whatsapp', 'templates', connectionId] });
        onClose();
      } else {
        toast.error(data.error || 'Failed to create template');
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to create template');
    },
  });

  const handleSubmit = () => {
    if (!templateName || !language || !category || !body) {
      toast.error('All fields are required');
      return;
    }
    createMutation.mutate();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create WhatsApp Template"
      subtitle="Create a new message template"
      maxWidth="2xl"
      isLoading={createMutation.isPending}
      closable={!createMutation.isPending}
    >
      <div className="space-y-6">
        {/* Sample Template Preview */}
        <div className="space-y-4">

          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="my_custom_template"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Use lowercase letters, numbers, and underscores only
            </p>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en_US">English (US)</option>
              <option value="en_GB">English (UK)</option>
              <option value="ar">Arabic</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'UTILITY' | 'MARKETING' | 'AUTHENTICATION')}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="UTILITY">Utility (Recommended)</option>
              <option value="MARKETING">Marketing</option>
              <option value="AUTHENTICATION">Authentication</option>
            </select>
            <p className="mt-1 text-xs text-neutral-500">
              UTILITY templates have the fastest approval time
            </p>
          </div>

          {/* Body Text */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Message Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter your template message..."
            />
            <p className="mt-1 text-xs text-neutral-500">
              Avoid adding variables or footers for faster approval
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Submit'}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
