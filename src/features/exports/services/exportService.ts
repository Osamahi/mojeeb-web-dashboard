import api from '@/lib/api';
import type { CreateExportRequest, ExportJobStatus, CreateExportResponse } from '../types/export.types';

export const exportService = {
  /**
   * Create a new leads export job
   */
  createLeadsExport: async (request: CreateExportRequest): Promise<CreateExportResponse> => {
    const response = await api.post<CreateExportResponse>('/api/export/leads', request);
    return response.data;
  },

  /**
   * Get the status of an export job
   */
  getExportStatus: async (jobId: string): Promise<ExportJobStatus> => {
    const response = await api.get<ExportJobStatus>(`/api/export/status/${jobId}`);
    return response.data;
  },
};
