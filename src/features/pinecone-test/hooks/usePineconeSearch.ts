import { useMutation } from '@tanstack/react-query';
import { searchDocuments } from '../services/pineconeTestService';
import type { PineconeSearchRequest } from '../types/pineconeTest.types';
import { toast } from 'sonner';

export function usePineconeSearch() {
  return useMutation({
    mutationFn: (request: PineconeSearchRequest) => searchDocuments(request),
    onSuccess: (data) => {
      if (data.success) {
        const rerankText = data.reranked ? ' (reranked)' : '';
        toast.success(
          `Found ${data.match_count} results in ${data.duration_ms?.toFixed(0)}ms${rerankText}`
        );
      } else {
        toast.error(data.error || 'Search failed');
      }
    },
    onError: (error: Error) => {
      toast.error(`Search failed: ${error.message}`);
    },
  });
}
