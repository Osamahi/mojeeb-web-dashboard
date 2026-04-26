/**
 * Edit Organization Modal
 * Modal for editing organization details with owner change support
 * Refactored to use BaseModal component for consistency
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, User as UserIcon, Search, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { isToastHandled } from '@/lib/errors';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import { OrganizationAgentsList } from './OrganizationAgentsList';
import { OrganizationMembersList } from './OrganizationMembersList';
import { organizationService } from '../services/organizationService';
import { userService } from '@/features/users/services/userService';
import type { Organization, UpdateOrganizationRequest, UserSearchResult } from '../types';

interface EditOrganizationModalProps {
  organization: Organization | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditOrganizationModal({
  organization,
  isOpen,
  onClose,
}: EditOrganizationModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdateOrganizationRequest>({
    name: '',
    contactEmail: '',
  });
  const [selectedOwner, setSelectedOwner] = useState<UserSearchResult | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Fetch existing owner so we can show the chip on open. The User → UserSearchResult
  // shape adapter drops avatar_url and currentOrganization (we don't need them here).
  const { data: owner } = useQuery({
    queryKey: ['user', organization?.ownerId],
    queryFn: () => userService.getUserByIdFromApi(organization!.ownerId),
    enabled: !!organization?.ownerId && isOpen,
  });

  // Debounce search input (300ms — matches UserPickerField).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(userSearchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [userSearchQuery]);

  // Server-side fuzzy search. The query is suppressed when the input still matches
  // the selected owner's email — otherwise we'd issue a search the moment the modal
  // opens and prefills with the current owner.
  const isSearchingForNewOwner =
    debouncedQuery.length >= 2 &&
    (!selectedOwner || debouncedQuery !== (selectedOwner.email ?? '').trim());

  const { data: filteredUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['user-search', debouncedQuery],
    queryFn: () => organizationService.searchUsers(debouncedQuery),
    enabled: isOpen && isSearchingForNewOwner,
    staleTime: 30_000,
  });

  // Initialize form data and owner when organization changes
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        contactEmail: organization.contactEmail || '',
      });
    }
    if (owner) {
      setSelectedOwner({
        id: owner.id,
        email: owner.email ?? '',
        name: owner.name,
        phone: owner.phone ?? null,
        currentOrganization: null,
      });
      setUserSearchQuery(owner.email || '');
    }
  }, [organization, owner]);

  // Update organization mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateOrganizationRequest) => {
      if (!organization) throw new Error('No organization selected');

      // Add ownerId if owner was changed
      const requestData = selectedOwner
        ? { ...data, ownerId: selectedOwner.id }
        : data;

      await organizationService.updateOrganization(organization.id, requestData);
    },
    onSuccess: async () => {
      // Refetch all organization-related queries immediately
      await queryClient.refetchQueries({
        queryKey: ['organizations'],
        type: 'active'
      });

      // Invalidate other related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user', organization?.ownerId] }),
        queryClient.invalidateQueries({ queryKey: ['agents', 'organization', organization?.id] }),
      ]);

      toast.success(t('organizations.updated_success'));
      onClose();
    },
    onError: (error: Error) => {
      if (!isToastHandled(error)) toast.error(error.message || t('organizations.update_failed'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedOwner(user);
    setUserSearchQuery(user.email || '');
    setShowUserDropdown(false);

    // Auto-populate contact email with new owner's email
    if (user.email) {
      setFormData((prev) => ({ ...prev, contactEmail: user.email }));
    }
  };

  const handleUserSearchFocus = () => {
    setShowUserDropdown(true);
  };

  const handleUserSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSearchQuery(e.target.value);
    setShowUserDropdown(true);
  };

  if (!organization) return null;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={t('organizations.edit_title')}
        maxWidth="2xl"
        isLoading={updateMutation.isPending}
        closable={!updateMutation.isPending}
        contentClassName="space-y-4 px-6"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('organizations.name_label')} {t('common.required')}
            </label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder={t('organizations.name_placeholder')}
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
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
                  {!isSearchingForNewOwner ? (
                    <div className="p-4 text-center text-sm text-neutral-500">
                      {t('organizations.owner_change_help')}
                    </div>
                  ) : isLoadingUsers ? (
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
                          <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-4 w-4 text-neutral-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-neutral-900 truncate">
                              {user.name || user.email}
                            </div>
                            <div className="text-sm text-neutral-500 truncate">
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-xs text-neutral-400 truncate">
                                <PhoneNumber value={user.phone} />
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
              {t('organizations.owner_change_help')}
            </p>
          </div>

          {/* Selected Owner Info */}
          {selectedOwner && (
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-neutral-900">
                    {selectedOwner.name || selectedOwner.email}
                  </div>
                  <div className="text-sm text-neutral-500">{selectedOwner.email}</div>
                  {selectedOwner.phone && (
                    <div className="text-sm text-neutral-500 mt-1">
                      {t('common.phone')}: <PhoneNumber value={selectedOwner.phone} />
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

          {/* Agents List */}
          <OrganizationAgentsList organizationId={organization.id} enabled={isOpen} />

          {/* Team Members */}
          <OrganizationMembersList organizationId={organization.id} enabled={isOpen} />

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            isLoading={updateMutation.isPending}
          >
            {updateMutation.isPending ? t('organizations.saving') : t('organizations.save_changes')}
          </Button>
        </div>
      </form>
      </BaseModal>
    </>
  );
}
