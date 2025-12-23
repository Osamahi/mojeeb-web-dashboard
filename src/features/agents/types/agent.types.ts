export type AgentStatus = 'draft' | 'active' | 'deleted';

export type ModelProvider = 'gemini' | 'openai' | 'claude';

export type PlatformTarget = 'mobile' | 'web' | 'both';

export type Agent = {
  id: string;
  name: string;
  description: string | null;
  personaPrompt: string | null;
  ownerId: string;
  organizationId: string; // NEW: Organization-centric architecture
  organizationName?: string | null; // NEW: Organization name for display (populated by backend)
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
  organizationId?: string; // Optional - will be auto-fetched if not provided
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

// Document Processing Job Types
export type DocumentJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type DocumentJobStep = 'validating' | 'parsing' | 'ai_processing' | 'completed';

export type DocumentProcessingJob = {
  jobId: string;
  status: DocumentJobStatus;
  progress: number;
  currentStep: DocumentJobStep | null;
  fileName: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  result: DocumentProcessingResult | null;
  errorMessage: string | null;
};

export type DocumentProcessingResult = {
  success: boolean;
  errorMessage: string | null;
  extractedEntries: KnowledgeBase[];
};

export type DocumentJobCreated = {
  jobId: string;
  status: DocumentJobStatus;
  createdAt: string;
  statusUrl: string;
  pollInterval: number;
};
