/**
 * Mojeeb Settings Page
 * User profile management
 *
 * Features:
 * - Account information (avatar, name, email, phone)
 * - Password change modal
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { AvatarUploader } from '@/features/auth/components/AvatarUploader';
import {
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from '@/features/auth/hooks/useProfileMutations';
import type { UpdateProfileRequest, ChangePasswordRequest } from '@/features/auth/services/profileService';
import { cn } from '@/lib/utils';

export const SettingsPage = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  useDocumentTitle('pages.title_settings');

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const updateProfileMutation = useUpdateProfileMutation();
  const changePasswordMutation = useChangePasswordMutation();

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<UpdateProfileRequest>({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
    watch,
  } = useForm<ChangePasswordRequest & { confirmPassword: string }>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  // Profile update handler
  const onProfileSubmit = async (data: UpdateProfileRequest) => {
    await updateProfileMutation.mutateAsync(data);
  };

  // Password change handler
  const onPasswordSubmit = async (data: ChangePasswordRequest & { confirmPassword: string }) => {
    const { confirmPassword, ...passwordData } = data;
    await changePasswordMutation.mutateAsync(passwordData);
    resetPasswordForm();
    setShowPasswordModal(false);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <BaseHeader
        title={t('pages.settings')}
        subtitle={t('pages.settings_subtitle')}
      />

      <div className="max-w-2xl space-y-6">
        {/* Account Information Card */}
        <Card className="p-6">
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
            {/* Profile Picture Section */}
            <div className="pb-6 border-b border-neutral-200">
              <AvatarUploader />
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('settings.name')}
              </label>
              <input
                {...registerProfile('name', {
                  required: t('settings.nameRequired'),
                  maxLength: {
                    value: 100,
                    message: t('settings.nameTooLong'),
                  },
                })}
                type="text"
                className={cn(
                  'w-full h-10 px-4 rounded-md border transition-colors',
                  'bg-white text-neutral-950 placeholder:text-neutral-400 text-base',
                  'focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan',
                  profileErrors.name ? 'border-red-500' : 'border-neutral-300'
                )}
                placeholder={t('settings.namePlaceholder')}
              />
              {profileErrors.name && (
                <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
              )}
            </div>

            {/* Email Input (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('settings.email')}
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full h-10 px-4 rounded-md border border-neutral-300 bg-neutral-50 text-neutral-500 cursor-not-allowed text-base"
              />
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('settings.phone')}
              </label>
              <input
                {...registerProfile('phone', {
                  pattern: {
                    value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
                    message: t('settings.phoneInvalid'),
                  },
                  maxLength: {
                    value: 20,
                    message: t('settings.phoneTooLong'),
                  },
                })}
                type="tel"
                className={cn(
                  'w-full h-10 px-4 rounded-md border transition-colors',
                  'bg-white text-neutral-950 placeholder:text-neutral-400 text-base',
                  'focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan',
                  profileErrors.phone ? 'border-red-500' : 'border-neutral-300'
                )}
                placeholder={t('settings.phonePlaceholder')}
              />
              {profileErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{profileErrors.phone.message}</p>
              )}
            </div>

            {/* Change Password Link */}
            <div className="pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordModal(true)}
                className="px-0"
              >
                {t('settings.changePassword')}
              </Button>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={updateProfileMutation.isPending}
                isLoading={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Change Password Modal */}
      <BaseModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          resetPasswordForm();
        }}
        title={t('settings.changePassword')}
        subtitle={t('settings.changePasswordSubtitle')}
        maxWidth="md"
        isLoading={changePasswordMutation.isPending}
        closable={!changePasswordMutation.isPending}
      >
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('settings.currentPassword')}
            </label>
            <input
              {...registerPassword('currentPassword', {
                required: t('settings.currentPasswordRequired'),
              })}
              type="password"
              className={cn(
                'w-full h-10 px-4 rounded-md border transition-colors',
                'bg-white text-neutral-950 placeholder:text-neutral-400 text-base',
                'focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan',
                passwordErrors.currentPassword ? 'border-red-500' : 'border-neutral-300'
              )}
              placeholder={t('settings.currentPasswordPlaceholder')}
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('settings.newPassword')}
            </label>
            <input
              {...registerPassword('newPassword', {
                required: t('settings.newPasswordRequired'),
                minLength: {
                  value: 8,
                  message: t('settings.newPasswordTooShort'),
                },
              })}
              type="password"
              className={cn(
                'w-full h-10 px-4 rounded-md border transition-colors',
                'bg-white text-neutral-950 placeholder:text-neutral-400 text-base',
                'focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan',
                passwordErrors.newPassword ? 'border-red-500' : 'border-neutral-300'
              )}
              placeholder={t('settings.newPasswordPlaceholder')}
            />
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('settings.confirmPassword')}
            </label>
            <input
              {...registerPassword('confirmPassword', {
                required: t('settings.confirmPasswordRequired'),
                validate: (value) =>
                  value === newPassword || t('settings.passwordMismatch'),
              })}
              type="password"
              className={cn(
                'w-full h-10 px-4 rounded-md border transition-colors',
                'bg-white text-neutral-950 placeholder:text-neutral-400 text-base',
                'focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan',
                passwordErrors.confirmPassword ? 'border-red-500' : 'border-neutral-300'
              )}
              placeholder={t('settings.confirmPasswordPlaceholder')}
            />
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
            )}
          </div>

          {/* Modal Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowPasswordModal(false);
                resetPasswordForm();
              }}
              disabled={changePasswordMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={changePasswordMutation.isPending}
              isLoading={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? t('common.changing') : t('settings.changePasswordButton')}
            </Button>
          </div>
        </form>
      </BaseModal>
    </div>
  );
};
