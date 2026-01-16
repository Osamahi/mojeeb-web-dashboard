/**
 * Grounding Types
 * TypeScript interfaces for Vertex AI datastores
 */

// Frontend types (camelCase)
export interface Datastore {
  name: string;
  displayName: string;
  industryVertical: string;
  createTime: string;
  solutionTypes: string[];
  contentConfig: string;
  defaultSchemaId: string;
  billingEstimation?: {
    structuredDataSize?: string;
    unstructuredDataSize?: string;
    structuredDataUpdateTime?: string;
    unstructuredDataUpdateTime?: string;
  };
  documentProcessingConfig: {
    name: string;
    defaultParsingConfig: {
      digitalParsingConfig: Record<string, unknown>;
    };
    chunkingConfig?: {
      layoutBasedChunkingConfig: {
        chunkSize: number;
        includeAncestorHeadings: boolean;
      };
    };
  };
}

export interface DatastoreListResponse {
  dataStores: Datastore[];
}

// API Response types (snake_case from backend - Newtonsoft.Json with SnakeCaseNamingStrategy)
export interface ApiDatastoreResponse {
  name: string;
  display_name: string;
  industry_vertical: string;
  create_time: string;
  solution_types: string[];
  content_config: string;
  default_schema_id: string;
  billing_estimation?: {
    structured_data_size?: string;
    unstructured_data_size?: string;
    structured_data_update_time?: string;
    unstructured_data_update_time?: string;
  };
  document_processing_config: {
    name: string;
    default_parsing_config: {
      digital_parsing_config: Record<string, unknown>;
    };
    chunking_config?: {
      layout_based_chunking_config: {
        chunk_size: number;
        include_ancestor_headings: boolean;
      };
    };
  };
}

export interface ApiDatastoreListResponse {
  data_stores: ApiDatastoreResponse[];
}

// Document types (camelCase)
export interface Document {
  name: string;
  id: string;
  schemaId: string;
  content?: {
    mimeType?: string;
    uri?: string;
    rawBytes?: string;
  };
  parentDocumentId?: string;
  derivedStructData?: any;
  structData?: any;
  indexTime?: string;
}

export interface DocumentListResponse {
  documents: Document[];
}

// API Document types (snake_case from backend)
export interface ApiDocumentResponse {
  name: string;
  id: string;
  schema_id: string;
  content?: {
    mime_type?: string;
    uri?: string;
    raw_bytes?: string;
  };
  parent_document_id?: string;
  derived_struct_data?: any;
  struct_data?: any;
  index_time?: string;
}

export interface ApiDocumentListResponse {
  documents: ApiDocumentResponse[];
}
