import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  profileService,
  type UpdateProfileRequest,
  type ChangePasswordRequest
} from '../services/profileService';
import type { User } from '../types/auth.types';

/**
 * Extract error message from Axios error or generic Error
 * Checks error.response.data.message first (backend error), then falls back to error.message
 */
function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    // Extract backend error message (e.g., "Current password is incorrect.")
    return error.response?.data?.message || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

/**
 * Hook for updating user profile (name, phone)
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<User, Error, UpdateProfileRequest>({
    mutationFn: (request: UpdateProfileRequest) => profileService.updateProfile(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      toast.success(t('settings.updateProfileSuccess'));
    },
    onError: (error: unknown) => {
      console.error('[useUpdateProfileMutation] Error:', error);
      const errorMessage = getErrorMessage(error, t('settings.updateProfileError'));
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook for uploading profile avatar
 */
export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<User, Error, File>({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: (updatedUser) => {
      console.log('🎉 [useUploadAvatarMutation] Upload mutation successful');
      console.log('   Updated User ID:', updatedUser.id);
      console.log('   Updated Avatar URL:', updatedUser.avatarUrl);

      console.log('🔄 [useUploadAvatarMutation] Invalidating queries with key: [user, me]');
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });

      toast.success(t('settings.uploadAvatarSuccess'));
    },
    onError: (error: unknown) => {
      console.error('[useUploadAvatarMutation] Error:', error);
      const errorMessage = getErrorMessage(error, t('settings.uploadAvatarError'));
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook for deleting profile avatar
 */
export function useDeleteAvatarMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<User, Error, void>({
    mutationFn: () => profileService.deleteAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      toast.success(t('settings.deleteAvatarSuccess'));
    },
    onError: (error: unknown) => {
      console.error('[useDeleteAvatarMutation] Error:', error);
      const errorMessage = getErrorMessage(error, t('settings.deleteAvatarError'));
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook for changing password
 */
export function useChangePasswordMutation() {
  const { t } = useTranslation();

  return useMutation<void, Error, ChangePasswordRequest>({
    mutationFn: (request: ChangePasswordRequest) => profileService.changePassword(request),
    onSuccess: () => {
      toast.success(t('settings.changePasswordSuccess'));
    },
    onError: (error: unknown) => {
      console.error('[useChangePasswordMutation] Error:', error);
      const errorMessage = getErrorMessage(error, t('settings.changePasswordError'));
      toast.error(errorMessage);
    },
  });
}
