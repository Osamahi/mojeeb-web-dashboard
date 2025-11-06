import { http, HttpResponse } from 'msw';

// Mock API URL - use a test URL since env won't be available in tests
const API_URL = 'http://localhost:5267';

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'SuperAdmin',
};

const mockAgent = {
  id: 'agent-123',
  name: 'Test Agent',
  persona_prompt: 'You are a helpful assistant',
  description: 'Test agent description',
  avatar_url: null,
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_id: 'user-123',
};

const mockConversation = {
  id: 'conv-123',
  agent_id: 'agent-123',
  customer_name: 'Test Customer',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_message_at: new Date().toISOString(),
};

const mockMessage = {
  id: 'msg-123',
  conversation_id: 'conv-123',
  content: 'Test message',
  sender_type: 'user',
  created_at: new Date().toISOString(),
};

export const handlers = [
  // ========== Authentication Endpoints ==========

  // Login
  http.post(`${API_URL}/api/auth/login`, async ({ request }) => {
    const body = await request.json() as any;

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        user: mockUser,
        access_token: 'mock-access-token',  // Backend returns snake_case
        refresh_token: 'mock-refresh-token',
      });
    }

    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // Refresh token
  http.post(`${API_URL}/api/auth/refresh`, async ({ request }) => {
    const body = await request.json() as any;

    if (body.refreshToken === 'mock-refresh-token') {
      return HttpResponse.json({
        accessToken: 'new-mock-access-token',
        refreshToken: 'new-mock-refresh-token',
      });
    }

    return HttpResponse.json(
      { message: 'Invalid refresh token' },
      { status: 401 }
    );
  }),

  // Logout
  http.post(`${API_URL}/api/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  // Get current user
  http.get(`${API_URL}/api/auth/me`, () => {
    return HttpResponse.json(mockUser);
  }),

  // ========== Agents Endpoints ==========

  // Get all agents
  http.get(`${API_URL}/api/agents`, () => {
    return HttpResponse.json([mockAgent]);
  }),

  // Get single agent
  http.get(`${API_URL}/api/agents/:id`, ({ params }) => {
    return HttpResponse.json({ ...mockAgent, id: params.id as string });
  }),

  // Create agent
  http.post(`${API_URL}/api/agents`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      ...mockAgent,
      id: 'new-agent-id',
      name: body.name,
      persona_prompt: body.personaPrompt,
    }, { status: 201 });
  }),

  // Update agent
  http.put(`${API_URL}/api/agents/:id`, async ({ params, request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      ...mockAgent,
      id: params.id as string,
      name: body.name,
      persona_prompt: body.personaPrompt,
    });
  }),

  // Delete agent
  http.delete(`${API_URL}/api/agents/:id`, () => {
    return HttpResponse.json({ message: 'Agent deleted successfully' });
  }),

  // ========== Conversations Endpoints ==========

  // Get conversations by agent
  http.get(`${API_URL}/api/conversations/by-agent/:agentId`, () => {
    return HttpResponse.json([mockConversation]);
  }),

  // Get single conversation
  http.get(`${API_URL}/api/conversations/:id`, ({ params }) => {
    return HttpResponse.json({
      ...mockConversation,
      id: params.id as string,
    });
  }),

  // Create conversation
  http.post(`${API_URL}/api/conversations`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      ...mockConversation,
      id: 'new-conv-id',
      agent_id: body.agentId,
      customer_name: body.customerName,
    }, { status: 201 });
  }),

  // ========== Messages Endpoints ==========

  // Get messages for conversation
  http.get(`${API_URL}/api/conversations/:id/messages`, () => {
    return HttpResponse.json([mockMessage]);
  }),

  // Send message
  http.post(`${API_URL}/api/conversations/:conversationId/messages`, async ({ request, params }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      ...mockMessage,
      id: 'new-msg-id',
      conversation_id: params.conversationId as string,
      content: body.content,
      sender_type: body.senderType,
    }, { status: 201 });
  }),

  // ========== Knowledge Base Endpoints ==========

  // Get knowledge bases for agent
  http.get(`${API_URL}/api/agents/:agentId/knowledge-bases`, () => {
    return HttpResponse.json([
      {
        id: 'kb-123',
        agent_id: 'agent-123',
        title: 'Test Knowledge Base',
        content: 'Test content',
        tags: ['test'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }),

  // ========== Team Endpoints ==========

  // Get team members for agent
  http.get(`${API_URL}/api/agents/:agentId/collaborators`, () => {
    return HttpResponse.json([
      {
        id: 'collab-123',
        user_id: 'user-123',
        agent_id: 'agent-123',
        role: 'admin',
        users: mockUser,
      },
    ]);
  }),

  // ========== Users Endpoints ==========

  // Get all users (SuperAdmin only)
  http.get(`${API_URL}/api/users`, () => {
    return HttpResponse.json([mockUser]);
  }),

  // ========== Widget Endpoints ==========

  // Get widget by agent ID
  http.get(`${API_URL}/api/widgets/by-agent/:agentId`, () => {
    return HttpResponse.json({
      id: 'widget-123',
      agent_id: 'agent-123',
      enabled: true,
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),
];
