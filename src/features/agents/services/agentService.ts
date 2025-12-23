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
  DocumentProcessingJob,
  DocumentJobCreated,
  DocumentJobStatus,
} from '../types/agent.types';
import { organizationService } from '@/features/organizations/services/organizationService';

// API Response Types (snake_case from backend)
interface ApiAgentResponse {
  id: string;
  name: string;
  description?: string;
  persona_prompt?: string;
  owner_id: string;
  organization_id: string; // NEW: Organization-centric architecture
  organization_name?: string; // NEW: Organization name (populated by backend)
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

// Document Job API Response Types (snake_case from backend)
interface ApiDocumentJobCreatedResponse {
  job_id: string;
  status: string;
  created_at: string;
  status_url: string;
  poll_interval: number;
}

interface ApiDocumentJobResponse {
  job_id: string;
  status: string;
  progress: number;
  current_step: string | null;
  file_name: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  result: {
    success: boolean;
    error_message: string | null;
    extracted_entries: KnowledgeBase[] | null;
  } | null;
  error_message: string | null;
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
      organizationId: apiAgent.organization_id, // NEW: Organization-centric architecture
      organizationName: apiAgent.organization_name ?? null, // NEW: Organization name for display
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
    const stack = new Error().stack;
    console.log(`\n🌐 [AgentService] getAgents() API call at ${new Date().toISOString()}`);
    console.log(`   📍 Called from:\n${stack}`);

    const { data } = await api.get<ApiResponse<ApiAgentResponse[]>>('/api/agents');
    const agents = data.data.map(agent => this.transformAgent(agent));

    console.log(`   ✅ API returned ${agents.length} agents`);
    if (agents.length > 0) {
      console.log(`   First agent: ${agents[0].name} (ID: ${agents[0].id})`);
      console.log(`   Organization: ${agents[0].organizationName || 'N/A'} (ID: ${agents[0].organizationId})`);
    }

    return agents;
  }

  /**
   * Get agent by ID
   */
  async getAgent(id: string): Promise<Agent> {
    const { data } = await api.get<ApiResponse<ApiAgentResponse>>(`/api/agents/${id}`);
    return this.transformAgent(data.data);
  }

  /**
   * Get agents by organization ID
   */
  async getAgentsByOrganization(organizationId: string): Promise<Agent[]> {
    const { data } = await api.get<ApiResponse<ApiAgentResponse[]>>(`/api/agents/by-organization/${organizationId}`);
    return data.data.map(agent => this.transformAgent(agent));
  }

  /**
   * Create new agent
   * NEW: Automatically fetches user's organization_id if not provided
   */
  async createAgent(request: CreateAgentRequest): Promise<Agent> {
    // Get organization_id - either from request or fetch user's organization
    let organizationId = request.organizationId;

    if (!organizationId) {
      try {
        const userOrg = await organizationService.getUserOrganization();
        organizationId = userOrg.organization.id;
      } catch (error) {
        throw new Error('Failed to get user organization. Please ensure you are logged in.');
      }
    }

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
      organization_id: organizationId, // REQUIRED: Organization-centric architecture
    };

    // Backend returns minimal response { id, name, status } or { Id, Name, Status }
    const response = await api.post('/api/agents', snakeCaseRequest);

    // Try both lowercase and uppercase property names
    const agentId = response.data?.id || response.data?.Id;

    // Fetch full agent details using the returned ID
    if (agentId) {
      return await this.getAgent(agentId);
    }

    throw new Error(`Agent creation returned invalid response - missing agent ID. Response: ${JSON.stringify(response.data)}`);
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
   * Reassign agent to different organization (SuperAdmin only)
   */
  async reassignOrganization(agentId: string, organizationId: string): Promise<Agent> {
    const { data } = await api.patch<ApiResponse<ApiAgentResponse>>(
      `/api/agents/${agentId}/organization`,
      { organization_id: organizationId }
    );
    return this.transformAgent(data.data);
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

  /**
   * Transform document job created response from snake_case to camelCase
   */
  private transformJobCreated(apiJob: ApiDocumentJobCreatedResponse): DocumentJobCreated {
    return {
      jobId: apiJob.job_id,
      status: apiJob.status as DocumentJobStatus,
      createdAt: apiJob.created_at,
      statusUrl: apiJob.status_url,
      pollInterval: apiJob.poll_interval,
    };
  }

  /**
   * Transform document job response from snake_case to camelCase
   */
  private transformJob(apiJob: ApiDocumentJobResponse): DocumentProcessingJob {
    return {
      jobId: apiJob.job_id,
      status: apiJob.status as DocumentJobStatus,
      progress: apiJob.progress,
      currentStep: apiJob.current_step as DocumentProcessingJob['currentStep'],
      fileName: apiJob.file_name,
      fileSize: apiJob.file_size,
      createdAt: apiJob.created_at,
      updatedAt: apiJob.updated_at,
      completedAt: apiJob.completed_at,
      result: apiJob.result ? {
        success: apiJob.result.success,
        errorMessage: apiJob.result.error_message,
        extractedEntries: apiJob.result.extracted_entries || [],
      } : null,
      errorMessage: apiJob.error_message,
    };
  }

  /**
   * Upload document asynchronously and get job ID for polling
   */
  async uploadDocumentAsync(agentId: string, file: File): Promise<DocumentJobCreated> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('agentId', agentId);

    const { data } = await api.post<ApiResponse<ApiDocumentJobCreatedResponse>>(
      '/api/knowledgebases/process-document-async',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return this.transformJobCreated(data.data);
  }

  /**
   * Get document processing job status
   */
  async getDocumentJob(jobId: string): Promise<DocumentProcessingJob> {
    const { data } = await api.get<ApiResponse<ApiDocumentJobResponse>>(
      `/api/knowledgebases/document-jobs/${jobId}`
    );
    return this.transformJob(data.data);
  }

  /**
   * List all document processing jobs for an agent
   */
  async listDocumentJobs(agentId: string, status?: DocumentJobStatus): Promise<DocumentProcessingJob[]> {
    const params: { agentId: string; status?: DocumentJobStatus } = { agentId };
    if (status) {
      params.status = status;
    }
    const { data } = await api.get<ApiResponse<ApiDocumentJobResponse[]>>(
      `/api/knowledgebases/document-jobs`,
      { params }
    );
    return data.data.map(job => this.transformJob(job));
  }

  /**
   * Cancel a document processing job
   */
  async cancelDocumentJob(jobId: string): Promise<void> {
    await api.delete(`/api/knowledgebases/document-jobs/${jobId}`);
  }
}

export const agentService = new AgentService();
