import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import type {
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
  KnowledgeBase,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
} from '../types/agent.types';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the entire api module with test axios instance
vi.mock('@/lib/api', async () => {
  const axios = await import('axios');

  const testApi = axios.default.create({
    baseURL: 'http://localhost:5000',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return {
    default: testApi,
    API_URL: 'http://localhost:5000',
  };
});

// Import after mocks
import { agentService } from './agentService';

describe('agentService', () => {
  const mockApiAgent = {
    id: 'agent-123',
    name: 'Test Agent',
    description: 'Test agent description',
    persona_prompt: 'You are a helpful assistant',
    organization_id: 'org-123',
    avatar_url: 'https://example.com/avatar.jpg',
    status: 'active',
    language: 'en',
    platform_target: 'both',
    allow_handoff: true,
    model_provider: 'gemini',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    conversation_count: 5,
    knowledge_base_count: 2,
    owner_name: 'Test Owner',
    user_role: 1,
    user_permissions: ['read', 'write'],
    access_source: 'rbac',
    is_owner: true,
    can_edit: true,
    can_delete: true,
    can_manage_access: true,
  };

  const mockTransformedAgent: Agent = {
    id: 'agent-123',
    name: 'Test Agent',
    description: 'Test agent description',
    personaPrompt: 'You are a helpful assistant',
    organizationId: 'org-123',
    avatarUrl: 'https://example.com/avatar.jpg',
    status: 'active',
    language: 'en',
    platformTarget: 'both',
    allowHandoff: true,
    modelProvider: 'gemini',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    conversationCount: 5,
    knowledgeBaseCount: 2,
    ownerName: 'Test Owner',
    userRole: 1,
    userPermissions: ['read', 'write'],
    accessSource: 'rbac',
    isOwner: true,
    canEdit: true,
    canDelete: true,
    canManageAccess: true,
  };

  const mockKnowledgeBase: KnowledgeBase = {
    id: 'kb-123',
    name: 'Test Knowledge Base',
    content: 'Test content',
    sourceType: 'manual',
    sourceUrl: null,
    tags: ['test', 'demo'],
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAgents', () => {
    it('should fetch all agents and transform to camelCase', async () => {
      server.use(
        http.get('http://localhost:5000/api/agents', () => {
          return HttpResponse.json({
            success: true,
            message: null,
            data: [mockApiAgent],
          });
        })
      );

      const result = await agentService.getAgents();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'agent-123',
        name: 'Test Agent',
        personaPrompt: 'You are a helpful assistant',
        organizationId: 'org-123',
        platformTarget: 'both',
        allowHandoff: true,
        modelProvider: 'gemini',
      });
    });

    it('should handle empty agents list', async () => {
      server.use(
        http.get('http://localhost:5000/api/agents', () => {
          return HttpResponse.json({
            success: true,
            message: null,
            data: [],
          });
        })
      );

      const result = await agentService.getAgents();

      expect(result).toEqual([]);
    });

    it('should handle API error', async () => {
      server.use(
        http.get('http://localhost:5000/api/agents', () => {
          return HttpResponse.json(
            { message: 'Server error' },
            { status: 500 }
          );
        })
      );

      await expect(agentService.getAgents()).rejects.toThrow();
    });
  });

  describe('getAgent', () => {
    it('should fetch single agent by ID', async () => {
      server.use(
        http.get('http://localhost:5000/api/agents/agent-123', () => {
          return HttpResponse.json({
            success: true,
            message: null,
            data: mockApiAgent,
          });
        })
      );

      const result = await agentService.getAgent('agent-123');

      expect(result).toMatchObject({
        id: 'agent-123',
        name: 'Test Agent',
        personaPrompt: 'You are a helpful assistant',
      });
    });

    it('should handle agent not found', async () => {
      server.use(
        http.get('http://localhost:5000/api/agents/nonexistent', () => {
          return HttpResponse.json(
            { message: 'Agent not found' },
            { status: 404 }
          );
        })
      );

      await expect(agentService.getAgent('nonexistent')).rejects.toThrow();
    });
  });

  describe('createAgent', () => {
    it('should create new agent', async () => {
      const createRequest: CreateAgentRequest = {
        name: 'New Agent',
        description: 'New agent description',
        personaPrompt: 'You are helpful',
        language: 'en',
        platformTarget: 'web',
        allowHandoff: false,
        modelProvider: 'openai',
      };

      server.use(
        // POST returns minimal response with just id
        http.post('http://localhost:5000/api/agents', async () => {
          return HttpResponse.json(
            { id: 'new-agent-id' },
            { status: 201 }
          );
        }),
        // Then GET is called to fetch full agent details
        http.get('http://localhost:5000/api/agents/new-agent-id', () => {
          return HttpResponse.json({
            success: true,
            message: null,
            data: {
              ...mockApiAgent,
              id: 'new-agent-id',
              name: 'New Agent',
              description: 'New agent description',
              persona_prompt: 'You are helpful',
            },
          });
        })
      );

      const result = await agentService.createAgent(createRequest);

      expect(result).toMatchObject({
        id: 'new-agent-id',
        name: 'New Agent',
        description: 'New agent description',
        personaPrompt: 'You are helpful',
      });
    });

    it('should handle validation error', async () => {
      server.use(
        http.post('http://localhost:5000/api/agents', () => {
          return HttpResponse.json(
            { message: 'Name is required' },
            { status: 400 }
          );
        })
      );

      await expect(
        agentService.createAgent({ name: '' })
      ).rejects.toThrow();
    });
  });

  describe('updateAgent', () => {
    it('should update agent successfully', async () => {
      const updateRequest: UpdateAgentRequest = {
        name: 'Updated Agent',
        description: 'Updated description',
      };

      server.use(
        http.put('http://localhost:5000/api/agents/agent-123', async ({ request }) => {
          const body = (await request.json()) as any;

          return HttpResponse.json({
            ...mockApiAgent,
            name: body.name,
            description: body.description,
          });
        })
      );

      const result = await agentService.updateAgent('agent-123', updateRequest);

      expect(result).toMatchObject({
        id: 'agent-123',
        name: 'Updated Agent',
        description: 'Updated description',
      });
    });

    it('should handle unauthorized update', async () => {
      server.use(
        http.put('http://localhost:5000/api/agents/agent-123', () => {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 403 }
          );
        })
      );

      await expect(
        agentService.updateAgent('agent-123', { name: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('deleteAgent', () => {
    it('should delete agent successfully', async () => {
      server.use(
        http.delete('http://localhost:5000/api/agents/agent-123', () => {
          return HttpResponse.json({ message: 'Agent deleted successfully' });
        })
      );

      await expect(
        agentService.deleteAgent('agent-123')
      ).resolves.not.toThrow();
    });

    it('should handle delete failure', async () => {
      server.use(
        http.delete('http://localhost:5000/api/agents/agent-123', () => {
          return HttpResponse.json(
            { message: 'Cannot delete agent with active conversations' },
            { status: 400 }
          );
        })
      );

      await expect(
        agentService.deleteAgent('agent-123')
      ).rejects.toThrow();
    });
  });

  describe('getKnowledgeBases', () => {
    it('should fetch knowledge bases for agent', async () => {
      server.use(
        http.get('http://localhost:5000/api/agents/agent-123/knowledgebases', () => {
          return HttpResponse.json([mockKnowledgeBase]);
        })
      );

      const result = await agentService.getKnowledgeBases('agent-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'kb-123',
        name: 'Test Knowledge Base',
        content: 'Test content',
      });
    });

    it('should handle empty knowledge bases', async () => {
      server.use(
        http.get('http://localhost:5000/api/agents/agent-123/knowledgebases', () => {
          return HttpResponse.json([]);
        })
      );

      const result = await agentService.getKnowledgeBases('agent-123');

      expect(result).toEqual([]);
    });
  });

  describe('getAllKnowledgeBases', () => {
    it('should fetch all knowledge bases for current user', async () => {
      server.use(
        http.get('http://localhost:5000/api/knowledgebases', () => {
          return HttpResponse.json([mockKnowledgeBase]);
        })
      );

      const result = await agentService.getAllKnowledgeBases();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'kb-123',
        name: 'Test Knowledge Base',
      });
    });
  });

  describe('createKnowledgeBase', () => {
    it('should create new knowledge base', async () => {
      const createRequest: CreateKnowledgeBaseRequest = {
        name: 'New KB',
        content: 'New content',
        sourceType: 'manual',
        tags: ['test'],
      };

      server.use(
        http.post('http://localhost:5000/api/knowledgebases', async ({ request }) => {
          const body = (await request.json()) as any;

          return HttpResponse.json(
            {
              success: true,
              message: null,
              data: {
                ...mockKnowledgeBase,
                id: 'new-kb-id',
                name: body.name,
                content: body.content,
              },
            },
            { status: 201 }
          );
        })
      );

      const result = await agentService.createKnowledgeBase(createRequest);

      expect(result).toMatchObject({
        id: 'new-kb-id',
        name: 'New KB',
        content: 'New content',
      });
    });
  });

  describe('updateKnowledgeBase', () => {
    it('should update knowledge base', async () => {
      const updateRequest: UpdateKnowledgeBaseRequest = {
        name: 'Updated KB',
        content: 'Updated content',
      };

      server.use(
        http.put('http://localhost:5000/api/knowledgebases/kb-123', async ({ request }) => {
          const body = (await request.json()) as any;

          return HttpResponse.json({
            ...mockKnowledgeBase,
            name: body.name,
            content: body.content,
          });
        })
      );

      const result = await agentService.updateKnowledgeBase('kb-123', updateRequest);

      expect(result).toMatchObject({
        id: 'kb-123',
        name: 'Updated KB',
        content: 'Updated content',
      });
    });
  });

  describe('deleteKnowledgeBase', () => {
    it('should delete knowledge base successfully', async () => {
      server.use(
        http.delete('http://localhost:5000/api/knowledgebases/kb-123', () => {
          return HttpResponse.json({ message: 'Knowledge base deleted' });
        })
      );

      await expect(
        agentService.deleteKnowledgeBase('kb-123')
      ).resolves.not.toThrow();
    });
  });

  describe('linkKnowledgeBase', () => {
    it('should link knowledge base to agent', async () => {
      server.use(
        http.post('http://localhost:5000/api/agents/agent-123/knowledgebases/kb-123', () => {
          return HttpResponse.json({ message: 'Linked successfully' });
        })
      );

      await expect(
        agentService.linkKnowledgeBase('agent-123', 'kb-123')
      ).resolves.not.toThrow();
    });

    it('should handle already linked error', async () => {
      server.use(
        http.post('http://localhost:5000/api/agents/agent-123/knowledgebases/kb-123', () => {
          return HttpResponse.json(
            { message: 'Knowledge base already linked' },
            { status: 409 }
          );
        })
      );

      await expect(
        agentService.linkKnowledgeBase('agent-123', 'kb-123')
      ).rejects.toThrow();
    });
  });

  describe('unlinkKnowledgeBase', () => {
    it('should unlink knowledge base from agent', async () => {
      server.use(
        http.delete('http://localhost:5000/api/agents/agent-123/knowledgebases/kb-123', () => {
          return HttpResponse.json({ message: 'Unlinked successfully' });
        })
      );

      await expect(
        agentService.unlinkKnowledgeBase('agent-123', 'kb-123')
      ).resolves.not.toThrow();
    });
  });

  describe('uploadAvatar', () => {
    // Note: File upload tests are skipped due to MSW limitations with multipart/form-data
    // MSW cannot properly intercept FormData requests when Content-Type is manually set
    // These should be tested with integration tests or E2E tests instead

    it.skip('should upload avatar image', async () => {
      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

      server.use(
        http.post('http://localhost:5000/api/chat/upload-image', async () => {
          return HttpResponse.json({
            url: 'https://example.com/uploaded-avatar.jpg',
          });
        })
      );

      const result = await agentService.uploadAvatar(mockFile);

      expect(result).toBe('https://example.com/uploaded-avatar.jpg');
    });

    it.skip('should handle upload failure', async () => {
      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

      server.use(
        http.post('http://localhost:5000/api/chat/upload-image', () => {
          return HttpResponse.json(
            { message: 'Invalid file type' },
            { status: 400 }
          );
        })
      );

      await expect(
        agentService.uploadAvatar(mockFile)
      ).rejects.toThrow();
    });
  });

  describe('snake_case to camelCase transformation', () => {
    it('should correctly transform all agent properties', async () => {
      server.use(
        http.get('http://localhost:5000/api/agents/agent-123', () => {
          return HttpResponse.json({
            success: true,
            message: null,
            data: mockApiAgent,
          });
        })
      );

      const result = await agentService.getAgent('agent-123');

      // Ensure all snake_case properties are converted to camelCase
      expect(result).toHaveProperty('personaPrompt');
      expect(result).toHaveProperty('organizationId');
      expect(result).toHaveProperty('avatarUrl');
      expect(result).toHaveProperty('platformTarget');
      expect(result).toHaveProperty('allowHandoff');
      expect(result).toHaveProperty('modelProvider');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result).toHaveProperty('conversationCount');
      expect(result).toHaveProperty('knowledgeBaseCount');
      expect(result).toHaveProperty('ownerName');
      expect(result).toHaveProperty('userRole');
      expect(result).toHaveProperty('userPermissions');
      expect(result).toHaveProperty('accessSource');
      expect(result).toHaveProperty('isOwner');
      expect(result).toHaveProperty('canEdit');
      expect(result).toHaveProperty('canDelete');
      expect(result).toHaveProperty('canManageAccess');

      // Ensure no snake_case properties remain
      expect(result).not.toHaveProperty('persona_prompt');
      expect(result).not.toHaveProperty('organization_id');
      expect(result).not.toHaveProperty('avatar_url');
      expect(result).not.toHaveProperty('platform_target');
      expect(result).not.toHaveProperty('allow_handoff');
      expect(result).not.toHaveProperty('model_provider');
      expect(result).not.toHaveProperty('created_at');
      expect(result).not.toHaveProperty('updated_at');
    });

    it('should handle null and undefined values correctly', async () => {
      const agentWithNulls = {
        ...mockApiAgent,
        description: null,
        persona_prompt: undefined,
        avatar_url: null,
        language: null,
        platform_target: null,
        model_provider: null,
      };

      server.use(
        http.get('http://localhost:5000/api/agents/agent-123', () => {
          return HttpResponse.json({
            success: true,
            message: null,
            data: agentWithNulls,
          });
        })
      );

      const result = await agentService.getAgent('agent-123');

      expect(result.description).toBeNull();
      expect(result.personaPrompt).toBeNull();
      expect(result.avatarUrl).toBeNull();
      expect(result.language).toBeNull();
      expect(result.platformTarget).toBeNull();
      expect(result.modelProvider).toBeNull();
    });
  });
});
