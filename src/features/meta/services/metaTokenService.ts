/**
 * Meta Token Examiner service for validating and examining Meta platform access tokens.
 * Handles API calls to the admin meta-token endpoints.
 * SuperAdmin-only functionality.
 */

import api from '@/lib/api';
import type {
  TokenExaminationResult,
  ApiTokenExaminationResult,
  BasicTokenInfo,
  ApiBasicTokenInfo,
  TokenPermission,
  ApiTokenPermission,
  WhatsAppAccount,
  ApiWhatsAppAccount,
  PhoneNumber,
  ApiPhoneNumber,
  FacebookPage,
  ApiFacebookPage,
  Category,
  ApiCategory,
  BusinessAccount,
  ApiBusinessAccount,
} from '../types/metaToken.types';

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  timestamp: string;
}

class MetaTokenService {
  /**
   * Examine a Meta access token and retrieve comprehensive information.
   * Fetches token owner, WhatsApp Business Accounts, Facebook Pages, and Business accounts.
   * SuperAdmin-only endpoint.
   * @param token - The Meta access token to examine
   */
  async examineToken(token: string): Promise<TokenExaminationResult> {
    const response = await api.post<ApiResponse<ApiTokenExaminationResult>>(
      '/api/admin/meta-token/examine',
      { token }
    );

    // Transform snake_case API response to camelCase
    return this.transformExaminationResult(response.data.data);
  }

  /**
   * Transform examination result from snake_case to camelCase.
   */
  private transformExaminationResult(
    apiResult: ApiTokenExaminationResult
  ): TokenExaminationResult {
    return {
      basicInfo: apiResult.basic_info
        ? this.transformBasicInfo(apiResult.basic_info)
        : null,
      whatsAppAccounts: apiResult.whats_app_accounts.map((waba) =>
        this.transformWhatsAppAccount(waba)
      ),
      facebookPages: apiResult.facebook_pages.map((page) =>
        this.transformFacebookPage(page)
      ),
      businessAccounts: apiResult.business_accounts.map((business) =>
        this.transformBusinessAccount(business)
      ),
    };
  }

  /**
   * Transform basic token info from snake_case to camelCase.
   */
  private transformBasicInfo(apiInfo: ApiBasicTokenInfo): BasicTokenInfo {
    return {
      isValid: apiInfo.is_valid,
      ownerId: apiInfo.owner_id,
      ownerName: apiInfo.owner_name,
      error: apiInfo.error,
      permissions: apiInfo.permissions.map((perm) => this.transformPermission(perm)),
    };
  }

  /**
   * Transform token permission from snake_case to camelCase.
   */
  private transformPermission(apiPerm: ApiTokenPermission): TokenPermission {
    return {
      permission: apiPerm.permission,
      status: apiPerm.status,
    };
  }

  /**
   * Transform WhatsApp account from snake_case to camelCase.
   */
  private transformWhatsAppAccount(apiWaba: ApiWhatsAppAccount): WhatsAppAccount {
    return {
      id: apiWaba.id,
      name: apiWaba.name,
      timezoneId: apiWaba.timezone_id,
      messageTemplateNamespace: apiWaba.message_template_namespace,
      accountReviewStatus: apiWaba.account_review_status,
      businessVerificationStatus: apiWaba.business_verification_status,
      phoneNumbers: apiWaba.phone_numbers.map((phone) => this.transformPhoneNumber(phone)),
    };
  }

  /**
   * Transform phone number from snake_case to camelCase.
   */
  private transformPhoneNumber(apiPhone: ApiPhoneNumber): PhoneNumber {
    return {
      id: apiPhone.id,
      verifiedName: apiPhone.verified_name,
      displayPhoneNumber: apiPhone.display_phone_number,
      codeVerificationStatus: apiPhone.code_verification_status,
      qualityRating: apiPhone.quality_rating,
      platformType: apiPhone.platform_type,
      throughputLevel: apiPhone.throughput_level,
      webhookUrl: apiPhone.webhook_url,
      lastOnboardedTime: apiPhone.last_onboarded_time
        ? new Date(apiPhone.last_onboarded_time)
        : null,
      // Detailed status fields
      messagingLimitTier: apiPhone.messaging_limit_tier,
      accountMode: apiPhone.account_mode,
      status: apiPhone.status,
      isOfficialBusinessAccount: apiPhone.is_official_business_account,
      nameStatus: apiPhone.name_status,
      certificate: apiPhone.certificate,
    };
  }

  /**
   * Transform Facebook page from snake_case to camelCase.
   */
  private transformFacebookPage(apiPage: ApiFacebookPage): FacebookPage {
    return {
      id: apiPage.id,
      name: apiPage.name,
      category: apiPage.category,
      tasks: apiPage.tasks,
      // Detailed page information
      about: apiPage.about,
      phone: apiPage.phone,
      website: apiPage.website,
      followersCount: apiPage.followers_count,
      fanCount: apiPage.fan_count,
      categoryList: apiPage.category_list.map((cat) => this.transformCategory(cat)),
    };
  }

  /**
   * Transform category from snake_case to camelCase.
   */
  private transformCategory(apiCategory: ApiCategory): Category {
    return {
      id: apiCategory.id,
      name: apiCategory.name,
    };
  }

  /**
   * Transform business account from snake_case to camelCase.
   */
  private transformBusinessAccount(apiBusiness: ApiBusinessAccount): BusinessAccount {
    return {
      id: apiBusiness.id,
      name: apiBusiness.name,
    };
  }
}

export const metaTokenService = new MetaTokenService();
