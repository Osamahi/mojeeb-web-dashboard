// Platform types matching backend enum
export type PlatformType = 'web' | 'widget' | 'facebook' | 'instagram' | 'whatsapp' | 'tiktok' | 'twitter' | 'linkedin';

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
};

export type ConnectionHealthStatus = {
  tokenValid: boolean;
  tokenExpiresAt: string | null;
  daysUntilExpiry: number | null;
  webhookSubscriptionActive: boolean;
  permissions: string[];
  error: string | null;
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

export interface ApiConnectionHealthResponse {
  is_healthy: boolean;
  status: string;
  message: string;
  expires_at: string | null;
  token_check_raw_json?: string;
  subscription_check_raw_json?: string;
  token_check_request_url?: string;
  subscription_check_request_url?: string;
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
