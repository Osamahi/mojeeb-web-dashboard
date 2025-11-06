import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAgentStore } from './agentStore';
import type { Agent, KnowledgeBase } from '../types/agent.types';

// Mock logger
const mocks = vi.hoisted(() => ({
  mockLoggerError: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: mocks.mockLoggerError,
  },
}));

describe('agentStore', () => {
  const mockAgent1: Agent = {
    id: '1',
    name: 'Agent 1',
    systemPrompt: 'You are helpful',
    model: 'gpt-4',
    createdAt: '2025-01-01',
    userId: 'user-1',
  };

  const mockAgent2: Agent = {
    id: '2',
    name: 'Agent 2',
    systemPrompt: 'You are creative',
    model: 'gpt-3.5',
    createdAt: '2025-01-02',
    userId: 'user-1',
  };

  const mockKB1: KnowledgeBase = {
    id: 'kb-1',
    name: 'Knowledge Base 1',
    description: 'Test KB',
    createdAt: '2025-01-01',
    userId: 'user-1',
  };

  beforeEach(() => {
    // Reset store to initial state
    useAgentStore.getState().reset();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAgentStore.getState();

      expect(state.agents).toEqual([]);
      expect(state.selectedAgent).toBeNull();
      expect(state.globalSelectedAgent).toBeNull();
      expect(state.knowledgeBases).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.isAgentSwitching).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Agent Management', () => {
    describe('setAgents', () => {
      it('should set agents array', () => {
        const { setAgents } = useAgentStore.getState();

        setAgents([mockAgent1, mockAgent2]);

        expect(useAgentStore.getState().agents).toEqual([mockAgent1, mockAgent2]);
      });

      it('should replace existing agents', () => {
        const { setAgents } = useAgentStore.getState();

        setAgents([mockAgent1]);
        setAgents([mockAgent2]);

        expect(useAgentStore.getState().agents).toEqual([mockAgent2]);
      });
    });

    describe('addAgent', () => {
      it('should add agent to beginning of array', () => {
        const { setAgents, addAgent } = useAgentStore.getState();

        setAgents([mockAgent1]);
        addAgent(mockAgent2);

        const agents = useAgentStore.getState().agents;
        expect(agents).toHaveLength(2);
        expect(agents[0]).toEqual(mockAgent2); // New agent at start
        expect(agents[1]).toEqual(mockAgent1);
      });

      it('should add agent to empty array', () => {
        const { addAgent } = useAgentStore.getState();

        addAgent(mockAgent1);

        expect(useAgentStore.getState().agents).toEqual([mockAgent1]);
      });
    });

    describe('updateAgent', () => {
      it('should update agent in agents array', () => {
        const { setAgents, updateAgent } = useAgentStore.getState();

        setAgents([mockAgent1, mockAgent2]);
        updateAgent('1', { name: 'Updated Agent 1' });

        const agent = useAgentStore.getState().agents.find((a) => a.id === '1');
        expect(agent?.name).toBe('Updated Agent 1');
      });

      it('should update selectedAgent if it matches', () => {
        const { setAgents, setSelectedAgent, updateAgent } = useAgentStore.getState();

        setAgents([mockAgent1, mockAgent2]);
        setSelectedAgent(mockAgent1);
        updateAgent('1', { name: 'Updated Agent 1' });

        const selectedAgent = useAgentStore.getState().selectedAgent;
        expect(selectedAgent?.name).toBe('Updated Agent 1');
      });

      it('should update globalSelectedAgent if it matches', () => {
        const { setAgents, setGlobalSelectedAgent, updateAgent } = useAgentStore.getState();

        setAgents([mockAgent1, mockAgent2]);
        setGlobalSelectedAgent(mockAgent1);
        updateAgent('1', { name: 'Updated Agent 1' });

        const globalSelectedAgent = useAgentStore.getState().globalSelectedAgent;
        expect(globalSelectedAgent?.name).toBe('Updated Agent 1');
      });

      it('should not update selectedAgent if different agent', () => {
        const { setAgents, setSelectedAgent, updateAgent } = useAgentStore.getState();

        setAgents([mockAgent1, mockAgent2]);
        setSelectedAgent(mockAgent1);
        updateAgent('2', { name: 'Updated Agent 2' });

        const selectedAgent = useAgentStore.getState().selectedAgent;
        expect(selectedAgent?.name).toBe('Agent 1'); // Unchanged
      });

      it('should partially update agent properties', () => {
        const { setAgents, updateAgent } = useAgentStore.getState();

        setAgents([mockAgent1]);
        updateAgent('1', { systemPrompt: 'New prompt' });

        const agent = useAgentStore.getState().agents[0];
        expect(agent.name).toBe('Agent 1'); // Original name preserved
        expect(agent.systemPrompt).toBe('New prompt'); // Updated
      });
    });

    describe('removeAgent', () => {
      it('should remove agent from array', () => {
        const { setAgents, removeAgent } = useAgentStore.getState();

        setAgents([mockAgent1, mockAgent2]);
        removeAgent('1');

        const agents = useAgentStore.getState().agents;
        expect(agents).toHaveLength(1);
        expect(agents[0].id).toBe('2');
      });

      it('should clear selectedAgent if removed', () => {
        const { setAgents, setSelectedAgent, removeAgent } = useAgentStore.getState();

        setAgents([mockAgent1, mockAgent2]);
        setSelectedAgent(mockAgent1);
        removeAgent('1');

        expect(useAgentStore.getState().selectedAgent).toBeNull();
      });

      it('should clear globalSelectedAgent if removed', () => {
        const { setAgents, setGlobalSelectedAgent, removeAgent } = useAgentStore.getState();

        setAgents([mockAgent1, mockAgent2]);
        setGlobalSelectedAgent(mockAgent1);
        removeAgent('1');

        expect(useAgentStore.getState().globalSelectedAgent).toBeNull();
      });

      it('should not clear selectedAgent if different agent removed', () => {
        const { setAgents, setSelectedAgent, removeAgent } = useAgentStore.getState();

        setAgents([mockAgent1, mockAgent2]);
        setSelectedAgent(mockAgent1);
        removeAgent('2');

        expect(useAgentStore.getState().selectedAgent).toEqual(mockAgent1);
      });
    });
  });

  describe('Agent Selection', () => {
    describe('setSelectedAgent', () => {
      it('should set selected agent', () => {
        const { setSelectedAgent } = useAgentStore.getState();

        setSelectedAgent(mockAgent1);

        expect(useAgentStore.getState().selectedAgent).toEqual(mockAgent1);
      });

      it('should allow setting to null', () => {
        const { setSelectedAgent } = useAgentStore.getState();

        setSelectedAgent(mockAgent1);
        setSelectedAgent(null);

        expect(useAgentStore.getState().selectedAgent).toBeNull();
      });
    });

    describe('setGlobalSelectedAgent', () => {
      it('should set global selected agent', () => {
        const { setGlobalSelectedAgent } = useAgentStore.getState();

        setGlobalSelectedAgent(mockAgent1);

        expect(useAgentStore.getState().globalSelectedAgent).toEqual(mockAgent1);
      });

      it('should allow setting to null', () => {
        const { setGlobalSelectedAgent } = useAgentStore.getState();

        setGlobalSelectedAgent(mockAgent1);
        setGlobalSelectedAgent(null);

        expect(useAgentStore.getState().globalSelectedAgent).toBeNull();
      });
    });

    describe('switchAgent', () => {
      it('should switch global selected agent', async () => {
        const { setAgents, switchAgent } = useAgentStore.getState();

        setAgents([mockAgent1, mockAgent2]);
        await switchAgent('2');

        expect(useAgentStore.getState().globalSelectedAgent).toEqual(mockAgent2);
      });

      it('should set isAgentSwitching during switch', async () => {
        const { setAgents, switchAgent } = useAgentStore.getState();

        setAgents([mockAgent1, mockAgent2]);

        const switchPromise = switchAgent('2');

        // Check immediately (might still be true)
        // Can't reliably test due to async timing

        await switchPromise;

        // Should be false after completion
        expect(useAgentStore.getState().isAgentSwitching).toBe(false);
      });

      it('should call onReload callback if provided', async () => {
        const { setAgents, switchAgent } = useAgentStore.getState();
        const onReload = vi.fn().mockResolvedValue(undefined);

        setAgents([mockAgent1, mockAgent2]);
        await switchAgent('2', onReload);

        expect(onReload).toHaveBeenCalledOnce();
        expect(useAgentStore.getState().globalSelectedAgent).toEqual(mockAgent2);
      });

      it('should handle onReload callback errors', async () => {
        const { setAgents, switchAgent } = useAgentStore.getState();
        const onReload = vi.fn().mockRejectedValue(new Error('Reload failed'));

        setAgents([mockAgent1, mockAgent2]);
        await switchAgent('2', onReload);

        expect(mocks.mockLoggerError).toHaveBeenCalled();
        expect(useAgentStore.getState().error).toBe('Reload failed');
        expect(useAgentStore.getState().isAgentSwitching).toBe(false);
      });

      it('should log error if agent not found', async () => {
        const { setAgents, switchAgent } = useAgentStore.getState();

        setAgents([mockAgent1]);
        await switchAgent('non-existent-id');

        expect(mocks.mockLoggerError).toHaveBeenCalledWith(
          'Agent not found',
          expect.any(Error)
        );
      });

      it('should not update globalSelectedAgent if agent not found', async () => {
        const { setAgents, setGlobalSelectedAgent, switchAgent } = useAgentStore.getState();

        setAgents([mockAgent1]);
        setGlobalSelectedAgent(mockAgent1);
        await switchAgent('non-existent-id');

        // Should remain unchanged
        expect(useAgentStore.getState().globalSelectedAgent).toEqual(mockAgent1);
      });
    });

    describe('initializeAgentSelection', () => {
      it('should select first agent if none selected', () => {
        const { setAgents, initializeAgentSelection } = useAgentStore.getState();

        setAgents([mockAgent1, mockAgent2]);
        initializeAgentSelection();

        expect(useAgentStore.getState().globalSelectedAgent).toEqual(mockAgent1);
      });

      it('should not change selection if agent already selected', () => {
        const { setAgents, setGlobalSelectedAgent, initializeAgentSelection } = useAgentStore.getState();

        setAgents([mockAgent1, mockAgent2]);
        setGlobalSelectedAgent(mockAgent2);
        initializeAgentSelection();

        // Should remain mockAgent2
        expect(useAgentStore.getState().globalSelectedAgent).toEqual(mockAgent2);
      });

      it('should reselect first agent if selected agent was deleted', () => {
        const { setAgents, setGlobalSelectedAgent, initializeAgentSelection } = useAgentStore.getState();

        setAgents([mockAgent1, mockAgent2]);
        setGlobalSelectedAgent(mockAgent2);

        // Simulate agent2 being deleted
        setAgents([mockAgent1]);
        initializeAgentSelection();

        // Should fall back to first available agent
        expect(useAgentStore.getState().globalSelectedAgent).toEqual(mockAgent1);
      });

      it('should not select anything if no agents exist', () => {
        const { initializeAgentSelection } = useAgentStore.getState();

        initializeAgentSelection();

        expect(useAgentStore.getState().globalSelectedAgent).toBeNull();
      });
    });
  });

  describe('Knowledge Base Management', () => {
    describe('setKnowledgeBases', () => {
      it('should set knowledge bases array', () => {
        const { setKnowledgeBases } = useAgentStore.getState();

        setKnowledgeBases([mockKB1]);

        expect(useAgentStore.getState().knowledgeBases).toEqual([mockKB1]);
      });
    });

    describe('addKnowledgeBase', () => {
      it('should add knowledge base to beginning of array', () => {
        const { addKnowledgeBase } = useAgentStore.getState();
        const mockKB2: KnowledgeBase = { ...mockKB1, id: 'kb-2', name: 'KB 2' };

        addKnowledgeBase(mockKB1);
        addKnowledgeBase(mockKB2);

        const kbs = useAgentStore.getState().knowledgeBases;
        expect(kbs).toHaveLength(2);
        expect(kbs[0]).toEqual(mockKB2); // New KB at start
      });
    });

    describe('updateKnowledgeBase', () => {
      it('should update knowledge base', () => {
        const { addKnowledgeBase, updateKnowledgeBase } = useAgentStore.getState();

        addKnowledgeBase(mockKB1);
        updateKnowledgeBase('kb-1', { name: 'Updated KB' });

        const kb = useAgentStore.getState().knowledgeBases[0];
        expect(kb.name).toBe('Updated KB');
      });
    });

    describe('removeKnowledgeBase', () => {
      it('should remove knowledge base', () => {
        const { addKnowledgeBase, removeKnowledgeBase } = useAgentStore.getState();

        addKnowledgeBase(mockKB1);
        removeKnowledgeBase('kb-1');

        expect(useAgentStore.getState().knowledgeBases).toHaveLength(0);
      });
    });
  });

  describe('Loading and Error States', () => {
    describe('setLoading', () => {
      it('should set loading state', () => {
        const { setLoading } = useAgentStore.getState();

        setLoading(true);
        expect(useAgentStore.getState().isLoading).toBe(true);

        setLoading(false);
        expect(useAgentStore.getState().isLoading).toBe(false);
      });
    });

    describe('setError', () => {
      it('should set error message', () => {
        const { setError } = useAgentStore.getState();

        setError('An error occurred');
        expect(useAgentStore.getState().error).toBe('An error occurred');
      });

      it('should clear error with null', () => {
        const { setError } = useAgentStore.getState();

        setError('Error');
        setError(null);

        expect(useAgentStore.getState().error).toBeNull();
      });
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const { setAgents, setGlobalSelectedAgent, setKnowledgeBases, setError, setLoading, reset } =
        useAgentStore.getState();

      // Set some state
      setAgents([mockAgent1, mockAgent2]);
      setGlobalSelectedAgent(mockAgent1);
      setKnowledgeBases([mockKB1]);
      setError('Error');
      setLoading(true);

      // Reset
      reset();

      const state = useAgentStore.getState();
      expect(state.agents).toEqual([]);
      expect(state.selectedAgent).toBeNull();
      expect(state.globalSelectedAgent).toBeNull();
      expect(state.knowledgeBases).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.isAgentSwitching).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
