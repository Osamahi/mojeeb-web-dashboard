// Platform types matching backend enum
export type PlatformType = 'web' | 'widget' | 'facebook' | 'instagram' | 'whatsapp' | 'tiktok' | 'twitter' | 'linkedin';

// OAuth connection types
export type OAuthIntegrationType = 'facebook' | 'instagram' | 'whatsapp';

export type InstagramAccount = {
  id: string;
  username: string;
  followerCount: number;
  profilePictureUrl: string | null;
};

export type FacebookPage = {
  id: string;
  name: string;
  category: string;
  followerCount: number;
  profilePictureUrl: string | null;
  accessToken: string;
  instagramAccounts: InstagramAccount[];
};

export type WhatsAppPhoneNumber = {
  id: string;
  displayPhoneNumber: string;
  verifiedName: string | null;
  qualityRating: string | null;
  businessAccountId: string | null;
  businessAccountName: string | null;
};

export type WhatsAppBusinessAccount = {
  id: string;
  name: string;
  phoneNumbers: WhatsAppPhoneNumber[];
};

export type OAuthInitiationResponse = {
  authorizationUrl: string;
  integrationType: string;
  agentId: string;
};

export type FacebookPagesResponse = {
  pages: FacebookPage[];
  tempConnectionId: string;
};

export type WhatsAppAccountsResponse = {
  whatsAppAccounts: WhatsAppBusinessAccount[];
  tempConnectionId: string;
};

export type ConnectPageRequest = {
  tempConnectionId: string;
  pageId: string;
  instagramAccountId?: string;
  instagramUsername?: string;
  whatsAppPhoneNumberId?: string;
  whatsAppBusinessAccountId?: string;
};

export type ConnectPageResponse = {
  success: boolean;
  connectionId: string;
  platform: string;
  message: string;
};

// API Response types for OAuth (snake_case from backend)
export interface ApiFacebookPage {
  id: string;
  name: string;
  category: string;
  follower_count: number;
  profile_picture_url?: string;
  access_token: string;
  instagram_accounts?: ApiInstagramAccount[];
}

export interface ApiInstagramAccount {
  id: string;
  username: string;
  follower_count: number;
  profile_picture_url?: string;
}

export interface ApiWhatsAppPhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name?: string;
  quality_rating?: string;
  business_account_id?: string;
  business_account_name?: string;
}

export interface ApiWhatsAppBusinessAccount {
  id: string;
  name: string;
  phone_numbers?: ApiWhatsAppPhoneNumber[];
}

export interface ApiOAuthInitiationResponse {
  authorization_url: string;
  integration_type: string;
  agent_id: string;
}

export interface ApiFacebookPagesResponse {
  pages: ApiFacebookPage[];
}

export interface ApiWhatsAppAccountsResponse {
  whatsapp_accounts: ApiWhatsAppBusinessAccount[];
}

export interface ApiConnectPageResponse {
  success: boolean;
  connection_id: string;
  platform: string;
  message: string;
}

export type PlatformConnection = {
  id: string;
  agentId: string;
  platform: PlatformType;
  platformAccountId: string;
  platformAccountName: string | null;
  platformAccountHandle: string | null;
  platformPictureUrl: string | null;
  parentPageId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  platformMetadata: Record<string, unknown> | null;
  codeVerificationStatus: string | null; // WhatsApp verification status
};

// API Response types (snake_case from backend)
export interface ApiPlatformConnectionResponse {
  id: string;
  agent_id: string;
  platform: string;
  platform_account_id: string;
  platform_account_name?: string;
  platform_account_handle?: string;
  platform_picture_url?: string;
  display_name?: string;
  follower_count?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_sync_at?: string | null;
  code_verification_status?: string | null; // WhatsApp verification status
  metadata?: {
    parent_page_id?: string;
    follower_count?: number;
    configuration_id?: string;
    integration_type?: string;
    parent_page_name?: string;
    facebook_page_id?: string;
    facebook_page_name?: string;
    business_category?: string;
    [key: string]: unknown;
  };
}

// Platform display configuration
export const PLATFORM_CONFIG: Record<PlatformType, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  web: {
    label: 'Web',
    color: '#374151',
    bgColor: '#F3F4F6',
  },
  widget: {
    label: 'Widget',
    color: '#1D4ED8',
    bgColor: '#DBEAFE',
  },
  facebook: {
    label: 'Facebook',
    color: '#1877F2',
    bgColor: '#E7F3FF',
  },
  instagram: {
    label: 'Instagram',
    color: '#E4405F',
    bgColor: '#FCE7EB',
  },
  whatsapp: {
    label: 'WhatsApp',
    color: '#25D366',
    bgColor: '#E8F8EE',
  },
  tiktok: {
    label: 'TikTok',
    color: '#000000',
    bgColor: '#F3F4F6',
  },
  twitter: {
    label: 'Twitter/X',
    color: '#1DA1F2',
    bgColor: '#E8F6FE',
  },
  linkedin: {
    label: 'LinkedIn',
    color: '#0A66C2',
    bgColor: '#E8F0FE',
  },
};
