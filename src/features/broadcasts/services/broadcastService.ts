/**
 * Broadcast Service
 * API calls for WhatsApp broadcast campaign management
 */

import api from '@/lib/api';
import type {
  BroadcastCampaign,
  BroadcastRecipient,
  CreateBroadcastRequest,
  CursorPaginatedResponse,
} from '../types/broadcast.types';

const BROADCASTS_BASE = '/api/broadcasts';

export const broadcastService = {
  async createCampaign(
    agentId: string,
    request: CreateBroadcastRequest
  ): Promise<BroadcastCampaign> {
    const response = await api.post<BroadcastCampaign>(BROADCASTS_BASE, request, {
      params: { agentId },
    });
    return response.data;
  },

  async getCampaigns(
    agentId: string,
    limit: number = 20,
    cursor?: string,
    status?: string
  ): Promise<CursorPaginatedResponse<BroadcastCampaign>> {
    const response = await api.get<CursorPaginatedResponse<BroadcastCampaign>>(
      BROADCASTS_BASE,
      {
        params: { agentId, limit, cursor, status },
      }
    );
    return response.data;
  },

  async getCampaignDetail(agentId: string, campaignId: string): Promise<BroadcastCampaign> {
    const response = await api.get<BroadcastCampaign>(
      `${BROADCASTS_BASE}/${campaignId}`,
      { params: { agentId } }
    );
    return response.data;
  },

  async getRecipients(
    agentId: string,
    campaignId: string,
    limit: number = 50,
    cursor?: string,
    status?: string
  ): Promise<CursorPaginatedResponse<BroadcastRecipient>> {
    const response = await api.get<CursorPaginatedResponse<BroadcastRecipient>>(
      `${BROADCASTS_BASE}/${campaignId}/recipients`,
      {
        params: { agentId, limit, cursor, status },
      }
    );
    return response.data;
  },

  async retryFailed(agentId: string, campaignId: string): Promise<void> {
    await api.post(`${BROADCASTS_BASE}/${campaignId}/retry`, null, {
      params: { agentId },
    });
  },
};
