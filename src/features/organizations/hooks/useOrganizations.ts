import { useQuery } from '@tanstack/react-query';
import { organizationService } from '../services/organizationService';

/**
 * Hook to fetch all organizations (SuperAdmin only)
 */
export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationService.getOrganizations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
