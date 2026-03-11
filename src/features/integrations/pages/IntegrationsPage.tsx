import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Unplug } from 'lucide-react';
import { BaseHeader } from '@/components/ui/BaseHeader';
import {
  useIntegrationConnections,
  useDeleteConnection,
} from '../hooks/useIntegrations';
import IntegrationConnectionCard from '../components/IntegrationConnectionCard';
import CreateConnectionModal from '../components/CreateConnectionModal';

export default function IntegrationsPage() {
  const { t } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: connections, isLoading, error } = useIntegrationConnections();
  const deleteMutation = useDeleteConnection();

  const handleCreateClick = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const handleDelete = useCallback(
    (connectionId: string) => {
      if (window.confirm(t('integrations.delete_confirm_message'))) {
        deleteMutation.mutate(connectionId);
      }
    },
    [deleteMutation, t]
  );

  return (
    <div className="p-6 space-y-8">
      <BaseHeader
        title={t('integrations.title')}
        subtitle={t('integrations.subtitle')}
        primaryAction={{
          label: t('integrations.add_connection'),
          icon: Plus,
          onClick: handleCreateClick,
        }}
      />

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-neutral-200 bg-neutral-50"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {t('integrations.load_error')}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && connections?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 py-16">
          <Unplug className="h-12 w-12 text-neutral-300" />
          <h3 className="mt-4 text-lg font-medium text-neutral-700">
            {t('integrations.no_connections_title')}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            {t('integrations.no_connections_description')}
          </p>
          <button
            onClick={handleCreateClick}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            {t('integrations.add_connection')}
          </button>
        </div>
      )}

      {/* Connections grid */}
      {!isLoading && !error && connections && connections.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => (
            <IntegrationConnectionCard
              key={connection.id}
              connection={connection}
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === connection.id}
            />
          ))}
        </div>
      )}

      <CreateConnectionModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />
    </div>
  );
}
