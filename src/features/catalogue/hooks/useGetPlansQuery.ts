import { useQuery } from '@tanstack/react-query';
import { catalogueService } from '../services/catalogueService';

interface UseGetPlansQueryParams {
  activeOnly?: boolean;
  search?: string;
}

export function useGetPlansQuery(params?: UseGetPlansQueryParams) {
  return useQuery({
    queryKey: ['admin-plans', params],
    queryFn: () => catalogueService.getAllPlans(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
