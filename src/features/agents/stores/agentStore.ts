import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Agent, KnowledgeBase } from '../types/agent.types';
import { logger } from '@/lib/logger';
import { agentService } from '../services/agentService';

/**
 * Agent store.
 *
 * Owns ONLY ambient single-agent state — `globalSelectedAgent` (the agent
 * the entire dashboard is currently scoped to) and `selectedAgent` (the
 * agent for one-off operations). The full list of agents lives in React
 * Query via `useInfiniteAgents`; this store deliberately does NOT cache it.
 *
 * Why no list cache: with cursor pagination we can't keep "the list" in a
 * single state slot — pages load incrementally, filters drop them, etc.
 * Code that needs an agent by id calls `switchAgent(id)` which goes
 * through `agentService.getAgent(id)` (cached server-side per-agent).
 */

interface AgentState {
  selectedAgent: Agent | null;
  globalSelectedAgent: Agent | null;
  knowledgeBases: KnowledgeBase[];
  isAgentSwitching: boolean;
  error: string | null;

  // Selection actions
  setSelectedAgent: (agent: Agent | null) => void;
  setGlobalSelectedAgent: (agent: Agent | null) => void;
  /**
   * Switch the global agent context to the agent with the given id. Fetches
   * the agent by id (cached) — works regardless of which cursor page the
   * agent currently lives on.
   */
  switchAgent: (agentId: string, onReload?: () => Promise<void>) => Promise<void>;

  // Knowledge base actions (unchanged from prior store)
  setKnowledgeBases: (knowledgeBases: KnowledgeBase[]) => void;
  addKnowledgeBase: (kb: KnowledgeBase) => void;
  updateKnowledgeBase: (id: string, kb: Partial<KnowledgeBase>) => void;
  removeKnowledgeBase: (id: string) => void;

  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  selectedAgent: null,
  globalSelectedAgent: null,
  knowledgeBases: [],
  isAgentSwitching: false,
  error: null,
};

export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      ...initialState,

      setSelectedAgent: (agent) => set({ selectedAgent: agent }),

      setGlobalSelectedAgent: (agent) => set({ globalSelectedAgent: agent }),

      switchAgent: async (agentId, onReload) => {
        set({ isAgentSwitching: true });
        try {
          const agent = await agentService.getAgent(agentId);
          set({ globalSelectedAgent: agent });
          if (onReload) {
            await onReload();
          }
        } catch (error) {
          logger.error(
            'Error switching agent',
            error instanceof Error ? error : new Error(String(error)),
            { agentId },
          );
          set({ error: error instanceof Error ? error.message : 'Failed to switch agent' });
        } finally {
          set({ isAgentSwitching: false });
        }
      },

      setKnowledgeBases: (knowledgeBases) => set({ knowledgeBases }),

      addKnowledgeBase: (kb) =>
        set((state) => ({
          knowledgeBases: [kb, ...state.knowledgeBases],
        })),

      updateKnowledgeBase: (id, updatedKb) =>
        set((state) => ({
          knowledgeBases: state.knowledgeBases.map((kb) =>
            kb.id === id ? { ...kb, ...updatedKb } : kb,
          ),
        })),

      removeKnowledgeBase: (id) =>
        set((state) => ({
          knowledgeBases: state.knowledgeBases.filter((kb) => kb.id !== id),
        })),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: 'mojeeb-agent-storage',
      // Only persist the global selection so users return to the same agent
      // after a reload. Knowledge bases / errors / switching state are
      // ephemeral.
      partialize: (state) => ({
        globalSelectedAgent: state.globalSelectedAgent,
      }),
    },
  ),
);
