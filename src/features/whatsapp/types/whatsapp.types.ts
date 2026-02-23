/**
 * WhatsApp Types
 * Type definitions for WhatsApp Business Cloud API
 */

export interface WhatsAppBusinessAccount {
  id: string;
  name: string;
  timezone_id?: string;
  message_template_namespace?: string;
}

export interface WhatsAppPhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name?: string;
  code_verification_status?: string;
  quality_rating?: string;
  business_account_id?: string;
  business_account_name?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DISABLED';
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  components?: TemplateComponent[];
  quality_score?: { score: string; date?: number };
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  text?: string;
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  parameters?: TemplateParameter[];
  buttons?: TemplateButton[];
  example?: { body_text?: string[][] };
}

export interface TemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
}

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phone_number?: string;
}

export interface SendTemplateRequest {
  recipient: string;
  template_name: string;
  language_code?: string;
  parameters?: Record<string, string>;
}

export interface SendTemplateResponse {
  success: boolean;
  message_id?: string;
  error?: string;
}

export interface GetTemplatesResponse {
  success: boolean;
  data: MessageTemplate[];
  count: number;
}

export interface CreateTemplateRequest {
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: TemplateComponent[];
}

export interface CreateTemplateButtonInput {
  type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
  text: string;
  url?: string;
  phone_number?: string;
}

export interface CreateTemplateHeaderInput {
  format: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  header_example?: string;
  media_url?: string;
}

export type TemplateStatus = MessageTemplate['status'];
export type TemplateCategory = MessageTemplate['category'];
