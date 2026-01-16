/**
 * Grounding Service
 * Handles API calls to fetch Vertex AI datastores
 */

import api from '@/lib/api';
import type {
  ApiDatastoreListResponse,
  Datastore,
  DatastoreListResponse,
  ApiDocumentListResponse,
  Document
} from '../types/grounding.types';
import { logger } from '@/lib/logger';

/**
 * Transforms API response (snake_case) to frontend format (camelCase)
 * Backend uses Newtonsoft.Json with SnakeCaseNamingStrategy
 */
const transformDatastore = (apiDatastore: ApiDatastoreListResponse['data_stores'][0]): Datastore => {
  return {
    name: apiDatastore.name,
    displayName: apiDatastore.display_name,
    industryVertical: apiDatastore.industry_vertical,
    createTime: apiDatastore.create_time,
    solutionTypes: apiDatastore.solution_types || [],
    contentConfig: apiDatastore.content_config,
    defaultSchemaId: apiDatastore.default_schema_id,
    billingEstimation: apiDatastore.billing_estimation ? {
      structuredDataSize: apiDatastore.billing_estimation.structured_data_size,
      unstructuredDataSize: apiDatastore.billing_estimation.unstructured_data_size,
      structuredDataUpdateTime: apiDatastore.billing_estimation.structured_data_update_time,
      unstructuredDataUpdateTime: apiDatastore.billing_estimation.unstructured_data_update_time,
    } : undefined,
    documentProcessingConfig: {
      name: apiDatastore.document_processing_config.name,
      defaultParsingConfig: {
        digitalParsingConfig: apiDatastore.document_processing_config.default_parsing_config.digital_parsing_config,
      },
      chunkingConfig: apiDatastore.document_processing_config.chunking_config ? {
        layoutBasedChunkingConfig: {
          chunkSize: apiDatastore.document_processing_config.chunking_config.layout_based_chunking_config.chunk_size,
          includeAncestorHeadings: apiDatastore.document_processing_config.chunking_config.layout_based_chunking_config.include_ancestor_headings,
        },
      } : undefined,
    },
  };
};

/**
 * Transforms document API response (snake_case) to frontend format (camelCase)
 */
const transformDocument = (apiDocument: ApiDocumentListResponse['documents'][0]): Document => {
  return {
    name: apiDocument.name,
    id: apiDocument.id,
    schemaId: apiDocument.schema_id,
    content: apiDocument.content ? {
      mimeType: apiDocument.content.mime_type,
      uri: apiDocument.content.uri,
      rawBytes: apiDocument.content.raw_bytes,
    } : undefined,
    parentDocumentId: apiDocument.parent_document_id,
    derivedStructData: apiDocument.derived_struct_data,
    structData: apiDocument.struct_data,
    indexTime: apiDocument.index_time,
  };
};

export const groundingService = {
  /**
   * Fetch all Vertex AI datastores
   */
  async getDatastores(): Promise<Datastore[]> {
    try {
      logger.debug('[GroundingService] Fetching datastores');

      const response = await api.get<ApiDatastoreListResponse>('/api/grounding/datastores');

      logger.debug('[GroundingService] Datastores fetched successfully', {
        count: response.data.data_stores?.length || 0
      });

      // Transform each datastore from API format (snake_case) to frontend format (camelCase)
      return (response.data.data_stores || []).map(transformDatastore);
    } catch (error) {
      logger.error('[GroundingService] Error fetching datastores', error);
      throw error;
    }
  },

  /**
   * Fetch documents for a specific datastore
   */
  async getDocuments(datastoreId: string): Promise<Document[]> {
    try {
      logger.debug('[GroundingService] Fetching documents for datastore', { datastoreId });

      const response = await api.get<ApiDocumentListResponse>(
        `/api/grounding/datastores/${datastoreId}/documents`
      );

      logger.debug('[GroundingService] Documents fetched successfully', {
        count: response.data.documents?.length || 0
      });

      // Transform each document from API format (snake_case) to frontend format (camelCase)
      return (response.data.documents || []).map(transformDocument);
    } catch (error) {
      logger.error('[GroundingService] Error fetching documents', { datastoreId, error });
      throw error;
    }
  },

  /**
   * Delete a document from a datastore
   */
  async deleteDocument(datastoreId: string, documentId: string): Promise<void> {
    try {
      logger.debug('[GroundingService] Deleting document', { datastoreId, documentId });

      await api.delete(`/api/grounding/datastores/${datastoreId}/documents/${documentId}`);

      logger.debug('[GroundingService] Document deleted successfully', { documentId });
    } catch (error) {
      logger.error('[GroundingService] Error deleting document', { datastoreId, documentId, error });
      throw error;
    }
  },

  /**
   * Download a document's content
   */
  async downloadDocument(datastoreId: string, documentId: string): Promise<void> {
    try {
      logger.debug('[GroundingService] Downloading document', { datastoreId, documentId });

      // Use direct URL for download endpoint
      const url = `/api/grounding/datastores/${datastoreId}/documents/${documentId}/download`;

      // Trigger browser download
      const response = await api.get(url, {
        responseType: 'blob',
      });

      // Create blob and download
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${documentId}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      logger.debug('[GroundingService] Document downloaded successfully', { documentId });
    } catch (error) {
      logger.error('[GroundingService] Error downloading document', { datastoreId, documentId, error });
      throw error;
    }
  },
};
