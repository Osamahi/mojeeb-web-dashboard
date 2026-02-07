import api from '@/lib/api';
import type { PlatformType } from '../types/connection.types';

/**
 * Admin Connection Service
 * Service for super admin to view all social platform connections
 */

// Admin-specific connection types
export interface AdminConnectionFilters {
  platform?: PlatformType;
  agentId?: string;
  organizationId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AdminConnectionListItem {
  id: string;
  platform: PlatformType;
  platformAccountId: string;
  platformAccountName: string | null;
  platformAccountHandle: string | null;
  platformPictureUrl: string | null;
  isActive: boolean;
  agentId: string;
  agentName: string | null;
  organizationId: string | null;
  organizationName: string | null;
  followerCount: number | null;
  businessCategory: string | null;
  parentPageId: string | null;
  codeVerificationStatus: string | null;
  createdAt: string;
}

export interface AdminConnectionDetail extends AdminConnectionListItem {
  businessId: string | null;
  businessName: string | null;
  tokenExpiresAt: string | null;
  platformMetadata: Record<string, unknown> | null;
  webhookSecret: string | null;
  updatedAt: string;
}

export interface AdminConnectionsResponse {
  connections: AdminConnectionListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// API response types (snake_case from backend)
interface ApiAdminConnectionListItem {
  id: string;
  platform: string;
  platform_account_id: string;
  platform_account_name: string | null;
  platform_account_handle: string | null;
  platform_picture_url: string | null;
  is_active: boolean;
  agent_id: string;
  agent_name: string | null;
  organization_id: string | null;
  organization_name: string | null;
  follower_count: number | null;
  business_category: string | null;
  parent_page_id: string | null;
  code_verification_status: string | null;
  created_at: string;
}

interface ApiAdminConnectionDetail extends ApiAdminConnectionListItem {
  business_id: string | null;
  business_name: string | null;
  token_expires_at: string | null;
  platform_metadata: Record<string, unknown> | null;
  webhook_secret: string | null;
  updated_at: string;
}

interface ApiAdminConnectionsResponse {
  connections: ApiAdminConnectionListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

class AdminConnectionService {
  /**
   * Transform API connection list item from snake_case to camelCase
   */
  private transformConnectionListItem(
    apiConnection: ApiAdminConnectionListItem
  ): AdminConnectionListItem {
    return {
      id: apiConnection.id,
      platform: apiConnection.platform as PlatformType,
      platformAccountId: apiConnection.platform_account_id,
      platformAccountName: apiConnection.platform_account_name,
      platformAccountHandle: apiConnection.platform_account_handle,
      platformPictureUrl: apiConnection.platform_picture_url,
      isActive: apiConnection.is_active,
      agentId: apiConnection.agent_id,
      agentName: apiConnection.agent_name,
      organizationId: apiConnection.organization_id,
      organizationName: apiConnection.organization_name,
      followerCount: apiConnection.follower_count,
      businessCategory: apiConnection.business_category,
      parentPageId: apiConnection.parent_page_id,
      codeVerificationStatus: apiConnection.code_verification_status,
      createdAt: apiConnection.created_at,
    };
  }

  /**
   * Transform API connection detail from snake_case to camelCase
   */
  private transformConnectionDetail(
    apiConnection: ApiAdminConnectionDetail
  ): AdminConnectionDetail {
    return {
      ...this.transformConnectionListItem(apiConnection),
      businessId: apiConnection.business_id,
      businessName: apiConnection.business_name,
      tokenExpiresAt: apiConnection.token_expires_at,
      platformMetadata: apiConnection.platform_metadata,
      webhookSecret: apiConnection.webhook_secret,
      updatedAt: apiConnection.updated_at,
    };
  }

  /**
   * Get all platform connections with optional filters
   */
  async getAllConnections(
    filters: AdminConnectionFilters = {}
  ): Promise<AdminConnectionsResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.platform) params.append('platform', filters.platform);
      if (filters.agentId) params.append('agentId', filters.agentId);
      if (filters.organizationId) params.append('organizationId', filters.organizationId);
      if (filters.search) params.append('search', filters.search);
      if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters.page) params.append('page', String(filters.page));
      if (filters.pageSize) params.append('pageSize', String(filters.pageSize));

      const { data: response } = await api.get<{ data: ApiAdminConnectionsResponse }>(
        `/api/admin/connections?${params.toString()}`
      );

      return {
        connections: response.data.connections.map((c) =>
          this.transformConnectionListItem(c)
        ),
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('[AdminConnectionService] Failed to fetch connections:', error);
      throw error;
    }
  }

  /**
   * Get detailed connection information
   */
  async getConnectionDetails(connectionId: string): Promise<AdminConnectionDetail> {
    try {
      const { data: response } = await api.get<{ data: ApiAdminConnectionDetail }>(
        `/api/admin/connections/${connectionId}`
      );

      return this.transformConnectionDetail(response.data);
    } catch (error) {
      console.error(`[AdminConnectionService] Failed to fetch connection details for ${connectionId}:`, error);
      throw error;
    }
  }

  /**
   * Get access token for a specific connection (SuperAdmin only - for token examination)
   */
  async getConnectionToken(connectionId: string): Promise<{ accessToken: string | null }> {
    try {
      const { data: response } = await api.get<{ data: { access_token: string | null } }>(
        `/api/admin/connections/${connectionId}/token`
      );

      return {
        accessToken: response.data.access_token,
      };
    } catch (error) {
      console.error(`[AdminConnectionService] Failed to fetch connection token for ${connectionId}:`, error);
      throw error;
    }
  }
}

export const adminConnectionService = new AdminConnectionService();
