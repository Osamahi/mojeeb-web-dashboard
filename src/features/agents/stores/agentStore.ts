import { create } from 'zustand';
import type { Agent, KnowledgeBase } from '../types/agent.types';

interface AgentState {
  agents: Agent[];
  selectedAgent: Agent | null;
  knowledgeBases: KnowledgeBase[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, agent: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  setSelectedAgent: (agent: Agent | null) => void;
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
  knowledgeBases: [],
  isLoading: false,
  error: null,
};

export const useAgentStore = create<AgentState>((set) => ({
  ...initialState,

  setAgents: (agents) => set({ agents }),

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
    })),

  removeAgent: (id) =>
    set((state) => ({
      agents: state.agents.filter((agent) => agent.id !== id),
      selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent,
    })),

  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

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
}));
