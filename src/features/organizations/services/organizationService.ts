/**
 * Organization Service
 * Handles API calls related to organizations
 * Follows standard service pattern matching agentService.ts
 */

import api from '@/lib/api';
import type {
  Organization,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  UserSearchResult,
  AssignUserToOrganizationRequest,
  OrganizationMember
} from '../types';
import type { ApiResponse } from '@/types/api';
import { logger } from '@/lib/logger';

// API Response Types (snake_case from backend)
interface ApiOrganizationResponse {
  id: string;
  name: string;
  contact_email?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  default_primary_color?: string;
  default_welcome_message?: string;
  logo_url?: string;
  allowed_domains?: string[];
}

interface ApiUserSearchResult {
  id: string;
  email: string;
  name: string | null;
  current_organization: {
    id: string;
    name: string;
  } | null;
}

interface ApiOrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

/**
 * Transform API response from snake_case to camelCase
 * Follows agentService.ts pattern
 */
function transformOrganization(apiOrg: ApiOrganizationResponse): Organization {
  return {
    id: apiOrg.id,
    name: apiOrg.name,
    contactEmail: apiOrg.contact_email,
    ownerId: apiOrg.owner_id,
    createdAt: apiOrg.created_at,
    updatedAt: apiOrg.updated_at,
    defaultPrimaryColor: apiOrg.default_primary_color,
    defaultWelcomeMessage: apiOrg.default_welcome_message,
    logoUrl: apiOrg.logo_url,
    allowedDomains: apiOrg.allowed_domains,
  };
}

/**
 * Transform user search result from snake_case to camelCase
 */
function transformUserSearchResult(apiUser: ApiUserSearchResult): UserSearchResult {
  return {
    id: apiUser.id,
    email: apiUser.email,
    name: apiUser.name,
    currentOrganization: apiUser.current_organization ? {
      id: apiUser.current_organization.id,
      name: apiUser.current_organization.name
    } : null
  };
}

/**
 * Transform organization member from snake_case to camelCase
 */
function transformOrganizationMember(apiMember: ApiOrganizationMember): OrganizationMember {
  return {
    id: apiMember.id,
    organizationId: apiMember.organization_id,
    userId: apiMember.user_id,
    role: apiMember.role as 'owner' | 'admin' | 'member',
    joinedAt: apiMember.joined_at,
    createdAt: apiMember.created_at,
    updatedAt: apiMember.updated_at,
    user: apiMember.user ? {
      id: apiMember.user.id,
      name: apiMember.user.name,
      email: apiMember.user.email
    } : undefined
  };
}

export const organizationService = {
  /**
   * Get all organizations (SuperAdmin only)
   * Returns organizations sorted by creation date (newest first)
   */
  async getOrganizations(): Promise<Organization[]> {
    try {
      const response = await api.get<ApiResponse<ApiOrganizationResponse[]>>('/api/organization/all');
      logger.info('[organizationService] Fetched organizations', { count: response.data.data.length });
      return response.data.data.map(org => transformOrganization(org));
    } catch (error) {
      logger.error('[organizationService] Failed to fetch organizations', error as Error);
      throw error;
    }
  },

  /**
   * Get organization by ID
   */
  async getOrganizationById(id: string): Promise<Organization> {
    try {
      const response = await api.get<ApiResponse<ApiOrganizationResponse>>(`/api/organization/${id}`);
      logger.info('[organizationService] Fetched organization', { id });
      return transformOrganization(response.data.data);
    } catch (error) {
      logger.error('[organizationService] Failed to fetch organization', error as Error, { id });
      throw error;
    }
  },

  /**
   * Get the current user's organization
   * This fetches the organization that the authenticated user belongs to
   * NOTE: Backend auto-creates organization if user doesn't have one
   */
  async getUserOrganization(): Promise<{ organization: Organization }> {
    const response = await api.get<ApiResponse<ApiOrganizationResponse>>('/api/organization/me');

    if (!response.data?.data) {
      throw new Error('No organization found for current user');
    }

    return {
      organization: transformOrganization(response.data.data),
    };
  },

  /**
   * Create a new organization
   * Transforms camelCase to snake_case for backend
   * Note: Backend returns organization directly (not wrapped in ApiResponse)
   */
  async createOrganization(data: CreateOrganizationRequest): Promise<Organization> {
    try {
      // Transform camelCase to snake_case for backend
      const snakeCaseData = {
        name: data.name,
        contact_email: data.contactEmail,
        owner_id: data.ownerId,
        default_primary_color: data.defaultPrimaryColor,
        default_welcome_message: data.defaultWelcomeMessage,
        logo_url: data.logoUrl,
        allowed_domains: data.allowedDomains,
      };

      // Backend returns organization directly via CreatedAtAction
      const response = await api.post<ApiOrganizationResponse>('/api/organization', snakeCaseData);
      logger.info('[organizationService] Created organization', {
        id: response.data.id,
        name: data.name
      });
      return transformOrganization(response.data);
    } catch (error) {
      logger.error('[organizationService] Failed to create organization', error as Error, {
        name: data.name
      });
      throw error;
    }
  },

  /**
   * Update organization
   * Transforms camelCase to snake_case for backend
   */
  async updateOrganization(
    id: string,
    data: UpdateOrganizationRequest
  ): Promise<Organization> {
    try {
      // Transform camelCase to snake_case for backend
      const snakeCaseData = {
        name: data.name,
        contact_email: data.contactEmail,
        owner_id: data.ownerId, // CRITICAL: Must be snake_case
        default_primary_color: data.defaultPrimaryColor,
        default_welcome_message: data.defaultWelcomeMessage,
        logo_url: data.logoUrl,
        allowed_domains: data.allowedDomains,
      };

      const response = await api.put<ApiResponse<ApiOrganizationResponse>>(`/api/organization/${id}`, snakeCaseData);
      logger.info('[organizationService] Updated organization', {
        id,
        name: data.name
      });
      return transformOrganization(response.data.data);
    } catch (error) {
      logger.error('[organizationService] Failed to update organization', error as Error, { id });
      throw error;
    }
  },

  /**
   * Delete organization
   * FIXED: Added missing delete method following agentService pattern
   */
  async deleteOrganization(id: string): Promise<void> {
    try {
      await api.delete(`/api/organization/${id}`);
      logger.info('[organizationService] Deleted organization', { id });
    } catch (error) {
      logger.error('[organizationService] Failed to delete organization', error as Error, { id });
      throw error;
    }
  },

  // ========== SUPERADMIN TEAM MANAGEMENT ==========

  /**
   * Search users by email or name (SuperAdmin only)
   * Returns users with their current organization info
   */
  async searchUsers(query: string): Promise<UserSearchResult[]> {
    try {
      const response = await api.get<ApiResponse<ApiUserSearchResult[]>>('/api/organization/search-users', {
        params: { query }
      });
      logger.info('[organizationService] Searched users', { query, count: response.data.data.length });
      // Transform snake_case to camelCase
      return response.data.data.map(user => transformUserSearchResult(user));
    } catch (error) {
      logger.error('[organizationService] Failed to search users', error as Error, { query });
      throw error;
    }
  },

  /**
   * Assign user to organization (SuperAdmin only)
   * Validates if user already belongs to another organization
   */
  async assignUserToOrganization(
    organizationId: string,
    data: AssignUserToOrganizationRequest
  ): Promise<void> {
    try {
      // Transform camelCase to snake_case for backend
      const snakeCaseData = {
        user_id: data.userId,
        role: data.role,
        remove_from_current: data.removeFromCurrent
      };

      await api.post<ApiResponse<any>>(
        `/api/organization/${organizationId}/assign-user`,
        snakeCaseData
      );
      logger.info('[organizationService] Assigned user to organization', {
        organizationId,
        userId: data.userId,
        role: data.role
      });
    } catch (error) {
      logger.error('[organizationService] Failed to assign user to organization', error as Error, {
        organizationId,
        userId: data.userId
      });
      throw error;
    }
  },

  /**
   * Get organization members
   * Returns list of members with their roles and join dates
   */
  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    try {
      const response = await api.get<ApiResponse<ApiOrganizationMember[]>>(
        `/api/organization/${organizationId}/members`
      );
      logger.info('[organizationService] Fetched organization members', {
        organizationId,
        count: response.data.data.length
      });
      return response.data.data.map(member => transformOrganizationMember(member));
    } catch (error) {
      logger.error('[organizationService] Failed to fetch organization members', error as Error, {
        organizationId
      });
      throw error;
    }
  },

  /**
   * Remove user from organization (SuperAdmin only)
   */
  async removeUserFromOrganization(organizationId: string, userId: string): Promise<void> {
    try {
      await api.delete(`/api/organization/${organizationId}/members/${userId}`);
      logger.info('[organizationService] Removed user from organization', { organizationId, userId });
    } catch (error) {
      logger.error('[organizationService] Failed to remove user from organization', error as Error, {
        organizationId,
        userId
      });
      throw error;
    }
  },
};
