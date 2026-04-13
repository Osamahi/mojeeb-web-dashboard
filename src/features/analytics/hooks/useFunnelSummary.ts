import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { funnelService } from '../services/funnelService';

export function useFunnelSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.funnelSummary(startDate, endDate),
    queryFn: () => funnelService.getSummary(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
}
