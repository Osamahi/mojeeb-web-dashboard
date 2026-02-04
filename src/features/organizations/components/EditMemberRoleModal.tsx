/**
 * Edit Member Role Modal
 * Allows organization owners/admins to change team member roles
 * Uses centralized authorization and Clean Architecture pattern
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { useUpdateMemberRole } from '../hooks/useUpdateMemberRole';
import { useOrganizationAuth } from '../hooks/useOrganizationAuth';
import type { OrganizationMember } from '../types';

interface EditMemberRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: OrganizationMember | null;
  organizationId: string;
}

export default function EditMemberRoleModal({
  isOpen,
  onClose,
  member,
  organizationId
}: EditMemberRoleModalProps) {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<'owner' | 'admin' | 'member'>('member');
  const updateRoleMutation = useUpdateMemberRole();
  const { canSelectRole } = useOrganizationAuth();

  // Initialize selected role when member changes
  useEffect(() => {
    if (member) {
      setSelectedRole(member.role);
    }
  }, [member]);

  const handleSubmit = () => {
    if (!member) return;

    // Check if role actually changed
    if (selectedRole === member.role) {
      onClose();
      return;
    }

    updateRoleMutation.mutate(
      {
        organizationId,
        userId: member.userId,
        newRole: selectedRole
      },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  const handleClose = () => {
    if (!updateRoleMutation.isPending) {
      setSelectedRole(member?.role || 'member');
      onClose();
    }
  };

  const roleOptions: Array<{ value: 'owner' | 'admin' | 'member'; label: string; description: string }> = [
    {
      value: 'owner',
      label: t('organizations.role_owner_label') || 'Owner',
      description: t('organizations.role_owner_description') || 'Full access to all organization settings and members'
    },
    {
      value: 'admin',
      label: t('organizations.role_admin_label') || 'Admin',
      description: t('organizations.role_admin_description') || 'Can manage members and organization settings'
    },
    {
      value: 'member',
      label: t('organizations.role_member_label') || 'Member',
      description: t('organizations.role_member_description') || 'Standard access to organization resources'
    }
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('organizations.edit_role_title') || 'Edit Member Role'}
      subtitle={member?.user?.email || ''}
      maxWidth="md"
      isLoading={updateRoleMutation.isPending}
      closable={!updateRoleMutation.isPending}
    >
      <div className="space-y-5">
        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-3">
            {t('organizations.edit_role_label') || 'Select Role'}
          </label>
          <div className="space-y-2">
            {roleOptions.map((option) => {
              const isDisabled = !canSelectRole(option.value);
              const isSelected = selectedRole === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => !isDisabled && setSelectedRole(option.value)}
                  disabled={isDisabled || updateRoleMutation.isPending}
                  className={`
                    w-full text-left p-4 border-2 rounded-lg transition-all
                    ${isSelected
                      ? 'border-brand-cyan bg-brand-cyan/5'
                      : isDisabled
                      ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed opacity-60'
                      : 'border-neutral-200 hover:border-neutral-300 cursor-pointer'
                    }
                    ${updateRoleMutation.isPending ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${isSelected ? 'text-brand-cyan' : 'text-neutral-900'}`}>
                          {option.label}
                        </p>
                        {isDisabled && (
                          <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                            {t('organizations.role_restricted') || 'Restricted'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Warning for owner promotion */}
        {selectedRole === 'owner' && member?.role !== 'owner' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>{t('organizations.edit_role_owner_warning') || 'Warning:'}</strong>{' '}
              {t('organizations.edit_role_owner_warning_text') || 'Promoting to owner gives full control over the organization.'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
            disabled={updateRoleMutation.isPending}
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={updateRoleMutation.isPending || selectedRole === member?.role}
            loading={updateRoleMutation.isPending}
          >
            {t('common.save') || 'Save Changes'}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
