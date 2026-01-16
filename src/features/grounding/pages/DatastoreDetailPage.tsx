/**
 * Datastore Detail Page
 * Shows documents within a specific Vertex AI datastore
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw, FileText, ExternalLink } from 'lucide-react';
import { queryKeys } from '@/lib/queryKeys';
import { groundingService } from '../services/groundingService';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { DocumentsTable } from '../components/DocumentsTable';
import { DocumentsTableSkeleton } from '../components/DocumentsTableSkeleton';

export default function DatastoreDetailPage() {
  const { datastoreId } = useParams<{ datastoreId: string }>();
  const navigate = useNavigate();
  useDocumentTitle(`Datastore: ${datastoreId || 'Loading...'}`);

  const {
    data: documents,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.grounding.documents(datastoreId),
    queryFn: () => groundingService.getDocuments(datastoreId!),
    enabled: !!datastoreId,
    staleTime: 30 * 1000, // 30 seconds
  });

  const handleBack = () => {
    navigate('/grounding');
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Datastores</span>
        </button>
      </div>

      <BaseHeader
        title={`Documents in ${datastoreId}`}
        subtitle="View all documents stored in this Vertex AI datastore"
        primaryAction={{
          label: isFetching ? 'Refreshing...' : 'Refresh',
          icon: RefreshCw,
          onClick: handleRefresh,
        }}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <DocumentsTableSkeleton />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-1">
                Failed to load documents
              </h3>
              <p className="text-sm text-red-700">
                {error instanceof Error ? error.message : 'An unknown error occurred'}
              </p>
              <button
                onClick={handleRefresh}
                className="mt-3 text-sm font-medium text-red-700 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && documents && documents.length === 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No documents found
            </h3>
            <p className="text-sm text-neutral-600 max-w-md mx-auto">
              This datastore doesn't contain any documents yet. Documents will appear here once they are uploaded to this datastore.
            </p>
          </div>
        </div>
      )}

      {/* Documents Table */}
      {!isLoading && !error && documents && documents.length > 0 && datastoreId && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <DocumentsTable documents={documents} datastoreId={datastoreId} />
        </div>
      )}
    </div>
  );
}
