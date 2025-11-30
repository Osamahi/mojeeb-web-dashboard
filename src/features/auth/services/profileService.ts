import api from '@/lib/api';
import type { User } from '../types/auth.types';
import { useAuthStore } from '../stores/authStore';

// Profile update request
export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
}

// Profile update response from backend
interface UpdateProfileResponse {
  user: User;
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
   * Update user profile (name, phone)
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const { data: response } = await api.put<UpdateProfileResponse>('/api/auth/profile', data);

    // Update auth store with new user data
    useAuthStore.getState().setUser(response.user);

    return response.user;
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
}

export const profileService = new ProfileService();
