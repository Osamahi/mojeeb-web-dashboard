import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { funnelService } from '../services/funnelService';

export function useStepUsers(
  eventName: string | null,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: queryKeys.funnelStepUsers(eventName, startDate, endDate),
    queryFn: () => funnelService.getStepUsers(eventName!, startDate, endDate),
    enabled: !!eventName,
    staleTime: 2 * 60 * 1000,
  });
}
