// ============================================================================
// API Types (snake_case - matches backend JSON serialization)
// ============================================================================

export interface ApiExamineTokenRequest {
  token: string;
}

export interface ApiTokenExaminationResult {
  basic_info: ApiBasicTokenInfo | null;
  whats_app_accounts: ApiWhatsAppAccount[];
  facebook_pages: ApiFacebookPage[];
  business_accounts: ApiBusinessAccount[];
}

export interface ApiBasicTokenInfo {
  is_valid: boolean;
  owner_id: string | null;
  owner_name: string | null;
  error: string | null;
  permissions: ApiTokenPermission[];
}

export interface ApiTokenPermission {
  permission: string;
  status: string; // "granted" or "declined"
}

export interface ApiWhatsAppAccount {
  id: string;
  name: string;
  timezone_id: string | null;
  message_template_namespace: string | null;
  account_review_status: string | null;
  business_verification_status: string | null;
  phone_numbers: ApiPhoneNumber[];
}

export interface ApiPhoneNumber {
  id: string;
  verified_name: string | null;
  display_phone_number: string;
  code_verification_status: string | null;
  quality_rating: string | null;
  platform_type: string | null;
  throughput_level: string | null;
  webhook_url: string | null;
  last_onboarded_time: string | null;
  // Detailed status fields
  messaging_limit_tier: string | null;
  account_mode: string | null; // LIVE or TEST
  status: string | null; // CONNECTED, PENDING, etc.
  is_official_business_account: boolean | null;
  name_status: string | null;
  certificate: string | null;
}

export interface ApiFacebookPage {
  id: string;
  name: string;
  category: string | null;
  tasks: string[];
  // Detailed page information
  about: string | null;
  phone: string | null;
  website: string | null;
  followers_count: number | null;
  fan_count: number | null;
  category_list: ApiCategory[];
}

export interface ApiCategory {
  id: string;
  name: string;
}

export interface ApiBusinessAccount {
  id: string;
  name: string;
}

// ============================================================================
// Frontend Types (camelCase - for use in React components)
// ============================================================================

export interface ExamineTokenRequest {
  token: string;
}

export interface TokenExaminationResult {
  basicInfo: BasicTokenInfo | null;
  whatsAppAccounts: WhatsAppAccount[];
  facebookPages: FacebookPage[];
  businessAccounts: BusinessAccount[];
}

export interface BasicTokenInfo {
  isValid: boolean;
  ownerId: string | null;
  ownerName: string | null;
  error: string | null;
  permissions: TokenPermission[];
}

export interface TokenPermission {
  permission: string;
  status: string; // "granted" or "declined"
}

export interface WhatsAppAccount {
  id: string;
  name: string;
  timezoneId: string | null;
  messageTemplateNamespace: string | null;
  accountReviewStatus: string | null;
  businessVerificationStatus: string | null;
  phoneNumbers: PhoneNumber[];
}

export interface PhoneNumber {
  id: string;
  verifiedName: string | null;
  displayPhoneNumber: string;
  codeVerificationStatus: string | null;
  qualityRating: string | null;
  platformType: string | null;
  throughputLevel: string | null;
  webhookUrl: string | null;
  lastOnboardedTime: Date | null;
  // Detailed status fields
  messagingLimitTier: string | null;
  accountMode: string | null; // LIVE or TEST
  status: string | null; // CONNECTED, PENDING, etc.
  isOfficialBusinessAccount: boolean | null;
  nameStatus: string | null;
  certificate: string | null;
}

export interface FacebookPage {
  id: string;
  name: string;
  category: string | null;
  tasks: string[];
  // Detailed page information
  about: string | null;
  phone: string | null;
  website: string | null;
  followersCount: number | null;
  fanCount: number | null;
  categoryList: Category[];
}

export interface Category {
  id: string;
  name: string;
}

export interface BusinessAccount {
  id: string;
  name: string;
}

// ============================================================================
// Enums & Constants
// ============================================================================

export const AccountReviewStatus = {
  APPROVED: 'APPROVED',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED',
} as const;

export const CodeVerificationStatus = {
  VERIFIED: 'VERIFIED',
  NOT_VERIFIED: 'NOT_VERIFIED',
} as const;

export const PlatformType = {
  CLOUD_API: 'CLOUD_API',
  ON_PREMISE: 'ON_PREMISE',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
} as const;
