/**
 * Embedding Test Feature Types
 * Types for testing embedding retrieval quality
 */

/**
 * Request payload for embedding search (frontend format - camelCase)
 */
export interface EmbeddingSearchRequest {
  queryText: string;
}

/**
 * API request payload (backend format - snake_case)
 */
export interface ApiEmbeddingSearchRequest {
  query_text: string;
}

/**
 * Search result from the embedding test endpoint (frontend format)
 */
export interface EmbeddingSearchResult {
  chunkId: string;
  chunkText: string;
  similarityScore: number;
  knowledgeBaseId: string;
  knowledgeBaseName: string;
  chunkIndex: number;
}

/**
 * API response format (backend format - snake_case)
 */
export interface ApiEmbeddingSearchResult {
  chunk_id: string;
  chunk_text: string;
  similarity_score: number;
  knowledge_base_id: string;
  knowledge_base_name: string;
  chunk_index: number;
}

/**
 * Similarity score threshold levels for color coding
 */
export enum SimilarityLevel {
  HIGH = 'high',     // >= 0.7 (green)
  MEDIUM = 'medium', // 0.5 - 0.69 (yellow)
  LOW = 'low',       // < 0.5 (red)
}

/**
 * Get similarity level for a score
 */
export function getSimilarityLevel(score: number): SimilarityLevel {
  if (score >= 0.7) return SimilarityLevel.HIGH;
  if (score >= 0.5) return SimilarityLevel.MEDIUM;
  return SimilarityLevel.LOW;
}

/**
 * Get color class for similarity level
 */
export function getSimilarityColor(level: SimilarityLevel): string {
  switch (level) {
    case SimilarityLevel.HIGH:
      return 'bg-green-100 text-green-800 border-green-200';
    case SimilarityLevel.MEDIUM:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case SimilarityLevel.LOW:
      return 'bg-red-100 text-red-800 border-red-200';
  }
}

/**
 * Get emoji for similarity level
 */
export function getSimilarityEmoji(level: SimilarityLevel): string {
  switch (level) {
    case SimilarityLevel.HIGH:
      return '🟢';
    case SimilarityLevel.MEDIUM:
      return '🟡';
    case SimilarityLevel.LOW:
      return '🔴';
  }
}
