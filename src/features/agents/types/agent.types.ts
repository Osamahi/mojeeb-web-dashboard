export type AgentStatus = 'draft' | 'active' | 'deleted';

export type ModelProvider = 'gemini' | 'openai' | 'claude';

export type PlatformTarget = 'mobile' | 'web' | 'both';

export type Agent = {
  id: string;
  name: string;
  description: string | null;
  personaPrompt: string | null;
  ownerId: string;
  avatarUrl: string | null;
  status: AgentStatus;
  language: string | null;
  platformTarget: PlatformTarget | null;
  allowHandoff: boolean;
  modelProvider: ModelProvider | null;
  createdAt: string;
  updatedAt: string;
  conversationCount?: number;
  knowledgeBaseCount?: number;
  ownerName?: string;
  userRole?: string;
  userPermissions?: string[];
  accessSource?: 'legacy' | 'rbac' | 'globaladmin';
  isOwner?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canManageAccess?: boolean;
};

export type CreateAgentRequest = {
  name: string;
  description?: string;
  personaPrompt?: string;
  language?: string;
  platformTarget?: PlatformTarget;
  allowHandoff?: boolean;
  modelProvider?: ModelProvider;
  avatarUrl?: string;
};

export type UpdateAgentRequest = {
  name?: string;
  description?: string;
  personaPrompt?: string;
  language?: string;
  platformTarget?: PlatformTarget;
  allowHandoff?: boolean;
  modelProvider?: ModelProvider;
  avatarUrl?: string;
  status?: AgentStatus;
};

export type KnowledgeBase = {
  id: string;
  name: string;
  content: string;
  sourceType: string | null;
  sourceUrl: string | null;
  tags: string[] | null;
  status: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateKnowledgeBaseRequest = {
  name: string;
  content: string;
  sourceType?: string;
  sourceUrl?: string;
  tags?: string[];
};

export type UpdateKnowledgeBaseRequest = {
  name?: string;
  content?: string;
  sourceType?: string;
  sourceUrl?: string;
  tags?: string[];
  status?: string;
};

export type AgentFilters = {
  status?: AgentStatus;
  search?: string;
  page?: number;
  pageSize?: number;
};
