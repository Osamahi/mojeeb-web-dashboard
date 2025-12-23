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

      setAgents: (agents) => {
        const stack = new Error().stack;
        console.log(`\n📊 [AgentStore] setAgents called at ${new Date().toISOString()}`);
        console.log(`   New agents count: ${agents.length}`);
        if (agents.length > 0) {
          console.log(`   First agent: ${agents[0].name} (ID: ${agents[0].id})`);
          console.log(`   Organization: ${agents[0].organizationName || 'N/A'} (ID: ${agents[0].organizationId})`);
        }
        console.log(`   📍 Called from:\n${stack}`);

        return set((state) => {
          // Sync globalSelectedAgent with updated data from agents list
          const updatedGlobalAgent = state.globalSelectedAgent
            ? agents.find(a => a.id === state.globalSelectedAgent.id) || state.globalSelectedAgent
            : null;

          console.log(`   Updated globalSelectedAgent: ${updatedGlobalAgent ? `${updatedGlobalAgent.name} (${updatedGlobalAgent.id})` : 'null'}`);

          return {
            agents,
            globalSelectedAgent: updatedGlobalAgent
          };
        });
      },

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

      reset: () => {
        const stack = new Error().stack;
        console.log(`\n🔄 [AgentStore] reset() called at ${new Date().toISOString()}`);
        console.log(`   Current agents count: ${get().agents.length}`);
        console.log(`   Current globalSelectedAgent: ${get().globalSelectedAgent ? `${get().globalSelectedAgent.name} (${get().globalSelectedAgent.id})` : 'null'}`);
        console.log(`   📍 Called from:\n${stack}`);
        console.log(`   ✅ Resetting to initialState (empty agents array)`);
        return set(initialState);
      },
    }),
    {
      name: 'mojeeb-agent-storage',
      partialize: (state) => {
        const dataToPartialize = {
          agents: state.agents,
          globalSelectedAgent: state.globalSelectedAgent
        };
        console.log(`   📝 [AgentStore.partialize] Selecting data to persist:`);
        console.log(`      - agents count: ${dataToPartialize.agents.length}`);
        console.log(`      - globalSelectedAgent: ${dataToPartialize.globalSelectedAgent ? `${dataToPartialize.globalSelectedAgent.name} (${dataToPartialize.globalSelectedAgent.id})` : 'null'}`);
        return dataToPartialize;
      },
      onRehydrateStorage: () => {
        console.log(`\n💧 [AgentStore.onRehydrateStorage] Starting rehydration process...`);

        const rawStorage = localStorage.getItem('mojeeb-agent-storage');
        console.log(`   📊 Raw localStorage value: ${rawStorage ? 'EXISTS' : 'MISSING'} (${rawStorage?.length || 0} chars)`);
        if (rawStorage) {
          try {
            const parsed = JSON.parse(rawStorage);
            console.log(`   📊 Parsed localStorage structure:`);
            console.log(`      - state.agents count: ${parsed?.state?.agents?.length || 0}`);
            if (parsed?.state?.agents?.length > 0) {
              console.log(`      - First agent: ${parsed.state.agents[0].name} (ID: ${parsed.state.agents[0].id})`);
              console.log(`      - Organization: ${parsed.state.agents[0].organizationName || 'N/A'} (ID: ${parsed.state.agents[0].organizationId})`);
            }
            console.log(`      - state.globalSelectedAgent: ${parsed?.state?.globalSelectedAgent ? `${parsed.state.globalSelectedAgent.name} (${parsed.state.globalSelectedAgent.id})` : 'null'}`);
          } catch (e) {
            console.error(`   ❌ Failed to parse localStorage JSON:`, e);
          }
        }

        return (state) => {
          console.log(`\n💧 [AgentStore] Rehydration callback executing at ${new Date().toISOString()}`);
          console.log(`   📊 Rehydrated state received:`);
          console.log(`      - agents count: ${state?.agents?.length || 0}`);
          if (state?.agents && state.agents.length > 0) {
            console.log(`      - First agent: ${state.agents[0].name} (ID: ${state.agents[0].id})`);
            console.log(`      - Organization: ${state.agents[0].organizationName || 'N/A'} (ID: ${state.agents[0].organizationId})`);
          }
          console.log(`      - globalSelectedAgent: ${state?.globalSelectedAgent ? `${state.globalSelectedAgent.name} (${state.globalSelectedAgent.id})` : 'null'}`);
          console.log(`   🏁 Rehydration complete`);
        };
      },
    }
  )
);

// DIAGNOSTIC: Monitor localStorage changes for debugging agent persistence bug
if (typeof window !== 'undefined') {
  // Listen for localStorage changes
  window.addEventListener('storage', (event) => {
    if (event.key === 'mojeeb-agent-storage') {
      console.warn(`\n🔄 [Storage Event] localStorage['mojeeb-agent-storage'] changed externally at ${new Date().toISOString()}`);
      console.warn(`   Triggered by: ${event.url || 'unknown source'}`);
      console.warn(`   Old value: ${event.oldValue ? 'EXISTS (' + event.oldValue.length + ' chars)' : 'MISSING'}`);
      console.warn(`   New value: ${event.newValue ? 'EXISTS (' + event.newValue.length + ' chars)' : 'MISSING'}`);

      if (event.newValue && event.oldValue) {
        try {
          const oldData = JSON.parse(event.oldValue);
          const newData = JSON.parse(event.newValue);
          console.warn(`   Old agents count: ${oldData?.state?.agents?.length || 0}`);
          console.warn(`   New agents count: ${newData?.state?.agents?.length || 0}`);
          if (oldData?.state?.agents?.length > 0) {
            console.warn(`   Old first agent: ${oldData.state.agents[0].name} (${oldData.state.agents[0].id})`);
          }
          if (newData?.state?.agents?.length > 0) {
            console.warn(`   New first agent: ${newData.state.agents[0].name} (${newData.state.agents[0].id})`);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  });

  // Override localStorage.setItem to log all writes to mojeeb-agent-storage
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key: string, value: string) {
    if (key === 'mojeeb-agent-storage') {
      const stack = new Error().stack;
      console.log(`\n💾 [localStorage.setItem] Writing to 'mojeeb-agent-storage' at ${new Date().toISOString()}`);
      console.log(`   Data size: ${value.length} chars`);
      try {
        const parsed = JSON.parse(value);
        console.log(`   Agents count: ${parsed?.state?.agents?.length || 0}`);
        if (parsed?.state?.agents?.length > 0) {
          console.log(`   First agent: ${parsed.state.agents[0].name} (ID: ${parsed.state.agents[0].id})`);
          console.log(`   Organization: ${parsed.state.agents[0].organizationName || 'N/A'}`);
        }
        console.log(`   GlobalSelectedAgent: ${parsed?.state?.globalSelectedAgent ? `${parsed.state.globalSelectedAgent.name} (${parsed.state.globalSelectedAgent.id})` : 'null'}`);
      } catch (e) {
        // Ignore parse errors
      }
      console.log(`   📍 Write triggered from:\n${stack}`);
    }
    return originalSetItem.apply(this, [key, value]);
  };

  // Override localStorage.removeItem to log all removals
  const originalRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function(key: string) {
    if (key === 'mojeeb-agent-storage') {
      const stack = new Error().stack;
      const existingValue = localStorage.getItem(key);
      console.log(`\n🗑️ [localStorage.removeItem] Removing 'mojeeb-agent-storage' at ${new Date().toISOString()}`);
      console.log(`   Existing value: ${existingValue ? 'EXISTS (' + existingValue.length + ' chars)' : 'MISSING'}`);
      if (existingValue) {
        try {
          const parsed = JSON.parse(existingValue);
          console.log(`   Being removed - Agents count: ${parsed?.state?.agents?.length || 0}`);
          if (parsed?.state?.agents?.length > 0) {
            console.log(`   Being removed - First agent: ${parsed.state.agents[0].name} (${parsed.state.agents[0].id})`);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      console.log(`   📍 Removal triggered from:\n${stack}`);
    }
    return originalRemoveItem.apply(this, [key]);
  };

  console.log('🔍 [AgentStore] localStorage monitoring enabled for mojeeb-agent-storage');
}
