/**
 * Broadcast Types
 * Type definitions for WhatsApp broadcast campaigns
 */

export interface BroadcastCampaign {
  id: string;
  agent_id: string;
  connection_id: string;
  campaign_name: string;
  template_name: string;
  language_code: string;
  parameters?: Record<string, string>;
  template_body?: string;
  recipient_count: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  status: BroadcastStatus;
  created_by?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export type BroadcastStatus = 'draft' | 'sending' | 'paused' | 'completed' | 'failed';

export interface BroadcastRecipient {
  id: string;
  campaign_id: string;
  phone: string;
  name?: string;
  status: RecipientStatus;
  whatsapp_message_id?: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
}

export type RecipientStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface CreateBroadcastRequest {
  campaign_name: string;
  connection_id: string;
  template_name: string;
  language_code: string;
  parameters?: Record<string, string>;
  template_body?: string;
  recipients: BroadcastRecipientInput[];
}

export interface BroadcastRecipientInput {
  phone: string;
  name?: string;
}

export interface CursorPaginatedResponse<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface CsvValidationResult {
  valid: BroadcastRecipientInput[];
  invalid: { phone: string; name?: string; reason: string }[];
  duplicatesRemoved: number;
  totalRows: number;
}
