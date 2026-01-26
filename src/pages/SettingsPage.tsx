/**
 * Mojeeb Settings Page
 * User profile management
 *
 * Features:
 * - Account information (avatar, name, email, phone)
 * - Password change modal
 * - Language preferences
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { BaseHeader } from '@/components/ui/BaseHeader';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { AvatarUploader } from '@/features/auth/components/AvatarUploader';
import {
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from '@/features/auth/hooks/useProfileMutations';
import type { UpdateProfileRequest, ChangePasswordRequest } from '@/features/auth/services/profileService';

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

      <div className="max-w-5xl space-y-6">
        {/* Profile Picture Card */}
        <Card className="p-6">
          <AvatarUploader
            layout="row"
            buttonVariant="secondary"
            buttonSize="md"
          />
        </Card>

        {/* Basic Information Card */}
        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                {t('settings.basicInfo')}
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                {t('settings.basicInfoSubtitle')}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={t('settings.name')}
                  placeholder={t('settings.namePlaceholder')}
                  autoComplete="name"
                  error={profileErrors.name?.message}
                  {...registerProfile('name', {
                    required: t('settings.nameRequired'),
                    maxLength: {
                      value: 100,
                      message: t('settings.nameTooLong'),
                    },
                  })}
                />

                <Input
                  label={t('settings.email')}
                  type="email"
                  value={user?.email || ''}
                  disabled
                  autoComplete="email"
                />

                <div className="sm:col-span-2">
                  <Input
                    label={t('settings.phone')}
                    placeholder={t('settings.phonePlaceholder')}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    error={profileErrors.phone?.message}
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
                  />
                </div>
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
          </div>
        </Card>

        {/* Change Password Card */}
        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                {t('settings.changePassword')}
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                {t('settings.changePasswordSubtitle')}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPasswordModal(true)}
            >
              {t('settings.changePassword')}
            </Button>
          </div>
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
          <Input
            label={t('settings.currentPassword')}
            type="password"
            placeholder={t('settings.currentPasswordPlaceholder')}
            autoComplete="current-password"
            error={passwordErrors.currentPassword?.message}
            {...registerPassword('currentPassword', {
              required: t('settings.currentPasswordRequired'),
            })}
          />

          <Input
            label={t('settings.newPassword')}
            type="password"
            placeholder={t('settings.newPasswordPlaceholder')}
            autoComplete="new-password"
            error={passwordErrors.newPassword?.message}
            {...registerPassword('newPassword', {
              required: t('settings.newPasswordRequired'),
              minLength: {
                value: 8,
                message: t('settings.newPasswordTooShort'),
              },
            })}
          />

          <Input
            label={t('settings.confirmPassword')}
            type="password"
            placeholder={t('settings.confirmPasswordPlaceholder')}
            autoComplete="new-password"
            error={passwordErrors.confirmPassword?.message}
            {...registerPassword('confirmPassword', {
              required: t('settings.confirmPasswordRequired'),
              validate: (value) =>
                value === newPassword || t('settings.passwordMismatch'),
            })}
          />

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
