import { useMutation } from '@tanstack/react-query';
import { embeddingTestService } from '../services/embeddingTestService';
import type { EmbeddingSearchRequest, EmbeddingSearchResult } from '../types/embeddingTest.types';
import { toast } from 'sonner';

/**
 * Mutation hook for searching embeddings
 * Uses TanStack Query for state management and caching
 */
export function useEmbeddingSearch() {
  return useMutation<EmbeddingSearchResult[], Error, EmbeddingSearchRequest>({
    mutationFn: (request: EmbeddingSearchRequest) =>
      embeddingTestService.searchEmbeddings(request),

    onSuccess: (data) => {
      console.log('[useEmbeddingSearch] Search successful:', {
        resultCount: data.length,
        results: data,
      });
    },

    onError: (error: Error) => {
      console.error('[useEmbeddingSearch] Search failed:', error);

      // Show user-friendly error message
      if (error.message.includes('400')) {
        toast.error('Invalid search query. Please check your input.');
      } else if (error.message.includes('401')) {
        toast.error('Authentication failed. Please log in again.');
      } else if (error.message.includes('500')) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(`Search failed: ${error.message}`);
      }
    },
  });
}
