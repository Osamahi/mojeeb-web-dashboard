import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Agent, KnowledgeBase } from '../types/agent.types';
import { logger } from '@/lib/logger';

interface AgentState {
  agents: Agent[];
  selectedAgent: Agent | null;
  globalSelectedAgent: Agent | null; // Global agent for all dashboard pages
  knowledgeBases: KnowledgeBase[];
  isLoading: boolean;
  isAgentSwitching: boolean; // Loading state during agent switch
  error: string | null;

  // Actions
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, agent: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  setSelectedAgent: (agent: Agent | null) => void;
  setGlobalSelectedAgent: (agent: Agent | null) => void;
  switchAgent: (agentId: string, onReload?: () => Promise<void>) => Promise<void>;
  initializeAgentSelection: () => void;
  setKnowledgeBases: (knowledgeBases: KnowledgeBase[]) => void;
  addKnowledgeBase: (kb: KnowledgeBase) => void;
  updateKnowledgeBase: (id: string, kb: Partial<KnowledgeBase>) => void;
  removeKnowledgeBase: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  agents: [],
  selectedAgent: null,
  globalSelectedAgent: null,
  knowledgeBases: [],
  isLoading: false,
  isAgentSwitching: false,
  error: null,
};

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAgents: (agents) => set((state) => {
        // Sync globalSelectedAgent with updated data from agents list
        const updatedGlobalAgent = state.globalSelectedAgent
          ? agents.find(a => a.id === state.globalSelectedAgent.id) || state.globalSelectedAgent
          : null;

        return {
          agents,
          globalSelectedAgent: updatedGlobalAgent
        };
      }),

      addAgent: (agent) =>
        set((state) => ({
          agents: [agent, ...state.agents],
        })),

      updateAgent: (id, updatedAgent) =>
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id ? { ...agent, ...updatedAgent } : agent
          ),
          selectedAgent:
            state.selectedAgent?.id === id
              ? { ...state.selectedAgent, ...updatedAgent }
              : state.selectedAgent,
          globalSelectedAgent:
            state.globalSelectedAgent?.id === id
              ? { ...state.globalSelectedAgent, ...updatedAgent }
              : state.globalSelectedAgent,
        })),

      removeAgent: (id) =>
        set((state) => ({
          agents: state.agents.filter((agent) => agent.id !== id),
          selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent,
          globalSelectedAgent: state.globalSelectedAgent?.id === id ? null : state.globalSelectedAgent,
        })),

      setSelectedAgent: (agent) => set({ selectedAgent: agent }),

      setGlobalSelectedAgent: (agent) => set({ globalSelectedAgent: agent }),

      switchAgent: async (agentId, onReload) => {
        const { agents } = get();
        const agent = agents.find((a) => a.id === agentId);

        if (!agent) {
          logger.error('Agent not found', new Error(`Agent ID: ${agentId}`));
          return;
        }

        set({ isAgentSwitching: true });

        try {
          // Update global selected agent
          set({ globalSelectedAgent: agent });

          // Trigger data reload if callback provided
          if (onReload) {
            await onReload();
          }
        } catch (error) {
          logger.error('Error switching agent', error instanceof Error ? error : new Error(String(error)));
          set({ error: error instanceof Error ? error.message : 'Failed to switch agent' });
        } finally {
          set({ isAgentSwitching: false });
        }
      },

      initializeAgentSelection: () => {
        const { agents, globalSelectedAgent } = get();

        // If no agent is selected and agents exist, select the first one
        if (!globalSelectedAgent && agents.length > 0) {
          set({ globalSelectedAgent: agents[0] });
        }

        // If selected agent was deleted, select first available agent
        if (globalSelectedAgent && !agents.find(a => a.id === globalSelectedAgent.id) && agents.length > 0) {
          set({ globalSelectedAgent: agents[0] });
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
            kb.id === id ? { ...kb, ...updatedKb } : kb
          ),
        })),

      removeKnowledgeBase: (id) =>
        set((state) => ({
          knowledgeBases: state.knowledgeBases.filter((kb) => kb.id !== id),
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: 'mojeeb-agent-storage',
      partialize: (state) => ({
        agents: state.agents,
        globalSelectedAgent: state.globalSelectedAgent
      }),
    }
  )
);

