import api from '@/lib/api';
import { logger } from '@/lib/logger';
import { isAxiosError, ApiError, NotFoundError } from '@/lib/errors';
import type {
  PlatformConnection,
  ConnectionHealthStatus,
  ApiPlatformConnectionResponse,
  ApiConnectionHealthResponse,
  PlatformType,
  OAuthInitiationResponse,
  FacebookPagesResponse,
  ConnectPageRequest,
  ConnectPageResponse,
  ApiOAuthInitiationResponse,
  ApiFacebookPagesResponse,
  ApiConnectPageResponse,
  ApiFacebookPage,
  ApiInstagramAccount,
  FacebookPage,
  InstagramAccount,
  OAuthIntegrationType,
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

  // ==================== OAuth Methods ====================

  /**
   * Transform Instagram account from API response
   */
  private transformInstagramAccount(apiAccount: ApiInstagramAccount): InstagramAccount {
    return {
      id: apiAccount.id,
      username: apiAccount.username,
      followerCount: apiAccount.follower_count,
      profilePictureUrl: apiAccount.profile_picture_url ?? null,
    };
  }

  /**
   * Transform Facebook page from API response
   */
  private transformFacebookPage(apiPage: ApiFacebookPage): FacebookPage {
    return {
      id: apiPage.id,
      name: apiPage.name,
      category: apiPage.category,
      followerCount: apiPage.follower_count,
      profilePictureUrl: apiPage.profile_picture_url ?? null,
      accessToken: apiPage.access_token,
      instagramAccounts: (apiPage.instagram_accounts ?? []).map(account =>
        this.transformInstagramAccount(account)
      ),
    };
  }

  /**
   * Initiate Facebook/Instagram OAuth flow
   * Returns the authorization URL to redirect the user to
   */
  async initiateFacebookOAuth(
    agentId: string,
    integrationType: OAuthIntegrationType = 'facebook'
  ): Promise<OAuthInitiationResponse> {
    try {
      const { data } = await api.get<ApiOAuthInitiationResponse>(API_PATHS.OAUTH_AUTHORIZE, {
        params: { agentId, integrationType },
      });

      logger.info('OAuth flow initiated', { agentId, integrationType });

      // Transform from snake_case to camelCase
      return {
        authorizationUrl: data.authorization_url,
        integrationType: data.integration_type,
        agentId: data.agent_id,
      };
    } catch (error) {
      logger.error('Error initiating OAuth flow', { agentId, integrationType, error });
      handleApiError(error, 'OAuth', agentId);
    }
  }

  /**
   * Fetch available Facebook pages after OAuth authorization
   */
  async fetchAvailablePages(tempConnectionId: string): Promise<FacebookPagesResponse> {
    try {
      const { data } = await api.get<ApiFacebookPagesResponse>(
        API_PATHS.OAUTH_PAGES(tempConnectionId)
      );

      const pages = data.pages.map(page => this.transformFacebookPage(page));

      logger.info('Fetched available pages', {
        tempConnectionId,
        pageCount: pages.length,
      });

      return {
        pages,
        tempConnectionId,
      };
    } catch (error) {
      logger.error('Error fetching available pages', { tempConnectionId, error });
      handleApiError(error, 'OAuth Pages', tempConnectionId);
    }
  }

  /**
   * Connect a selected Facebook page (and optionally Instagram account)
   */
  async connectSelectedPage(request: ConnectPageRequest): Promise<ConnectPageResponse> {
    try {
      logger.info('🔗 [connectSelectedPage] Starting page connection', {
        request: {
          tempConnectionId: request.tempConnectionId,
          pageId: request.pageId,
          instagramAccountId: request.instagramAccountId,
          instagramUsername: request.instagramUsername,
        },
      });

      // Backend uses snake_case for JSON serialization (Newtonsoft.Json with SnakeCaseNamingStrategy)
      const payload = {
        temp_connection_id: request.tempConnectionId,
        page_id: request.pageId,
        ...(request.instagramAccountId && {
          instagram_account_id: request.instagramAccountId,
          instagram_username: request.instagramUsername,
        }),
      };

      logger.info('📤 [connectSelectedPage] Sending API request', {
        endpoint: API_PATHS.OAUTH_CONNECT_PAGE,
        payload,
        payloadKeys: Object.keys(payload),
        payloadStringified: JSON.stringify(payload),
      });

      const { data } = await api.post<ApiConnectPageResponse>(API_PATHS.OAUTH_CONNECT_PAGE, payload);

      logger.info('✅ [connectSelectedPage] Page connected successfully', {
        response: data,
        connectionId: data.connection_id,
        platform: data.platform,
        message: data.message,
      });

      return {
        success: data.success,
        connectionId: data.connection_id,
        platform: data.platform,
        message: data.message,
      };
    } catch (error: any) {
      logger.error('❌ [connectSelectedPage] Error connecting page', {
        request,
        error,
        errorMessage: error?.message,
        errorResponse: error?.response?.data,
        errorStatus: error?.response?.status,
        errorConfig: {
          url: error?.config?.url,
          method: error?.config?.method,
          data: error?.config?.data,
        },
      });
      handleApiError(error, 'Connection', request.pageId);
    }
  }
}

// Export singleton instance
export const connectionService = new ConnectionService();
