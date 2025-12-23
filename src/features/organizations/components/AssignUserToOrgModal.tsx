/**
 * Assign User to Organization Modal
 * Single-page vertical form for SuperAdmin to assign users to organizations
 * Flow: Agent → User → Role → Confirm
 */

import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full pointer-events-auto max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Assign User to Organization
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Select an agent, user, and role to complete the assignment
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5 text-neutral-500" />
            </button>
          </div>

          {/* Content - Simplified Form */}
          <div className="flex-1 px-6 py-6 overflow-visible">
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
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!canSubmit || isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-brand-cyan hover:bg-brand-cyan/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Assigning...' : 'Assign User'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Cross-Org Assignment */}
      {showConfirmation && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[70]" onClick={() => setShowConfirmation(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full pointer-events-auto">
              <div className="px-6 py-4 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    User Already in Organization
                  </h3>
                </div>
              </div>
              <div className="px-6 py-4">
                <p className="text-neutral-700 mb-4">
                  This user is currently in <span className="font-medium">{selectedUser?.currentOrganization?.name}</span>.
                </p>
                <p className="text-neutral-700">
                  Do you want to remove them from their current organization and assign them to the selected organization?
                </p>
              </div>
              <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Moving...' : 'Yes, Move User'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
