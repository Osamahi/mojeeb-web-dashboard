/**
 * Assign User to Organization Modal
 * Single-page vertical form for SuperAdmin to assign users to organizations
 * Flow: Agent → User → Role → Confirm
 */

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { organizationService } from '../services/organizationService';
import { useAgentContext } from '@/hooks/useAgentContext';
import AgentSearchDropdown from './AgentSearchDropdown';
import UserSearchDropdown from './UserSearchDropdown';
import type { Agent } from '@/features/agents/types/agent.types';
import type { UserSearchResult } from '../types';

interface AssignUserToOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  organizationId?: string; // Optional: Use this organization ID instead of agent's organization
}

export default function AssignUserToOrgModal({
  isOpen,
  onClose,
  onSuccess,
  organizationId
}: AssignUserToOrgModalProps) {
  const { agent: globalAgent } = useAgentContext();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<'owner' | 'admin' | 'member'>('member');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-populate with global selected agent when modal opens
  // If organizationId is provided, we'll use it directly instead of requiring agent selection
  useEffect(() => {
    if (isOpen && !organizationId && globalAgent) {
      setSelectedAgent(globalAgent);
    }
  }, [isOpen, organizationId, globalAgent]);

  // Get the target organization ID (from prop or selected agent)
  const targetOrganizationId = organizationId || selectedAgent?.organizationId;

  // Check if user is in a different organization
  const userInDifferentOrg = selectedUser?.currentOrganization &&
    selectedUser.currentOrganization.id !== targetOrganizationId;

  const handleAssign = () => {
    // Check if all fields are filled
    // When organizationId prop is provided, agent selection is optional
    if (!targetOrganizationId || !selectedUser) {
      toast.error('Please fill all fields');
      return;
    }

    // Check if confirmation needed for cross-org assignment
    if (userInDifferentOrg) {
      setShowConfirmation(true);
    } else {
      handleSubmit(false);
    }
  };

  const handleSubmit = async (removeFromCurrent: boolean) => {
    if (!targetOrganizationId || !selectedUser) return;

    setIsSubmitting(true);
    try {
      await organizationService.assignUserToOrganization(
        targetOrganizationId,
        {
          userId: selectedUser.id,
          role: selectedRole,
          removeFromCurrent
        }
      );

      toast.success('User assigned successfully', {
        description: `${selectedUser.email} assigned to organization as ${selectedRole}`
      });

      // Reset and close
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to assign user:', error);

      // Backend returns { error: "message" } in ErrorResponse
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to assign user';

      if (errorMessage.includes('already a member')) {
        toast.error('User already in organization', {
          description: errorMessage
        });
      } else {
        toast.error('Failed to assign user', {
          description: errorMessage
        });
      }
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const handleClose = () => {
    setSelectedAgent(null);
    setSelectedUser(null);
    setSelectedRole('member');
    setShowConfirmation(false);
    setIsSubmitting(false);
    onClose();
  };

  const canSubmit = targetOrganizationId && selectedUser;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Assign User to Organization"
        subtitle="Select an agent, user, and role to complete the assignment"
        maxWidth="2xl"
        isLoading={isSubmitting}
        closable={!isSubmitting}
      >
        <div className="space-y-4">
            <div className="space-y-4">
              {/* Agent Selection - Only shown when organizationId is not provided */}
              {!organizationId && (
                <AgentSearchDropdown
                  selectedAgent={selectedAgent}
                  onAgentSelect={setSelectedAgent}
                />
              )}

              {/* User Selection */}
              <UserSearchDropdown
                selectedUser={selectedUser}
                onUserSelect={setSelectedUser}
                excludeOrganizationId={targetOrganizationId}
              />

              {/* Role Selection */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'owner' | 'admin' | 'member')}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
              >
                <option value="member">Member - Basic access to organization resources</option>
                <option value="admin">Admin - Can manage organization settings and members</option>
                <option value="owner">Owner - Full control over the organization</option>
              </select>

              {/* Summary Preview */}
              {targetOrganizationId && selectedUser && (
                <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <h4 className="font-medium text-neutral-900 mb-3">Assignment Summary</h4>
                  <div className="space-y-2 text-sm">
                    {selectedAgent && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Agent:</span>
                        <span className="text-neutral-900 font-medium">{selectedAgent.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-neutral-600">User:</span>
                      <span className="text-neutral-900 font-medium">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Role:</span>
                      <span className="text-neutral-900 font-medium capitalize">{selectedRole}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!canSubmit || isSubmitting}
                className="bg-brand-cyan hover:bg-brand-cyan/90"
              >
                {isSubmitting ? 'Assigning...' : 'Assign User'}
              </Button>
            </div>
          </div>
      </BaseModal>

      {/* Confirmation Dialog for Cross-Org Assignment */}
      <BaseModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="User Already in Organization"
        maxWidth="md"
        isLoading={isSubmitting}
        closable={!isSubmitting}
      >
        <div className="space-y-4">
          {/* Warning Icon */}
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-neutral-700 mb-2">
                This user is currently in <span className="font-medium">{selectedUser?.currentOrganization?.name}</span>.
              </p>
              <p className="text-neutral-700">
                Do you want to remove them from their current organization and assign them to the selected organization?
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmation(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? 'Moving...' : 'Yes, Move User'}
            </Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
