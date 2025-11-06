/**
 * Invite Team Member Modal
 * Modal dialog for inviting new team members
 */

import { useState } from 'react';
import { X, Mail, User, Shield } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { teamService } from '../services/teamService';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { TeamRole, InviteTeamMemberRequest } from '../types';

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
}

export default function InviteTeamMemberModal({ isOpen, onClose, agentId }: InviteTeamMemberModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<InviteTeamMemberRequest>({
    email: '',
    name: '',
    role: 'HumanAgent',
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteTeamMemberRequest) => teamService.inviteTeamMember(agentId, data),
    onSuccess: () => {
      toast.success('Team member invited successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers(agentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.teamStats(agentId) });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to invite team member');
    },
  });

  const handleClose = () => {
    setFormData({ email: '', name: '', role: 'HumanAgent' });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    inviteMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 className="text-xl font-semibold text-neutral-950">Invite Team Member</h2>
            <p className="text-sm text-neutral-600 mt-1">
              Send an invitation to join your team
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-1">
              Role *
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as TeamRole })}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
                required
              >
                <option value="HumanAgent">Agent</option>
                <option value="Admin">Admin</option>
                <option value="SuperAdmin">Super Admin</option>
              </select>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {formData.role === 'HumanAgent' && 'Can handle conversations and view reports'}
              {formData.role === 'Admin' && 'Can manage agents and configure settings'}
              {formData.role === 'SuperAdmin' && 'Full access to all system features'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
