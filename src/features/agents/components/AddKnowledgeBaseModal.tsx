/**
 * Mojeeb Add Knowledge Base Modal Component
 * Create knowledge via manual entry or document upload
 * Features: Tab-based UI, async document processing, form validation
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { FileText, Upload } from 'lucide-react';
import { agentService } from '../services/agentService';
import { useUploadDocumentAsync } from '../hooks/useDocumentJobs';
import { validateDocumentFile } from '../utils/fileValidation';
import { BaseModal } from '@/components/ui/BaseModal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/logger';

type Tab = 'manual' | 'document';

interface AddKnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  onSuccess: () => void;
  onUploadStart?: (jobId: string) => void;
}

/**
 * Get tab button styling based on active state
 */
const getTabClassName = (isActive: boolean) => {
  const baseClasses = 'px-4 py-2 text-sm font-medium border-b-2 transition-colors';
  const activeClasses = 'border-black text-black';
  const inactiveClasses = 'border-transparent text-neutral-500 hover:text-neutral-700';
  return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
};

export default function AddKnowledgeBaseModal({
  isOpen,
  onClose,
  agentId,
  onSuccess,
  onUploadStart,
}: AddKnowledgeBaseModalProps) {
  const { t } = useTranslation();

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('manual');

  // Manual entry state
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<{ name?: string; content?: string }>({});

  // Document upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Hooks
  const uploadMutation = useUploadDocumentAsync();

  // Create + link mutation (manual entry)
  const createMutation = useMutation({
    mutationFn: async () => {
      // Validate
      const validationErrors: { name?: string; content?: string } = {};
      if (!name.trim()) {
        validationErrors.name = t('knowledge_base.title_required');
      }
      if (!content.trim()) {
        validationErrors.content = t('knowledge_base.content_required');
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error('Validation failed');
      }

      // Create KB
      const kb = await agentService.createKnowledgeBase({
        name: name.trim(),
        content: content.trim(),
      });

      // Link to agent
      await agentService.linkKnowledgeBase(agentId, kb.id);

      return kb;
    },
    onSuccess: () => {
      toast.success(t('knowledge_base.success_created'));
      handleReset();
      onClose();
      onSuccess();
    },
    onError: (error: Error) => {
      logger.error('Error creating KB', error);
      if (error.message !== 'Validation failed') {
        toast.error(t('knowledge_base.error_create'));
      }
    },
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    createMutation.mutate();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file using shared utility
    const validation = validateDocumentFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      e.target.value = ''; // Reset input
      return;
    }

    setSelectedFile(file);
  };

  const handleDocumentUpload = async () => {
    if (!selectedFile) return;

    try {
      const jobResponse = await uploadMutation.mutateAsync(selectedFile);

      toast.success(t('knowledge_base.upload_started'));

      // Notify parent for optimistic UI update
      if (onUploadStart) {
        onUploadStart(jobResponse.jobId);
      }

      // Close modal and reset form
      handleReset();
      onClose();
    } catch (error) {
      logger.error('Error uploading document', error);
    }
  };

  const handleReset = () => {
    setName('');
    setContent('');
    setErrors({});
    setSelectedFile(null);
    setActiveTab('manual');
  };

  const handleClose = () => {
    if (!createMutation.isPending && !uploadMutation.isPending) {
      handleReset();
      onClose();
    }
  };

  const isLoading = createMutation.isPending || uploadMutation.isPending;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('knowledge_base.add_title')}
      subtitle={t('knowledge_base.add_subtitle')}
      maxWidth="lg"
      isLoading={isLoading}
      closable={!isLoading}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={getTabClassName(activeTab === 'manual')}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t('knowledge_base.tab_manual')}
          </div>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('document')}
          className={getTabClassName(activeTab === 'document')}
        >
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {t('knowledge_base.tab_document')}
          </div>
        </button>
      </div>

      {/* Manual Entry Tab */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <Input
            label={t('knowledge_base.title_label')}
            placeholder={t('knowledge_base.title_placeholder')}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            error={errors.name}
            disabled={createMutation.isPending}
            required
          />

          <Textarea
            label={t('knowledge_base.content_label')}
            placeholder={t('knowledge_base.content_placeholder')}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (errors.content) setErrors({ ...errors, content: undefined });
            }}
            error={errors.content}
            autoResize
            minHeight={150}
            maxHeight={400}
            disabled={createMutation.isPending}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? t('knowledge_base.creating') : t('knowledge_base.add_button')}
            </Button>
          </div>
        </form>
      )}

      {/* Document Upload Tab */}
      {activeTab === 'document' && (
        <div className="space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              {t('knowledge_base.select_document')}
            </label>
            <input
              type="file"
              accept=".txt,.pdf,.docx,.csv,.xlsx,.xls"
              onChange={handleFileSelect}
              disabled={uploadMutation.isPending}
              className="block w-full text-sm text-neutral-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border file:border-neutral-300
                file:text-sm file:font-medium
                file:bg-white file:text-neutral-700
                hover:file:bg-neutral-50
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-neutral-600">
                {t('knowledge_base.file_selected', {
                  name: selectedFile.name,
                  size: (selectedFile.size / 1024).toFixed(2)
                })}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={uploadMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleDocumentUpload}
              disabled={!selectedFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? t('knowledge_base.uploading') : t('knowledge_base.upload_button')}
            </Button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
