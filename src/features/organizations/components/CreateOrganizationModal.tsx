/**
 * Create Organization Modal
 * Modal for creating new organizations with user search for owner selection
 * Refactored to use BaseModal component for consistency
 */

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Search, User as UserIcon, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { organizationService } from '../services/organizationService';
import { userService } from '@/features/users/services/userService';
import type { CreateOrganizationRequest } from '../types';
import type { User } from '@/features/users/types';

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateOrganizationModal({
  isOpen,
  onClose,
}: CreateOrganizationModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateOrganizationRequest>({
    name: '',
    contactEmail: '',
  });
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Fetch all users for owner selection
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    enabled: isOpen,
  });

  // Filter users based on search query (email, name, phone)
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return users;

    const query = userSearchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.email?.toLowerCase().includes(query) ||
        user.name?.toLowerCase()?.includes(query) ||
        user.phone?.toLowerCase()?.includes(query)
    );
  }, [users, userSearchQuery]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', contactEmail: '' });
      setSelectedOwner(null);
      setUserSearchQuery('');
      setShowUserDropdown(false);
    }
  }, [isOpen]);

  // Create organization mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateOrganizationRequest) => {
      // Add ownerId if owner is selected
      const requestData = selectedOwner
        ? { ...data, ownerId: selectedOwner.id }
        : data;

      await organizationService.createOrganization(requestData);
    },
    onSuccess: async () => {
      // Refetch organizations immediately to show new data
      await queryClient.refetchQueries({
        queryKey: ['organizations'],
        type: 'active'
      });

      toast.success(t('organizations.created_success'));
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('organizations.create_failed'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    if (!formData.name.trim()) {
      toast.error(t('organizations.name_required'));
      return;
    }

    // Validate email format if provided
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      toast.error(t('organizations.email_invalid'));
      return;
    }

    createMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserSelect = (user: User) => {
    setSelectedOwner(user);
    setUserSearchQuery(user.email || '');
    setShowUserDropdown(false);

    // Auto-populate contact email with owner's email
    if (user.email) {
      setFormData((prev) => ({ ...prev, contactEmail: user.email || '' }));
    }
  };

  const handleUserSearchFocus = () => {
    setShowUserDropdown(true);
  };

  const handleUserSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSearchQuery(e.target.value);
    setShowUserDropdown(true);
    // Clear selected owner when typing
    if (selectedOwner) {
      setSelectedOwner(null);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('organizations.create_title')}
      maxWidth="2xl"
      isLoading={createMutation.isPending}
      closable={!createMutation.isPending}
      contentClassName="space-y-6 px-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('organizations.name_label')} <span className="text-red-500">{t('common.required')}</span>
            </label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('organizations.name_placeholder')}
              required
              autoFocus
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('organizations.email_label')}
            </label>
            <Input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder={t('organizations.email_placeholder')}
            />
          </div>

          {/* Owner Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('organizations.owner_label')}
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
                <Input
                  type="text"
                  value={userSearchQuery}
                  onChange={handleUserSearchChange}
                  onFocus={handleUserSearchFocus}
                  placeholder={t('organizations.owner_search_placeholder')}
                  className="pl-10"
                />
                {selectedOwner && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                )}
              </div>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div className="absolute z-[100] w-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {isLoadingUsers ? (
                    <div className="p-4 text-center text-sm text-neutral-500">
                      {t('organizations.loading_users')}
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    <div className="py-2">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="w-full px-4 py-3 hover:bg-neutral-50 transition-colors flex items-center gap-3 text-left"
                        >
                          {user.avatar_url ? (
                            <Avatar src={user.avatar_url} name={user.name || user.email || 'User'} size="sm" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                              <UserIcon className="h-4 w-4 text-neutral-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-neutral-900 truncate">
                              {user.name || user.email}
                            </div>
                            <div className="text-sm text-neutral-500 truncate">
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-xs text-neutral-400 truncate">
                                {user.phone}
                              </div>
                            )}
                          </div>
                          {selectedOwner?.id === user.id && (
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-neutral-500">
                      {t('organizations.no_users_found')} "{userSearchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              {t('organizations.owner_search_help')}
            </p>
          </div>

          {/* Selected Owner Info */}
          {selectedOwner && (
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-3">
                {selectedOwner.avatar_url ? (
                  <Avatar src={selectedOwner.avatar_url} name={selectedOwner.name || selectedOwner.email || 'User'} size="md" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-neutral-600" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium text-neutral-900">
                    {selectedOwner.name || selectedOwner.email}
                  </div>
                  <div className="text-sm text-neutral-500">{selectedOwner.email}</div>
                  {selectedOwner.phone && (
                    <div className="text-sm text-neutral-500 mt-1">
                      {t('common.phone')}: {selectedOwner.phone}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOwner(null);
                    setUserSearchQuery('');
                  }}
                  className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-neutral-500" />
                </button>
              </div>
            </div>
          )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? t('organizations.creating') : t('organizations.create_organization')}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
