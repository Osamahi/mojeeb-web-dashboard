export interface CreateExportRequest {
  agent_id: string;
  format: 'xlsx' | 'csv' | 'json';
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface ExportJobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  blob_url?: string;
  file_name?: string;
  row_count?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExportResponse {
  job_id: string;
  status: string;
}
