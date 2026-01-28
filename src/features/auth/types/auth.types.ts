// User roles from backend
// Union type for type checking
export type RoleValue = 0 | 1 | 2 | 3 | 4 | 5;

// Runtime constants object (replaces enum for erasableSyntaxOnly compatibility)
export const Role = {
  SuperAdmin: 0,
  Admin: 1,
  Customer: 2,
  AiAgent: 3,
  HumanAgent: 4,
  System: 5,
} as const;

// Type helper for role names
export type RoleName = keyof typeof Role;

// User model
export interface User {
  id: string;
  email: string;
  name: string;
  role: RoleValue;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  oauthProvider?: string;
  oauthProviderUserId?: string;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data
export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

// Auth response from API
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Token refresh request
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Password reset request
export interface ForgotPasswordRequest {
  email: string;
}

// Password reset execution
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Change password request
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// Post-authentication navigation types
export type NavigationDestination = '/onboarding' | '/conversations';
export type NavigationReason = 'no_agents' | 'has_invitations' | 'has_agents';

export interface PostAuthNavigationResult {
  destination: NavigationDestination;
  reason: NavigationReason;
}
