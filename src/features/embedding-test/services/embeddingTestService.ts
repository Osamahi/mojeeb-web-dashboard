import api from '@/lib/api';
import type {
  EmbeddingSearchRequest,
  EmbeddingSearchResult,
  ApiEmbeddingSearchRequest,
  ApiEmbeddingSearchResult,
} from '../types/embeddingTest.types';

/**
 * Transform camelCase request to snake_case for API
 */
function toApiRequest(request: EmbeddingSearchRequest): ApiEmbeddingSearchRequest {
  return {
    query_text: request.queryText,
  };
}

/**
 * Transform snake_case API response to camelCase
 */
function fromApiResult(apiResult: ApiEmbeddingSearchResult): EmbeddingSearchResult {
  return {
    chunkId: apiResult.chunk_id,
    chunkText: apiResult.chunk_text,
    similarityScore: apiResult.similarity_score,
    knowledgeBaseId: apiResult.knowledge_base_id,
    knowledgeBaseName: apiResult.knowledge_base_name,
    chunkIndex: apiResult.chunk_index,
  };
}

/**
 * Search embeddings for testing retrieval quality
 * Uses hardcoded test agent ID (3f35d88d-536e-43a7-abf1-8d286a01c474)
 */
export async function searchEmbeddings(
  request: EmbeddingSearchRequest
): Promise<EmbeddingSearchResult[]> {
  console.log('[embeddingTestService] 🔍 Starting search with request:', request);

  const apiRequest = toApiRequest(request);
  console.log('[embeddingTestService] 📤 Transformed API request:', apiRequest);

  console.log('[embeddingTestService] 🌐 Calling API: POST /api/embeddingtest/search');
  const response = await api.post<ApiEmbeddingSearchResult[]>(
    '/api/embeddingtest/search',
    apiRequest
  );

  console.log('[embeddingTestService] 📥 Raw response received:', {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    data: response.data,
  });

  console.log('[embeddingTestService] 🔍 Response.data type:', typeof response.data);
  console.log('[embeddingTestService] 🔍 Is response.data an array?', Array.isArray(response.data));
  console.log('[embeddingTestService] 🔍 Response.data length:', Array.isArray(response.data) ? response.data.length : 'N/A');

  // Handle both array and object responses
  const data = Array.isArray(response.data) ? response.data : [];
  console.log('[embeddingTestService] 📊 Extracted data array:', {
    length: data.length,
    firstItem: data.length > 0 ? data[0] : null,
  });

  const transformed = data.map(fromApiResult);
  console.log('[embeddingTestService] ✨ Transformed results:', {
    count: transformed.length,
    results: transformed,
  });

  console.log('[embeddingTestService] ✅ Returning results:', transformed);
  return transformed;
}

// Export as service object for consistency
export const embeddingTestService = {
  searchEmbeddings,
};
