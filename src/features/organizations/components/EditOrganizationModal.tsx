/**
 * Edit Organization Modal
 * Modal for editing organization details with owner change support
 * Refactored to use BaseModal component for consistency
 */

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, User as UserIcon, Bot, Search, Check, UserPlus, Trash2, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import AssignUserToOrgModal from './AssignUserToOrgModal';
import { organizationService } from '../services/organizationService';
import { userService } from '@/features/users/services/userService';
import { agentService } from '@/features/agents/services/agentService';
import type { Organization, UpdateOrganizationRequest, OrganizationMember } from '../types';
import type { User } from '@/features/users/types';

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
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdateOrganizationRequest>({
    name: '',
    contactEmail: '',
  });
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Team members state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<OrganizationMember & { user?: { name: string | null; email: string | null; phone?: string | null } } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Fetch all users for owner selection
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    enabled: isOpen,
  });

  // Fetch owner information
  const { data: owner, isLoading: isLoadingOwner } = useQuery({
    queryKey: ['user', organization?.ownerId],
    queryFn: () => userService.getUserByIdFromApi(organization!.ownerId),
    enabled: !!organization?.ownerId && isOpen,
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

  // Initialize form data and owner when organization changes
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        contactEmail: organization.contactEmail || '',
      });
    }
    if (owner) {
      setSelectedOwner(owner);
      setUserSearchQuery(owner.email || '');
    }
  }, [organization, owner]);

  // Fetch agents for this organization
  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents', 'organization', organization?.id],
    queryFn: () => agentService.getAgentsByOrganization(organization!.id),
    enabled: !!organization?.id && isOpen,
  });

  // Fetch organization members
  const { data: members = [], isLoading: isLoadingMembers, refetch: refetchMembers } = useQuery({
    queryKey: ['organization-members', organization?.id],
    queryFn: () => organizationService.getOrganizationMembers(organization!.id),
    enabled: !!organization?.id && isOpen,
  });

  // Enrich members with user details
  const enrichedMembers = useMemo(() => {
    return members.map(member => {
      const user = users.find(u => u.id === member.userId);
      return {
        ...member,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        } : undefined
      };
    });
  }, [members, users]);

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

      toast.success('Organization updated successfully');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update organization');
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

  const handleUserSelect = (user: User) => {
    setSelectedOwner(user);
    setUserSearchQuery(user.email || '');
    setShowUserDropdown(false);

    // Auto-populate contact email with new owner's email
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
  };

  // Team member handlers
  const handleOpenAssignModal = () => {
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
  };

  const handleAssignSuccess = () => {
    refetchMembers(); // Refresh the members list
    toast.success('Member list updated');
  };

  const handleRemoveMember = (member: OrganizationMember & { user?: { name: string | null; email: string | null; phone?: string | null } }) => {
    setMemberToRemove(member);
    setIsConfirmDialogOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!organization?.id || !memberToRemove) return;

    setIsRemoving(true);
    try {
      await organizationService.removeUserFromOrganization(organization.id, memberToRemove.userId);
      toast.success('Member removed successfully');
      refetchMembers();
      setIsConfirmDialogOpen(false);
      setMemberToRemove(null);
    } catch (error) {
      toast.error('Failed to remove member');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCloseConfirmDialog = () => {
    if (!isRemoving) {
      setIsConfirmDialogOpen(false);
      setMemberToRemove(null);
    }
  };

  if (!organization) return null;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Organization"
        maxWidth="2xl"
        isLoading={updateMutation.isPending}
        closable={!updateMutation.isPending}
        contentClassName="space-y-4 px-6"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Organization Name *
            </label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter organization name"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Contact Email
            </label>
            <Input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="contact@organization.com"
            />
          </div>

          {/* Owner Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Owner
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
                <Input
                  type="text"
                  value={userSearchQuery}
                  onChange={handleUserSearchChange}
                  onFocus={handleUserSearchFocus}
                  placeholder="Search by email, name, or phone..."
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
                      Loading users...
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
                      No users found matching "{userSearchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Search and select a user to change the organization owner
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
                      Phone: {selectedOwner.phone}
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
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              Agents ({agents.length})
            </label>
            {isLoadingAgents ? (
              <div className="p-4 bg-neutral-50 rounded-lg animate-pulse">
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              </div>
            ) : agents.length > 0 ? (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-neutral-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-900 truncate">
                          {agent.name}
                        </div>
                        {agent.description && (
                          <div className="text-xs text-neutral-500 truncate">
                            {agent.description}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {agent.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-neutral-50 rounded-lg text-sm text-neutral-500 text-center">
                No agents in this organization
              </div>
            )}
          </div>

          {/* Team Members Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-neutral-700">
                Team Members ({enrichedMembers.length})
              </label>
              <button
                type="button"
                onClick={handleOpenAssignModal}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand-cyan hover:bg-brand-cyan/10 rounded-lg transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Add Member
              </button>
            </div>
            {isLoadingMembers ? (
              <div className="p-4 bg-neutral-50 rounded-lg animate-pulse">
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              </div>
            ) : enrichedMembers.length > 0 ? (
              <div className="max-h-60 overflow-y-auto border border-neutral-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {enrichedMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900">
                            {member.user?.name || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <Mail className="h-3 w-3" />
                            {member.user?.email || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            member.role === 'owner'
                              ? 'bg-purple-100 text-purple-800'
                              : member.role === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-neutral-100 text-neutral-800'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <Calendar className="h-3 w-3" />
                            {new Date(member.joinedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member)}
                            className="text-red-600 hover:text-red-800 transition-colors p-2"
                            title="Remove member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-neutral-50 rounded-lg text-sm text-neutral-500 text-center">
                No team members. Click "Add Member" to assign users.
              </div>
            )}
          </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            isLoading={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
      </BaseModal>

      {/* Assign User Modal */}
      <AssignUserToOrgModal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        onSuccess={handleAssignSuccess}
        organizationId={organization.id}
      />

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={confirmRemoveMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.user?.name || memberToRemove?.user?.email || 'this member'} from the organization?\n\nThis action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        isLoading={isRemoving}
      />
    </>
  );
}
