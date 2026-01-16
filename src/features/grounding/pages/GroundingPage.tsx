/**
 * Grounding Page
 * SuperAdmin-only page for viewing Vertex AI datastores
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Database, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { groundingService } from '../services/groundingService';
import { DatastoresTable } from '../components/DatastoresTable';
import { DatastoresTableSkeleton } from '../components/DatastoresTableSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { queryKeys } from '@/lib/queryKeys';

export default function GroundingPage() {
  const { t } = useTranslation();
  useDocumentTitle('Grounding');

  const {
    data: datastores,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.grounding.datastores(),
    queryFn: () => groundingService.getDatastores(),
    staleTime: 30 * 1000, // 30 seconds
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <BaseHeader
        title="Vertex AI Datastores"
        subtitle="View and manage Vertex AI Search datastores for grounding"
        primaryAction={{
          label: isFetching ? 'Refreshing...' : 'Refresh',
          icon: RefreshCw,
          onClick: handleRefresh,
        }}
      />

      {/* Datastores Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isLoading ? (
          <DatastoresTableSkeleton />
        ) : error ? (
          <EmptyState
            icon={<Database className="w-12 h-12 text-neutral-400" />}
            title="Error loading datastores"
            description={
              error instanceof Error
                ? error.message
                : 'Failed to fetch Vertex AI datastores'
            }
          />
        ) : datastores && datastores.length > 0 ? (
          <div className="bg-white border border-neutral-200 rounded-lg p-4 md:p-6">
            <DatastoresTable datastores={datastores} />
          </div>
        ) : (
          <EmptyState
            icon={<Database className="w-12 h-12 text-neutral-400" />}
            title="No datastores found"
            description="No Vertex AI Search datastores are available in this project"
          />
        )}
      </motion.div>
    </div>
  );
}
