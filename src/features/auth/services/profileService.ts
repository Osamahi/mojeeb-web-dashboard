import api from '@/lib/api';
import type { User } from '../types/auth.types';
import { useAuthStore } from '../stores/authStore';

// API Response Types (snake_case from backend)
interface ApiUserResponse {
  id: string;
  email: string;
  name: string;
  role: number;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  o_auth_provider?: string;
  o_auth_provider_user_id?: string;
}

// Profile update request
export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
}

// Change password request (for internal use - camelCase)
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Change password API request (snake_case for backend)
interface ChangePasswordApiRequest {
  current_password: string;
  new_password: string;
}

// Profile update response from backend (snake_case)
interface UpdateProfileResponse {
  user: ApiUserResponse;
  message: string;
}

// Profile completion response from backend
export interface ProfileCompletionResponse {
  isComplete: boolean;
  hasPhone: boolean;
  phone?: string;
}

class ProfileService {
  /**
   * Transform API user response (snake_case) to User type (camelCase)
   * @private
   */
  private transformUser(apiUser: ApiUserResponse): User {
    return {
      id: apiUser.id,
      email: apiUser.email,
      name: apiUser.name,
      role: apiUser.role,
      phone: apiUser.phone,
      avatarUrl: apiUser.avatar_url,
      createdAt: apiUser.created_at,
      updatedAt: apiUser.updated_at,
      oauthProvider: apiUser.o_auth_provider,
      oauthProviderUserId: apiUser.o_auth_provider_user_id,
    };
  }

  /**
   * Update user profile (name, phone)
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const { data: response } = await api.put<UpdateProfileResponse>('/api/auth/profile', data);

    // Transform API response from snake_case to camelCase
    const user = this.transformUser(response.user);

    // Update auth store with new user data
    useAuthStore.getState().setUser(user);

    return user;
  }

  /**
   * Update user phone number only
   */
  async updatePhone(phone: string): Promise<User> {
    return this.updateProfile({ phone });
  }

  /**
   * Check if user profile is complete (has phone)
   */
  async getProfileCompletion(): Promise<ProfileCompletionResponse> {
    const { data } = await api.get<ProfileCompletionResponse>('/api/auth/profile/completion');
    return data;
  }

  /**
   * Check if current user has phone number
   */
  hasPhone(): boolean {
    const user = useAuthStore.getState().user;
    return !!(user?.phone && user.phone.trim() !== '');
  }

  /**
   * Upload profile avatar (with optional compression)
   * Max size: 5MB, Allowed types: JPEG, PNG, WebP
   */
  async uploadAvatar(file: File): Promise<User> {
    console.log('🖼️ [ProfileService.uploadAvatar] Starting upload');
    console.log('   File name:', file.name);
    console.log('   File size:', (file.size / 1024).toFixed(2), 'KB');
    console.log('   File type:', file.type);

    // Validate file before upload
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed');
    }

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('file', file);

    console.log('📤 [ProfileService.uploadAvatar] Sending POST to /api/auth/profile/avatar');
    const { data: apiResponse } = await api.post<ApiUserResponse>('/api/auth/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('✅ [ProfileService.uploadAvatar] Upload successful');
    console.log('   API Response (snake_case):', apiResponse);
    console.log('   API avatar_url:', apiResponse.avatar_url);

    // Transform API response from snake_case to camelCase
    console.log('🔄 [ProfileService.uploadAvatar] Transforming API response to camelCase');
    const user = this.transformUser(apiResponse);

    console.log('   Transformed User ID:', user.id);
    console.log('   Transformed avatarUrl:', user.avatarUrl);
    console.log('   Avatar URL length:', user.avatarUrl?.length || 0);

    // Update auth store with new user data
    console.log('💾 [ProfileService.uploadAvatar] Updating auth store with new user data');
    useAuthStore.getState().setUser(user);

    const storeUser = useAuthStore.getState().user;
    console.log('🔍 [ProfileService.uploadAvatar] Verification - User in store after update:');
    console.log('   Store User ID:', storeUser?.id);
    console.log('   Store Avatar URL:', storeUser?.avatarUrl);
    console.log('   URLs match:', storeUser?.avatarUrl === user.avatarUrl);

    return user;
  }

  /**
   * Delete profile avatar
   */
  async deleteAvatar(): Promise<User> {
    const { data: apiResponse } = await api.delete<ApiUserResponse>('/api/auth/profile/avatar');

    // Transform API response from snake_case to camelCase
    const user = this.transformUser(apiResponse);

    // Update auth store with new user data
    useAuthStore.getState().setUser(user);

    return user;
  }

  /**
   * Change user password
   */
  async changePassword(request: ChangePasswordRequest): Promise<void> {
    // Transform camelCase to snake_case for backend
    const apiRequest: ChangePasswordApiRequest = {
      current_password: request.currentPassword,
      new_password: request.newPassword,
    };

    await api.post('/api/auth/change-password', apiRequest);
  }
}

export const profileService = new ProfileService();
