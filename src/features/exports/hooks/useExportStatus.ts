import { useQuery } from '@tanstack/react-query';
import { exportService } from '../services/exportService';

export function useExportStatus(jobId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['export-status', jobId],
    queryFn: () => exportService.getExportStatus(jobId!),
    enabled: enabled && !!jobId,
    refetchInterval: (data) => {
      if (!data) return 2000; // Poll every 2 seconds if no data yet

      // Stop polling when completed or failed
      if (data.status === 'completed' || data.status === 'failed') {
        return false;
      }

      // Continue polling every 2 seconds for pending/processing
      return 2000;
    },
    staleTime: 1000, // Consider data stale after 1 second
    retry: 3, // Retry failed requests up to 3 times
  });
}
