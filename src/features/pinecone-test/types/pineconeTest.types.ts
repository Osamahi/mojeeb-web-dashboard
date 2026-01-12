// Pinecone Test Types

export interface PineconeUploadRequest {
  agent_id: string;
  filename: string;
  text: string;
}

export interface PineconeUploadResponse {
  success: boolean;
  chunks_uploaded?: number;
  document_id?: string;
  namespace?: string;
  duration_ms?: number;
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
