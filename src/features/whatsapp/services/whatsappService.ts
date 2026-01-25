/**
 * WhatsApp Service
 * API calls for WhatsApp Business management
 */

import api from '@/lib/api';
import type {
  GetTemplatesResponse,
  MessageTemplate,
  SendTemplateRequest,
  SendTemplateResponse,
} from '../types/whatsapp.types';

const WHATSAPP_TEMPLATES_BASE = '/api/whatsapp/templates';

export const whatsappService = {
  /**
   * Get all message templates for a WhatsApp connection
   * SECURITY: Access token retrieved from backend, not passed from frontend
   * Route: GET /api/whatsapp/templates
   */
  async getTemplates(connectionId: string): Promise<MessageTemplate[]> {
    const response = await api.get<GetTemplatesResponse>(
      WHATSAPP_TEMPLATES_BASE,
      {
        params: {
          connectionId,
        },
      }
    );
    return response.data.data;
  },

  /**
   * Create a new WhatsApp message template
   * SECURITY: Access token retrieved from backend, not passed from frontend
   * Route: POST /api/whatsapp/templates/create
   */
  async createTemplate(
    connectionId: string,
    request: {
      name: string;
      language: string;
      category: string;
      body: string;
    }
  ): Promise<{ success: boolean; template_id?: string; status?: string; error?: string }> {
    const response = await api.post(
      `${WHATSAPP_TEMPLATES_BASE}/create`,
      request,
      {
        params: {
          connectionId,
        },
      }
    );
    return response.data;
  },

  /**
   * Send a WhatsApp template message
   * Route: POST /api/whatsapp/templates/send/{phoneNumberId}
   */
  async sendTemplate(
    phoneNumberId: string,
    accessToken: string,
    request: SendTemplateRequest
  ): Promise<SendTemplateResponse> {
    const response = await api.post<SendTemplateResponse>(
      `${WHATSAPP_TEMPLATES_BASE}/send/${phoneNumberId}`,
      request,
      {
        params: {
          accessToken,
        },
      }
    );
    return response.data;
  },
};
