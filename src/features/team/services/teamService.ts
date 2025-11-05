/**
 * Team Service
 * Handles agent-specific team member management (collaborators)
 * Matches Flutter RBAC implementation
 */

import api from '@/lib/api';
import type { TeamMember, TeamRole, InviteTeamMemberRequest, InviteTeamMemberResponse, TeamStats } from '../types';

interface CollaboratorsResponse {
  owner: TeamMember;
  members: TeamMember[];
  totalUsers: number;
}

class TeamService {
  /**
   * Fetch team members (collaborators) for a specific agent
   * Matches Flutter: GET /api/agents/{agentId}/collaborators
   */
  async getTeamMembers(agentId: string): Promise<TeamMember[]> {
    try {
      const { data } = await api.get<{ success: boolean; data: CollaboratorsResponse }>(
        `/api/agents/${agentId}/collaborators`
      );

      console.log('API Response:', data);

      // Handle different response structures
      const responseData = data.data || data;

      // Ensure members is an array
      const members = Array.isArray(responseData.members) ? responseData.members : [];
      const owner = responseData.owner;

      // Combine owner and members into a single array
      const allMembers: TeamMember[] = owner ? [owner, ...members] : members;

      return allMembers;
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      throw error;
    }
  }

  /**
   * Get team members filtered by specific role (agent-specific)
   */
  async getTeamMembersByRole(agentId: string, role: TeamRole): Promise<TeamMember[]> {
    try {
      const teamMembers = await this.getTeamMembers(agentId);
      return teamMembers.filter((member) => member.role === role);
    } catch (error) {
      console.error(`Failed to fetch team members with role ${role}:`, error);
      throw error;
    }
  }

  /**
   * Calculate team statistics (agent-specific)
   */
  async getTeamStats(agentId: string): Promise<TeamStats> {
    try {
      const teamMembers = await this.getTeamMembers(agentId);

      const stats: TeamStats = {
        total_members: teamMembers.length,
        online_members: teamMembers.filter((m) => m.is_online).length || 0,
        admins_count: teamMembers.filter((m) => m.role === 'Admin').length,
        agents_count: teamMembers.filter((m) => m.role === 'HumanAgent').length,
        super_admins_count: teamMembers.filter((m) => m.role === 'SuperAdmin').length,
      };

      return stats;
    } catch (error) {
      console.error('Failed to fetch team stats:', error);
      throw error;
    }
  }

  /**
   * Invite a new team member to an agent
   * Matches Flutter: POST /api/agents/{agentId}/share
   */
  async inviteTeamMember(
    agentId: string,
    request: InviteTeamMemberRequest
  ): Promise<InviteTeamMemberResponse> {
    try {
      const { data } = await api.post<InviteTeamMemberResponse>(
        `/api/agents/${agentId}/share`,
        {
          user_email: request.email,
          role: request.role,
          message: `You've been invited to join the team as ${request.role}`,
        }
      );
      return data;
    } catch (error) {
      console.error('Failed to invite team member:', error);
      throw error;
    }
  }

  /**
   * Update team member role for a specific agent
   * Matches Flutter: PUT /api/agents/{agentId}/permissions
   */
  async updateTeamMemberRole(
    agentId: string,
    userId: string,
    newRole: TeamRole
  ): Promise<void> {
    try {
      await api.put(`/api/agents/${agentId}/permissions`, {
        agent_id: agentId,
        user_id: userId,
        role: newRole,
      });
    } catch (error) {
      console.error(`Failed to update role for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Remove team member access from a specific agent
   * Matches Flutter: DELETE /api/agents/{agentId}/permissions
   */
  async removeTeamMember(
    agentId: string,
    userId: string,
    role: TeamRole
  ): Promise<void> {
    try {
      await api.delete(`/api/agents/${agentId}/permissions`, {
        data: {
          agent_id: agentId,
          user_id: userId,
          role: role,
        },
      });
    } catch (error) {
      console.error(`Failed to remove team member ${userId}:`, error);
      throw error;
    }
  }
}

export const teamService = new TeamService();
