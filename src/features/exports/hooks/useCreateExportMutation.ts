import { useMutation } from '@tanstack/react-query';
import { exportService } from '../services/exportService';
import type { CreateExportRequest } from '../types/export.types';

export function useCreateExportMutation() {
  return useMutation({
    mutationFn: (request: CreateExportRequest) => exportService.createLeadsExport(request),
  });
}
