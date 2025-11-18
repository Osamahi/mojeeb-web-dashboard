import api from '@/lib/api';
import type {
  Agent,
  AgentStatus,
  ModelProvider,
  PlatformTarget,
  CreateAgentRequest,
  UpdateAgentRequest,
  KnowledgeBase,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
} from '../types/agent.types';

// API Response Types (snake_case from backend)
interface ApiAgentResponse {
  id: string;
  name: string;
  description?: string;
  persona_prompt?: string;
  owner_id: string;
  avatar_url?: string;
  status?: string;
  language?: string;
  platform_target?: string;
  allow_handoff?: boolean;
  model_provider?: string;
  created_at: string;
  updated_at: string;
  conversation_count?: number;
  knowledge_base_count?: number;
  owner_name?: string;
  user_role?: string;
  user_permissions?: string[];
  access_source?: string;
  is_owner?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  can_manage_access?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

class AgentService {
  /**
   * Transform API response from snake_case to camelCase
   */
  private transformAgent(apiAgent: ApiAgentResponse): Agent {
    return {
      id: apiAgent.id,
      name: apiAgent.name,
      description: apiAgent.description ?? null,
      personaPrompt: apiAgent.persona_prompt ?? null,
      ownerId: apiAgent.owner_id,
      avatarUrl: apiAgent.avatar_url ?? null,
      status: (apiAgent.status as AgentStatus) ?? 'draft',
      language: apiAgent.language ?? null,
      platformTarget: (apiAgent.platform_target as PlatformTarget | null) ?? null,
      allowHandoff: apiAgent.allow_handoff ?? false,
      modelProvider: (apiAgent.model_provider as ModelProvider | null) ?? null,
      createdAt: apiAgent.created_at,
      updatedAt: apiAgent.updated_at,
      conversationCount: apiAgent.conversation_count,
      knowledgeBaseCount: apiAgent.knowledge_base_count,
      ownerName: apiAgent.owner_name,
      userRole: apiAgent.user_role,
      userPermissions: apiAgent.user_permissions,
      accessSource: apiAgent.access_source as 'legacy' | 'rbac' | 'globaladmin' | undefined,
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
    const { data } = await api.get<ApiResponse<ApiAgentResponse[]>>('/api/agents');
    return data.data.map(agent => this.transformAgent(agent));
  }

  /**
   * Get agent by ID
   */
  async getAgent(id: string): Promise<Agent> {
    const { data } = await api.get<ApiResponse<ApiAgentResponse>>(`/api/agents/${id}`);
    return this.transformAgent(data.data);
  }

  /**
   * Create new agent
   */
  async createAgent(request: CreateAgentRequest): Promise<Agent> {
    // Transform camelCase to snake_case for backend
    const snakeCaseRequest = {
      name: request.name,
      description: request.description,
      persona_prompt: request.personaPrompt,
      language: request.language,
      platform_target: request.platformTarget,
      allow_handoff: request.allowHandoff,
      model_provider: request.modelProvider,
      avatar_url: request.avatarUrl,
    };
    const { data } = await api.post<ApiAgentResponse>('/api/agents', snakeCaseRequest);
    return this.transformAgent(data);
  }

  /**
   * Update agent
   */
  async updateAgent(id: string, request: UpdateAgentRequest): Promise<Agent> {
    // Transform camelCase to snake_case for backend
    const snakeCaseRequest = {
      name: request.name,
      description: request.description,
      persona_prompt: request.personaPrompt,
      language: request.language,
      platform_target: request.platformTarget,
      allow_handoff: request.allowHandoff,
      model_provider: request.modelProvider,
      avatar_url: request.avatarUrl,
      status: request.status,
    };
    const { data } = await api.put<ApiAgentResponse>(`/api/agents/${id}`, snakeCaseRequest);
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
    const { data } = await api.post<ApiResponse<KnowledgeBase>>('/api/knowledgebases', request);
    return data.data;
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
