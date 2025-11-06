import api from '@/lib/api';
import type {
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
  KnowledgeBase,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
} from '../types/agent.types';

class AgentService {
  /**
   * Transform API response from snake_case to camelCase
   */
  private transformAgent(apiAgent: any): Agent {
    return {
      id: apiAgent.id,
      name: apiAgent.name,
      description: apiAgent.description,
      personaPrompt: apiAgent.persona_prompt,
      ownerId: apiAgent.owner_id,
      avatarUrl: apiAgent.avatar_url,
      status: apiAgent.status,
      language: apiAgent.language,
      platformTarget: apiAgent.platform_target,
      allowHandoff: apiAgent.allow_handoff,
      modelProvider: apiAgent.model_provider,
      createdAt: apiAgent.created_at,
      updatedAt: apiAgent.updated_at,
      conversationCount: apiAgent.conversation_count,
      knowledgeBaseCount: apiAgent.knowledge_base_count,
      ownerName: apiAgent.owner_name,
      userRole: apiAgent.user_role,
      userPermissions: apiAgent.user_permissions,
      accessSource: apiAgent.access_source,
      isOwner: apiAgent.is_owner,
      canEdit: apiAgent.can_edit,
      canDelete: apiAgent.can_delete,
      canManageAccess: apiAgent.can_manage_access,
    };
  }

  /**
   * Get all agents for current user
   */
  async getAgents(): Promise<Agent[]> {
    const { data } = await api.get<{ success: boolean; message: string | null; data: any[] }>('/api/agents');
    return data.data.map(agent => this.transformAgent(agent));
  }

  /**
   * Get agent by ID
   */
  async getAgent(id: string): Promise<Agent> {
    const { data } = await api.get<any>(`/api/agents/${id}`);
    return this.transformAgent(data);
  }

  /**
   * Create new agent
   */
  async createAgent(request: CreateAgentRequest): Promise<Agent> {
    const { data } = await api.post<any>('/api/agents', request);
    return this.transformAgent(data);
  }

  /**
   * Update agent
   */
  async updateAgent(id: string, request: UpdateAgentRequest): Promise<Agent> {
    const { data } = await api.put<any>(`/api/agents/${id}`, request);
    return this.transformAgent(data);
  }

  /**
   * Delete agent (soft delete)
   */
  async deleteAgent(id: string): Promise<void> {
    await api.delete(`/api/agents/${id}`);
  }

  /**
   * Get knowledge bases for an agent
   */
  async getKnowledgeBases(agentId: string): Promise<KnowledgeBase[]> {
    const { data } = await api.get<KnowledgeBase[]>(`/api/agents/${agentId}/knowledgebases`);
    return data;
  }

  /**
   * Get all knowledge bases for current user
   */
  async getAllKnowledgeBases(): Promise<KnowledgeBase[]> {
    const { data} = await api.get<KnowledgeBase[]>('/api/knowledgebases');
    return data;
  }

  /**
   * Create knowledge base
   */
  async createKnowledgeBase(request: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> {
    const { data } = await api.post<KnowledgeBase>('/api/knowledgebases', request);
    return data;
  }

  /**
   * Update knowledge base
   */
  async updateKnowledgeBase(id: string, request: UpdateKnowledgeBaseRequest): Promise<KnowledgeBase> {
    const { data } = await api.put<KnowledgeBase>(`/api/knowledgebases/${id}`, request);
    return data;
  }

  /**
   * Delete knowledge base
   */
  async deleteKnowledgeBase(id: string): Promise<void> {
    await api.delete(`/api/knowledgebases/${id}`);
  }

  /**
   * Link knowledge base to agent
   */
  async linkKnowledgeBase(agentId: string, knowledgeBaseId: string): Promise<void> {
    await api.post(`/api/agents/${agentId}/knowledgebases/${knowledgeBaseId}`);
  }

  /**
   * Unlink knowledge base from agent
   */
  async unlinkKnowledgeBase(agentId: string, knowledgeBaseId: string): Promise<void> {
    await api.delete(`/api/agents/${agentId}/knowledgebases/${knowledgeBaseId}`);
  }

  /**
   * Upload avatar image
   */
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const { data } = await api.post<{ url: string }>('/api/chat/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data.url;
  }
}

export const agentService = new AgentService();
