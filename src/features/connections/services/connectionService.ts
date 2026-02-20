import api from '@/lib/api';
import { logger } from '@/lib/logger';
import { isAxiosError, ApiError, NotFoundError } from '@/lib/errors';
import type {
  PlatformConnection,
  ApiPlatformConnectionResponse,
  PlatformType,
  OAuthInitiationResponse,
  FacebookPagesResponse,
  WhatsAppAccountsResponse,
  ConnectPageRequest,
  ConnectPageResponse,
  ApiOAuthInitiationResponse,
  ApiFacebookPagesResponse,
  ApiWhatsAppAccountsResponse,
  ApiConnectPageResponse,
  ApiFacebookPage,
  ApiInstagramAccount,
  ApiWhatsAppBusinessAccount,
  ApiWhatsAppPhoneNumber,
  FacebookPage,
  InstagramAccount,
  WhatsAppBusinessAccount,
  WhatsAppPhoneNumber,
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
      codeVerificationStatus: apiConnection.code_verification_status ?? null,
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
   * Transform WhatsApp phone number from API response
   */
  private transformWhatsAppPhoneNumber(apiPhone: ApiWhatsAppPhoneNumber): WhatsAppPhoneNumber {
    return {
      id: apiPhone.id,
      displayPhoneNumber: apiPhone.display_phone_number,
      verifiedName: apiPhone.verified_name ?? null,
      qualityRating: apiPhone.quality_rating ?? null,
      businessAccountId: apiPhone.business_account_id ?? null,
      businessAccountName: apiPhone.business_account_name ?? null,
    };
  }

  /**
   * Transform WhatsApp Business Account from API response
   */
  private transformWhatsAppBusinessAccount(apiWaba: ApiWhatsAppBusinessAccount): WhatsAppBusinessAccount {
    return {
      id: apiWaba.id,
      name: apiWaba.name,
      phoneNumbers: (apiWaba.phone_numbers ?? []).map(phone =>
        this.transformWhatsAppPhoneNumber(phone)
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

      // Backend returns snake_case, transform to camelCase
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
   * Fetch available WhatsApp Business Accounts after OAuth authorization
   */
  async fetchAvailableWhatsAppAccounts(tempConnectionId: string): Promise<WhatsAppAccountsResponse> {
    try {
      const { data } = await api.get<ApiWhatsAppAccountsResponse>(
        API_PATHS.OAUTH_PAGES(tempConnectionId)
      );

      // Validate response format
      if (!data || !Array.isArray(data.whatsapp_accounts)) {
        logger.error('Invalid WhatsApp accounts response format', {
          tempConnectionId,
          receivedData: data,
          hasWhatsAppAccounts: !!data?.whatsapp_accounts,
          isArray: Array.isArray(data?.whatsapp_accounts)
        });

        // Return empty array instead of throwing error
        return {
          whatsAppAccounts: [],
          tempConnectionId,
        };
      }

      const whatsAppAccounts = data.whatsapp_accounts.map(waba =>
        this.transformWhatsAppBusinessAccount(waba)
      );

      logger.info('Fetched available WhatsApp accounts', {
        tempConnectionId,
        accountCount: whatsAppAccounts.length,
      });

      return {
        whatsAppAccounts,
        tempConnectionId,
      };
    } catch (error) {
      logger.error('Error fetching available WhatsApp accounts', { tempConnectionId, error });
      handleApiError(error, 'OAuth WhatsApp Accounts', tempConnectionId);
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
        ...(request.whatsAppPhoneNumberId && {
          whats_app_phone_number_id: request.whatsAppPhoneNumberId,
          whats_app_business_account_id: request.whatsAppBusinessAccountId,
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
