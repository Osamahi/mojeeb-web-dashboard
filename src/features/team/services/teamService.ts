/**
 * Team Service
 * Handles agent-specific team member management (collaborators)
 * Matches Flutter RBAC implementation
 */

import api from '@/lib/api';
import type { TeamMember, TeamRole, InviteTeamMemberRequest, InviteTeamMemberResponse, TeamStats } from '../types';
import { logger } from '@/lib/logger';

interface CollaboratorsResponse {
  owner: TeamMember;
  collaborators: TeamMember[];  // Changed from 'members' to 'collaborators'
  totalUsers: number;
}

class TeamService {
  /**
   * Fetch team members (collaborators) for a specific agent
   * Matches Flutter: GET /api/agents/{agentId}/collaborators
   */
  async getTeamMembers(agentId: string): Promise<TeamMember[]> {
    try {
      const { data } = await api.get<{ success: boolean; data: any }>(
        `/api/agents/${agentId}/collaborators`
      );

      // Handle different response structures
      const responseData = data.data || data;

      // Map backend CollaboratorInfo to frontend TeamMember
      const mapCollaboratorToTeamMember = (collaborator: any): TeamMember => ({
        id: collaborator.user_id,
        email: collaborator.email,
        name: collaborator.full_name,
        role: collaborator.role,
        created_at: collaborator.granted_at,
        updated_at: collaborator.granted_at,
        role_value: 0, // Not provided by backend, set default
        is_online: false, // Not provided by backend, set default
      });

      // Ensure collaborators is an array
      const collaborators = Array.isArray(responseData.collaborators)
        ? responseData.collaborators.map(mapCollaboratorToTeamMember)
        : [];

      // Map owner if exists
      const owner = responseData.owner ? mapCollaboratorToTeamMember(responseData.owner) : null;

      // Combine owner and collaborators into a single array
      const allMembers: TeamMember[] = owner ? [owner, ...collaborators] : collaborators;

      return allMembers;
    } catch (error) {
      logger.error('Failed to fetch team members', error instanceof Error ? error : new Error(String(error)));
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
      logger.error(`Failed to fetch team members with role ${role}`, error instanceof Error ? error : new Error(String(error)));
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
      logger.error('Failed to fetch team stats', error instanceof Error ? error : new Error(String(error)));
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
      logger.error('Failed to invite team member', error instanceof Error ? error : new Error(String(error)));
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
      logger.error(`Failed to update role for user ${userId}`, error instanceof Error ? error : new Error(String(error)));
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
      logger.error(`Failed to remove team member ${userId}`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}

export const teamService = new TeamService();
