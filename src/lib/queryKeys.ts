/**
 * Centralized query key factory for React Query.
 *
 * This module provides typed, consistent query keys for all API queries in the application.
 * Using a centralized factory ensures:
 * - Consistency across the codebase
 * - TypeScript autocomplete for query keys
 * - Easy refactoring when query structure changes
 * - Proper query invalidation and caching
 *
 * @module queryKeys
 */

export const queryKeys = {
  // ==================== Agent Queries ====================

  /**
   * Query key for fetching all agents (not agent-specific)
   * @returns {readonly ['agents']} Query key tuple
   */
  agents: () => ['agents'] as const,

  /**
   * Query key for fetching a single agent by ID
   * @param {string | undefined} agentId - The agent ID
   * @returns {readonly ['agent', string | undefined]} Query key tuple
   */
  agent: (agentId: string | undefined) => ['agent', agentId] as const,

  // ==================== Conversation Queries ====================

  /**
   * Query key for fetching conversations by agent
   * @param {string | undefined} agentId - The agent ID
   * @returns {readonly ['conversations', string | undefined]} Query key tuple
   */
  conversations: (agentId: string | undefined) => ['conversations', agentId] as const,

  /**
   * Query key for fetching messages in a conversation
   * @param {string | undefined} conversationId - The conversation ID
   * @param {string | undefined} agentId - The agent ID (for multi-level scoping)
   * @returns {readonly ['messages', string | undefined, string | undefined]} Query key tuple
   */
  messages: (conversationId: string | undefined, agentId: string | undefined) =>
    ['messages', conversationId, agentId] as const,

  // ==================== Knowledge Base Queries ====================

  /**
   * Query key for fetching knowledge bases by agent
   * @param {string | undefined} agentId - The agent ID
   * @returns {readonly ['knowledge-bases', string | undefined]} Query key tuple
   */
  knowledgeBases: (agentId: string | undefined) => ['knowledge-bases', agentId] as const,

  /**
   * Query key for fetching a single knowledge base
   * @param {string | undefined} knowledgeBaseId - The knowledge base ID
   * @param {string | undefined} agentId - The agent ID (for multi-level scoping)
   * @returns {readonly ['knowledge-base', string | undefined, string | undefined]} Query key tuple
   */
  knowledgeBase: (knowledgeBaseId: string | undefined, agentId: string | undefined) =>
    ['knowledge-base', knowledgeBaseId, agentId] as const,

  // ==================== Document Processing Job Queries ====================

  /**
   * Query key for fetching document processing jobs by agent
   * @param {string | undefined} agentId - The agent ID
   * @param {string | undefined} status - Optional status filter
   * @returns {readonly ['document-jobs', string | undefined, string | undefined]} Query key tuple
   */
  documentJobs: (agentId: string | undefined, status?: string) =>
    ['document-jobs', agentId, status] as const,

  /**
   * Query key for fetching a single document processing job
   * @param {string | undefined} jobId - The job ID
   * @returns {readonly ['document-job', string | undefined]} Query key tuple
   */
  documentJob: (jobId: string | undefined) => ['document-job', jobId] as const,

  // ==================== Team Queries ====================

  /**
   * Query key for fetching team members by agent
   * @param {string | undefined} agentId - The agent ID
   * @returns {readonly ['team-members', string | undefined]} Query key tuple
   */
  teamMembers: (agentId: string | undefined) => ['team-members', agentId] as const,

  /**
   * Query key for fetching team statistics by agent
   * @param {string | undefined} agentId - The agent ID
   * @returns {readonly ['team-stats', string | undefined]} Query key tuple
   */
  teamStats: (agentId: string | undefined) => ['team-stats', agentId] as const,

  // ==================== Connection Queries ====================

  /**
   * Query key for fetching platform connections by agent
   * @param {string | undefined} agentId - The agent ID
   * @returns {readonly ['connections', string | undefined]} Query key tuple
   */
  connections: (agentId: string | undefined) => ['connections', agentId] as const,

  /**
   * Query key for fetching connection health status
   * @param {string | undefined} connectionId - The connection ID
   * @returns {readonly ['connection-health', string | undefined]} Query key tuple
   */
  connectionHealth: (connectionId: string | undefined) => ['connection-health', connectionId] as const,

  /**
   * Query key for fetching available Facebook pages after OAuth
   * @param {string | null} tempConnectionId - Temporary connection ID from OAuth callback
   * @returns {readonly ['facebook-pages', string | null]} Query key tuple
   */
  facebookPages: (tempConnectionId: string | null) => ['facebook-pages', tempConnectionId] as const,

  /**
   * Query key for fetching available WhatsApp Business Accounts after OAuth
   * @param {string | null} tempConnectionId - Temporary connection ID from OAuth callback
   * @returns {readonly ['whatsapp-accounts', string | null]} Query key tuple
   */
  whatsappAccounts: (tempConnectionId: string | null) => ['whatsapp-accounts', tempConnectionId] as const,

  // ==================== Analytics Queries ====================

  /**
   * Query key for fetching analytics data by agent
   * @param {string | undefined} agentId - The agent ID
   * @returns {readonly ['analytics', string | undefined]} Query key tuple
   */
  analytics: (agentId: string | undefined) => ['analytics', agentId] as const,

  /**
   * Query key for fetching insights by agent
   * @param {string | undefined} agentId - The agent ID
   * @returns {readonly ['insights', string | undefined]} Query key tuple
   */
  insights: (agentId: string | undefined) => ['insights', agentId] as const,

  /**
   * Query key for fetching agent statistics
   * @param {string | undefined} agentId - The agent ID
   * @returns {readonly ['agent-stats', string | undefined]} Query key tuple
   */
  agentStats: (agentId: string | undefined) => ['agent-stats', agentId] as const,

  // ==================== Widget Queries ====================

  /**
   * Query key for fetching widget configuration by agent
   * @param {string | undefined} agentId - The agent ID
   * @returns {readonly ['widget', string | undefined]} Query key tuple
   */
  widget: (agentId: string | undefined) => ['widget', agentId] as const,

  // ==================== Lead Queries ====================

  /**
   * Query key for fetching leads by agent
   * @param {string | undefined} agentId - The agent ID
   * @returns {readonly ['leads', string | undefined]} Query key tuple
   */
  leads: (agentId: string | undefined) => ['leads', agentId] as const,

  /**
   * Query key for fetching a single lead by ID
   * @param {string | undefined} leadId - The lead ID
   * @returns {readonly ['lead', string | undefined]} Query key tuple
   */
  lead: (leadId: string | undefined) => ['lead', leadId] as const,

  /**
   * Query key for fetching lead statistics by agent
   * @param {string | undefined} agentId - The agent ID
   * @returns {readonly ['lead-stats', string | undefined]} Query key tuple
   */
  leadStats: (agentId: string | undefined) => ['lead-stats', agentId] as const,

  /**
   * Query key for fetching lead custom field definitions by agent
   * @param {string | undefined} agentId - The agent ID
   * @returns {readonly ['lead-field-defs', string | undefined]} Query key tuple
   */
  leadFieldDefs: (agentId: string | undefined) => ['lead-field-defs', agentId] as const,

  // ==================== User Queries ====================

  /**
   * Query key for fetching all users (not agent-specific)
   * @returns {readonly ['users']} Query key tuple
   */
  users: () => ['users'] as const,

  /**
   * Query key for fetching user role statistics (not agent-specific)
   * @returns {readonly ['user-role-stats']} Query key tuple
   */
  userRoleStats: () => ['user-role-stats'] as const,

  // ==================== Billing & Stripe Queries ====================

  /**
   * Query key for fetching invoice history
   * @param {number | undefined} limit - Optional limit for pagination
   * @returns {readonly ['billing', 'invoices', number | undefined]} Query key tuple
   */
  invoices: (limit?: number) => ['billing', 'invoices', limit] as const,

  /**
   * Query key for fetching current subscription details
   * @returns {readonly ['subscription', 'me']} Query key tuple
   */
  mySubscription: () => ['subscription', 'me'] as const,

  // ==================== Grounding Queries ====================

  /**
   * Query keys for Vertex AI grounding datastores
   */
  grounding: {
    /**
     * Query key for fetching all Vertex AI datastores
     * @returns {readonly ['grounding', 'datastores']} Query key tuple
     */
    datastores: () => ['grounding', 'datastores'] as const,

    /**
     * Query key for fetching documents in a specific datastore
     * @param {string | undefined} datastoreId - The datastore ID
     * @returns {readonly ['grounding', 'documents', string | undefined]} Query key tuple
     */
    documents: (datastoreId: string | undefined) => ['grounding', 'documents', datastoreId] as const,
  },
} as const;

/**
 * Type for all possible query keys in the application
 */
export type QueryKey = ReturnType<(typeof queryKeys)[keyof typeof queryKeys]>;
