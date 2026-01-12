// Pinecone Test Types

export interface PineconeUploadRequest {
  agentId: string;
  file: File;
}

export interface PineconeUploadResponse {
  success: boolean;
  message?: string;
  data?: {
    documentId: string;
    namespace: string;
    chunksUploaded: number;
    durationMs: number;
    filename: string;
    textLength: number;
  };
  error?: string;
}

export interface PineconeSearchRequest {
  agent_id: string;
  query: string;
}

export interface PineconeMatch {
  id: string;
  score: number;
  chunk_text?: string;
  chunk_index?: number;
  total_chunks?: number;
  filename?: string;
  document_id?: string;
}

export interface PineconeSearchResponse {
  success: boolean;
  match_count?: number;
  reranked?: boolean;
  duration_ms?: number;
  matches?: PineconeMatch[];
  error?: string;
}

// UI State Types
export type PineconeTestTab = 'upload' | 'search';

export interface PineconeTestState {
  activeTab: PineconeTestTab;
  uploadForm: {
    agentId: string;
    filename: string;
    text: string;
  };
  searchForm: {
    agentId: string;
    query: string;
  };
  uploadResult: PineconeUploadResponse | null;
  searchResults: PineconeMatch[];
}
