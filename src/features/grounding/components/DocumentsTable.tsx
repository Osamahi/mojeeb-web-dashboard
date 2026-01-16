/**
 * Documents Table
 * Displays documents from a Vertex AI datastore
 */

import { useState } from 'react';
import { FileText, Link as LinkIcon, File, Download, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Document } from '../types/grounding.types';
import { groundingService } from '../services/groundingService';
import { queryKeys } from '@/lib/queryKeys';
import { BaseModal } from '@/components/ui/BaseModal';

interface DocumentsTableProps {
  documents: Document[];
  datastoreId: string;
}

const extractDocumentId = (name: string): string => {
  const parts = name.split('/');
  return parts[parts.length - 1];
};

const decodeBase64Preview = (base64: string): string => {
  try {
    // Decode base64 and get first 200 characters
    const decoded = atob(base64);
    return decoded.substring(0, 200) + (decoded.length > 200 ? '...' : '');
  } catch {
    return 'Unable to preview content';
  }
};

const extractFilename = (document: Document): string => {
  // First, try to extract filename from GCS URI
  if (document.content?.uri) {
    const uri = document.content.uri;
    const filename = uri.split('/').pop() || '';

    // For PDFs with format: {timestamp}_{original_filename}.pdf
    // Example: 1768459302092_Sina_Specialists_list_1.pdf
    if (filename.includes('_') && !filename.startsWith('doc-')) {
      const parts = filename.split('_');
      // Remove the timestamp (first part) and rejoin the rest
      if (parts.length > 1 && /^\d{13}$/.test(parts[0])) {
        return parts.slice(1).join('_');
      }
    }

    // For files like doc-1768458134263.txt, we'll fall through to metadata check
  }

  // Try to get filename from structData or derivedStructData
  if (document.structData && typeof document.structData === 'object') {
    const sd = document.structData as Record<string, any>;
    if (sd.filename || sd.name || sd.title) {
      return sd.filename || sd.name || sd.title;
    }
  }

  if (document.derivedStructData && typeof document.derivedStructData === 'object') {
    const dsd = document.derivedStructData as Record<string, any>;
    if (dsd.filename || dsd.name || dsd.title) {
      return dsd.filename || dsd.name || dsd.title;
    }
  }

  // Fallback to document ID
  return document.id || extractDocumentId(document.name);
};

const formatCreationDate = (document: Document): string => {
  // Try indexTime first
  if (document.indexTime) {
    try {
      const date = new Date(document.indexTime);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      // Fall through to timestamp parsing
    }
  }

  // Try to parse document ID as timestamp (e.g., "doc-1768458134263")
  const id = document.id || extractDocumentId(document.name);
  const timestampMatch = id.match(/(\d{13})/); // 13-digit Unix timestamp in milliseconds

  if (timestampMatch) {
    try {
      const timestamp = parseInt(timestampMatch[1], 10);
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  }

  return 'N/A';
};


export const DocumentsTable = ({ documents, datastoreId }: DocumentsTableProps) => {
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; document: Document | null }>({
    isOpen: false,
    document: null,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => groundingService.deleteDocument(datastoreId, documentId),
    onSuccess: () => {
      toast.success('Document deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.grounding.documents(datastoreId) });
      setDeleteModal({ isOpen: false, document: null });
    },
    onError: (error) => {
      toast.error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: ({ datastoreId, documentId }: { datastoreId: string; documentId: string }) =>
      groundingService.downloadDocument(datastoreId, documentId),
    onSuccess: () => {
      toast.success('Document downloaded successfully');
    },
    onError: (error) => {
      toast.error(`Failed to download document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const handleDelete = (document: Document) => {
    setDeleteModal({ isOpen: true, document });
  };

  const confirmDelete = () => {
    if (deleteModal.document) {
      const documentId = extractDocumentId(deleteModal.document.name);
      deleteMutation.mutate(documentId);
    }
  };

  const handleDownload = (document: Document) => {
    const documentId = extractDocumentId(document.name);
    downloadMutation.mutate({ datastoreId, documentId });
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
                Document
              </th>
              <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
                Filename
              </th>
              <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
                Created Date
              </th>
              <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
                Schema
              </th>
              <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
                Content Type
              </th>
              <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
                Location
              </th>
              <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700 w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => {
              const documentId = extractDocumentId(document.name);
              const hasUri = !!document.content?.uri;
              const hasRawBytes = !!document.content?.rawBytes;

              return (
                <tr
                  key={document.name}
                  className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                >
                <td className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-neutral-900 truncate">
                        {document.id || documentId}
                      </div>
                      <div className="text-xs text-neutral-500 font-mono mt-0.5 truncate">
                        {documentId}
                      </div>
                      {hasRawBytes && document.content?.rawBytes && (
                        <div className="text-xs text-neutral-600 mt-2 bg-neutral-50 p-2 rounded border border-neutral-200 max-w-2xl">
                          <span className="font-mono text-xs">
                            {decodeBase64Preview(document.content.rawBytes)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-neutral-900 max-w-xs truncate" title={extractFilename(document)}>
                    {extractFilename(document)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-neutral-600">
                    {formatCreationDate(document)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {document.schemaId || 'default'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-900">
                      {document.content?.mimeType || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {hasUri && document.content?.uri ? (
                    <a
                      href={document.content.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span className="truncate max-w-xs">View in GCS</span>
                    </a>
                  ) : hasRawBytes ? (
                    <span className="flex items-center gap-2 text-sm text-neutral-600">
                      <FileText className="w-4 h-4" />
                      <span>Raw Bytes</span>
                    </span>
                  ) : (
                    <span className="text-sm text-neutral-400">No content</span>
                  )}
                </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(document);
                        }}
                        disabled={downloadMutation.isPending}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(document);
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>

      {/* Delete Confirmation Modal */}
      <BaseModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, document: null })}
        title="Delete Document"
        subtitle="This action cannot be undone"
        maxWidth="md"
        isLoading={deleteMutation.isPending}
        closable={!deleteMutation.isPending}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-700">
            Are you sure you want to delete this document?
          </p>
          {deleteModal.document && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
              <p className="text-sm font-medium text-neutral-900">
                {deleteModal.document.id || extractDocumentId(deleteModal.document.name)}
              </p>
              <p className="text-xs text-neutral-500 mt-1 font-mono">
                {extractDocumentId(deleteModal.document.name)}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setDeleteModal({ isOpen: false, document: null })}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {deleteMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Document
                </>
              )}
            </button>
          </div>
        </div>
      </BaseModal>
    </>
  );
};
