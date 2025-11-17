import api from '@/lib/api';
import { logger } from '@/lib/logger';
import { isAxiosError, ApiError, NotFoundError } from '@/lib/errors';
import type {
  PlatformConnection,
  ConnectionHealthStatus,
  ApiPlatformConnectionResponse,
  ApiConnectionHealthResponse,
  PlatformType,
} from '../types';
import { VALID_PLATFORMS, API_PATHS } from '../constants';

/**
 * Validate and normalize platform type
 * Returns valid platform or 'web' as fallback with warning
 */
function validatePlatformType(platform: string): PlatformType {
  if (VALID_PLATFORMS.includes(platform as PlatformType)) {
    return platform as PlatformType;
  }
  logger.warn(`Unknown platform type '${platform}', falling back to 'web'`);
  return 'web';
}

/**
 * Parse token permissions from raw JSON
 */
function parseTokenPermissions(rawJson: string | undefined): string[] {
  if (!rawJson) return [];

  try {
    const tokenData = JSON.parse(rawJson);
    const scopes = tokenData?.data?.scopes;

    if (Array.isArray(scopes)) {
      return scopes.filter((scope: unknown) => typeof scope === 'string');
    }

    if (scopes !== undefined) {
      logger.warn('token_check_raw_json.data.scopes is not an array', { scopes });
    }
  } catch (error) {
    logger.warn('Failed to parse token_check_raw_json', error);
  }

  return [];
}

/**
 * Parse token expiry information from raw JSON
 */
function parseTokenExpiry(rawJson: string | undefined): {
  tokenExpiresAt: string | null;
  daysUntilExpiry: number | null;
} {
  if (!rawJson) {
    return { tokenExpiresAt: null, daysUntilExpiry: null };
  }

  try {
    const tokenData = JSON.parse(rawJson);
    const expiryTimestamp = tokenData?.data?.data_access_expires_at;

    if (typeof expiryTimestamp === 'number' && expiryTimestamp > 0) {
      const expiresAtTimestamp = expiryTimestamp * 1000;
      const tokenExpiresAt = new Date(expiresAtTimestamp).toISOString();
      const daysUntilExpiry = Math.floor((expiresAtTimestamp - Date.now()) / (1000 * 60 * 60 * 24));
      return { tokenExpiresAt, daysUntilExpiry };
    }

    if (expiryTimestamp !== undefined) {
      logger.warn('token_check_raw_json.data.data_access_expires_at is invalid', { expiryTimestamp });
    }
  } catch {
    // Already logged in parseTokenPermissions if JSON is malformed
  }

  return { tokenExpiresAt: null, daysUntilExpiry: null };
}

/**
 * Parse webhook subscription status from raw JSON
 */
function parseWebhookStatus(rawJson: string | undefined): boolean {
  if (!rawJson) return true;

  try {
    const subscriptionData = JSON.parse(rawJson);
    return subscriptionData?.error === undefined || subscriptionData?.error === null;
  } catch (error) {
    logger.warn('Failed to parse subscription_check_raw_json', error);
    return true; // Default to active if we can't parse
  }
}

/**
 * Handle API errors consistently across all service methods
 */
function handleApiError(error: unknown, resourceType: string, resourceId: string): never {
  if (isAxiosError(error)) {
    if (error.response?.status === 404) {
      throw new NotFoundError(resourceType, resourceId);
    }
    throw ApiError.fromAxiosError(error);
  }
  throw error;
}

class ConnectionService {
  /**
   * Transform API response from snake_case to camelCase
   */
  private transformConnection(apiConnection: ApiPlatformConnectionResponse): PlatformConnection {
    const parentPageId = apiConnection.metadata?.parent_page_id ?? null;
    const platform = validatePlatformType(apiConnection.platform);

    return {
      id: apiConnection.id,
      agentId: apiConnection.agent_id,
      platform,
      platformAccountId: apiConnection.platform_account_id,
      platformAccountName: apiConnection.platform_account_name ?? null,
      platformAccountHandle: apiConnection.platform_account_handle ?? null,
      platformPictureUrl: apiConnection.platform_picture_url ?? null,
      parentPageId,
      isActive: apiConnection.is_active,
      createdAt: apiConnection.created_at,
      updatedAt: apiConnection.updated_at,
      platformMetadata: apiConnection.metadata ?? null,
    };
  }

  /**
   * Transform health status from API response to internal format
   */
  private transformHealthStatus(apiHealth: ApiConnectionHealthResponse): ConnectionHealthStatus {
    const permissions = parseTokenPermissions(apiHealth.token_check_raw_json);
    const { tokenExpiresAt, daysUntilExpiry } = parseTokenExpiry(apiHealth.token_check_raw_json);
    const webhookSubscriptionActive = parseWebhookStatus(apiHealth.subscription_check_raw_json);

    return {
      tokenValid: apiHealth.is_healthy,
      tokenExpiresAt,
      daysUntilExpiry,
      webhookSubscriptionActive,
      permissions,
      error: apiHealth.is_healthy ? null : apiHealth.message,
    };
  }

  /**
   * Get all connections for an agent
   */
  async getConnections(agentId: string): Promise<PlatformConnection[]> {
    try {
      const { data: response } = await api.get<{ data: ApiPlatformConnectionResponse[] }>(
        API_PATHS.CONNECTIONS,
        { params: { agentId } }
      );

      // Backend wraps the array in a data property - validate it's actually an array
      if (!Array.isArray(response.data)) {
        logger.warn('API response.data is not an array, returning empty connections', {
          agentId,
          responseType: typeof response.data,
        });
        return [];
      }

      return response.data.map(connection => this.transformConnection(connection));
    } catch (error) {
      logger.error('Error fetching platform connections', { agentId, error });
      handleApiError(error, 'Agent', agentId);
    }
  }

  /**
   * Disconnect (deactivate) a platform connection
   */
  async disconnectPlatform(connectionId: string): Promise<void> {
    try {
      await api.delete(API_PATHS.CONNECTION(connectionId));
    } catch (error) {
      logger.error('Error disconnecting platform', { connectionId, error });
      handleApiError(error, 'Connection', connectionId);
    }
  }

  /**
   * Check health status of a Facebook/Instagram connection
   */
  async checkConnectionHealth(connectionId: string): Promise<ConnectionHealthStatus> {
    try {
      const { data } = await api.get<ApiConnectionHealthResponse>(
        API_PATHS.HEALTH_CHECK(connectionId)
      );

      return this.transformHealthStatus(data);
    } catch (error) {
      logger.error('Error checking connection health', { connectionId, error });
      handleApiError(error, 'Connection', connectionId);
    }
  }
}

// Export singleton instance
export const connectionService = new ConnectionService();
