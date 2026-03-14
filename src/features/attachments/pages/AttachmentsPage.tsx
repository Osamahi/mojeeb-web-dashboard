/**
 * Main Attachments management page (SuperAdmin only)
 * Lists ALL attachments across all agents with infinite scroll
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { useInfiniteAttachments } from '../hooks/useAttachments';
import { useDeleteAttachment } from '../hooks/useMutateAttachment';
import { AttachmentsTable } from '../components/AttachmentsTable';
import { AttachmentsTableSkeleton } from '../components/AttachmentsTableSkeleton';
import type { Attachment, AttachmentFilters } from '../types/attachment.types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CreateAttachmentModal } from '../components/CreateAttachmentModal';
import { EditAttachmentModal } from '../components/EditAttachmentModal';
import { UploadMediaModal } from '../components/UploadMediaModal';
import { useAgentStore } from '@/features/agents/stores/agentStore';

export function AttachmentsPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<AttachmentFilters>({});
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Build agent name map from store
  const agents = useAgentStore((state) => state.agents);
  const agentNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const agent of agents) {
      map[agent.id] = agent.name;
    }
    return map;
  }, [agents]);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Combine search with other filters
  const combinedFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch.trim() || undefined,
    }),
    [filters, debouncedSearch]
  );

  // Data fetching
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteAttachments(combinedFilters);

  // Mutations
  const deleteMutation = useDeleteAttachment();

  // Handlers
  const handleCreateClick = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleEdit = useCallback((attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback((attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setShowDeleteConfirm(true);
  }, []);

  const handleUpload = useCallback((attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setShowUploadModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedAttachment) return;

    try {
      await deleteMutation.mutateAsync({
        attachmentId: selectedAttachment.id,
        agentId: selectedAttachment.agentId,
      });
      setShowDeleteConfirm(false);
      setSelectedAttachment(null);
    } catch {
      // Error already handled by mutation onError (toast)
    }
  }, [selectedAttachment, deleteMutation]);

  const handleCloseDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedAttachment(null);
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    setShowUploadModal(false);
    setSelectedAttachment(null);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <BaseHeader
        title={t('attachments.title', 'Attachments')}
        subtitle={t('attachments.subtitle', 'Manage AI agent attachments across all agents')}
        primaryAction={{
          label: t('attachments.create', 'Create Attachment'),
          icon: Plus,
          onClick: handleCreateClick,
        }}
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder={t('attachments.search_placeholder', 'Search attachments by name or description...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('attachments.search_label', 'Search attachments')}
          className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-mojeeb/20 focus:border-brand-mojeeb"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <AttachmentsTableSkeleton />
      ) : (
        <AttachmentsTable
          attachments={data?.attachments || []}
          agentNameMap={agentNameMap}
          hasMore={hasNextPage || false}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpload={handleUpload}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={handleCloseDeleteConfirm}
        onConfirm={confirmDelete}
        title={t('attachments.delete_title', 'Delete Attachment')}
        message={t('attachments.delete_message', `Are you sure you want to delete "${selectedAttachment?.name}"? This action cannot be undone.`)}
        confirmText={t('common.delete', 'Delete')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Create Attachment Modal */}
      <CreateAttachmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit Attachment Modal */}
      <EditAttachmentModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        attachment={selectedAttachment}
      />

      {/* Upload Media Modal */}
      <UploadMediaModal
        isOpen={showUploadModal}
        onClose={handleCloseUploadModal}
        attachment={selectedAttachment}
      />
    </div>
  );
}
