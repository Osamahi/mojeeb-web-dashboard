import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAgentContext } from './useAgentContext';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import type { Agent } from '@/features/agents/types/agent.types';

describe('useAgentContext', () => {
  const mockAgent1: Agent = {
    id: 'agent-1',
    name: 'Test Agent 1',
    systemPrompt: 'You are helpful',
    model: 'gpt-4',
    createdAt: '2025-01-01',
    userId: 'user-1',
  };

  const mockAgent2: Agent = {
    id: 'agent-2',
    name: 'Test Agent 2',
    systemPrompt: 'You are creative',
    model: 'gpt-3.5',
    createdAt: '2025-01-02',
    userId: 'user-1',
  };

  beforeEach(() => {
    // Reset store to initial state
    useAgentStore.setState({
      agents: [],
      selectedAgent: null,
      globalSelectedAgent: null,
      knowledgeBases: [],
      isLoading: false,
      isAgentSwitching: false,
      error: null,
    });
  });

  describe('Initial State', () => {
    it('should return null agent when no agent is selected', () => {
      const { result } = renderHook(() => useAgentContext());

      expect(result.current.agent).toBeNull();
      expect(result.current.agentId).toBeUndefined();
      expect(result.current.isAgentSelected).toBe(false);
    });

    it('should return correct structure with all required properties', () => {
      const { result } = renderHook(() => useAgentContext());

      expect(result.current).toHaveProperty('agent');
      expect(result.current).toHaveProperty('agentId');
      expect(result.current).toHaveProperty('isAgentSelected');
    });
  });

  describe('Agent Selection', () => {
    it('should return agent data when agent is selected', () => {
      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });

      const { result } = renderHook(() => useAgentContext());

      expect(result.current.agent).toEqual(mockAgent1);
      expect(result.current.agentId).toBe('agent-1');
      expect(result.current.isAgentSelected).toBe(true);
    });

    it('should return correct agent properties', () => {
      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });

      const { result } = renderHook(() => useAgentContext());

      expect(result.current.agent?.id).toBe('agent-1');
      expect(result.current.agent?.name).toBe('Test Agent 1');
      expect(result.current.agent?.systemPrompt).toBe('You are helpful');
      expect(result.current.agent?.model).toBe('gpt-4');
    });

    it('should update when agent changes', () => {
      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });

      const { result, rerender } = renderHook(() => useAgentContext());

      expect(result.current.agentId).toBe('agent-1');

      // Change agent
      useAgentStore.setState({ globalSelectedAgent: mockAgent2 });
      rerender();

      expect(result.current.agentId).toBe('agent-2');
      expect(result.current.agent?.name).toBe('Test Agent 2');
    });

    it('should update when agent is cleared', () => {
      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });

      const { result, rerender } = renderHook(() => useAgentContext());

      expect(result.current.isAgentSelected).toBe(true);

      // Clear agent
      useAgentStore.setState({ globalSelectedAgent: null });
      rerender();

      expect(result.current.agent).toBeNull();
      expect(result.current.agentId).toBeUndefined();
      expect(result.current.isAgentSelected).toBe(false);
    });
  });

  describe('isAgentSelected Flag', () => {
    it('should be false when no agent is selected', () => {
      const { result } = renderHook(() => useAgentContext());

      expect(result.current.isAgentSelected).toBe(false);
    });

    it('should be true when agent is selected', () => {
      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });

      const { result } = renderHook(() => useAgentContext());

      expect(result.current.isAgentSelected).toBe(true);
    });

    it('should toggle correctly when agent is selected and cleared', () => {
      const { result, rerender } = renderHook(() => useAgentContext());

      expect(result.current.isAgentSelected).toBe(false);

      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });
      rerender();
      expect(result.current.isAgentSelected).toBe(true);

      useAgentStore.setState({ globalSelectedAgent: null });
      rerender();
      expect(result.current.isAgentSelected).toBe(false);
    });
  });

  describe('Agent ID Derivation', () => {
    it('should return undefined agentId when no agent selected', () => {
      const { result } = renderHook(() => useAgentContext());

      expect(result.current.agentId).toBeUndefined();
    });

    it('should return correct agentId when agent is selected', () => {
      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });

      const { result } = renderHook(() => useAgentContext());

      expect(result.current.agentId).toBe('agent-1');
    });

    it('should update agentId when different agent is selected', () => {
      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });

      const { result, rerender } = renderHook(() => useAgentContext());

      expect(result.current.agentId).toBe('agent-1');

      useAgentStore.setState({ globalSelectedAgent: mockAgent2 });
      rerender();

      expect(result.current.agentId).toBe('agent-2');
    });

    it('should return undefined agentId when agent is cleared', () => {
      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });

      const { result, rerender } = renderHook(() => useAgentContext());

      expect(result.current.agentId).toBe('agent-1');

      useAgentStore.setState({ globalSelectedAgent: null });
      rerender();

      expect(result.current.agentId).toBeUndefined();
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should return same data across multiple hook instances', () => {
      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });

      const { result: result1 } = renderHook(() => useAgentContext());
      const { result: result2 } = renderHook(() => useAgentContext());

      expect(result1.current.agent).toEqual(result2.current.agent);
      expect(result1.current.agentId).toBe(result2.current.agentId);
      expect(result1.current.isAgentSelected).toBe(result2.current.isAgentSelected);
    });

    it('should update all instances when store changes', () => {
      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });

      const { result: result1, rerender: rerender1 } = renderHook(() => useAgentContext());
      const { result: result2, rerender: rerender2 } = renderHook(() => useAgentContext());

      expect(result1.current.agentId).toBe('agent-1');
      expect(result2.current.agentId).toBe('agent-1');

      // Change agent
      useAgentStore.setState({ globalSelectedAgent: mockAgent2 });
      rerender1();
      rerender2();

      expect(result1.current.agentId).toBe('agent-2');
      expect(result2.current.agentId).toBe('agent-2');
    });
  });

  describe('Store Integration', () => {
    it('should read from globalSelectedAgent not selectedAgent', () => {
      // Set selectedAgent but not globalSelectedAgent
      useAgentStore.setState({
        selectedAgent: mockAgent1,
        globalSelectedAgent: null,
      });

      const { result } = renderHook(() => useAgentContext());

      // Should use globalSelectedAgent which is null
      expect(result.current.agent).toBeNull();
      expect(result.current.isAgentSelected).toBe(false);
    });

    it('should reflect globalSelectedAgent even when selectedAgent differs', () => {
      useAgentStore.setState({
        selectedAgent: mockAgent1,
        globalSelectedAgent: mockAgent2,
      });

      const { result } = renderHook(() => useAgentContext());

      // Should use globalSelectedAgent (agent2)
      expect(result.current.agent?.id).toBe('agent-2');
      expect(result.current.agentId).toBe('agent-2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid agent changes', () => {
      const { result, rerender } = renderHook(() => useAgentContext());

      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });
      rerender();
      expect(result.current.agentId).toBe('agent-1');

      useAgentStore.setState({ globalSelectedAgent: mockAgent2 });
      rerender();
      expect(result.current.agentId).toBe('agent-2');

      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });
      rerender();
      expect(result.current.agentId).toBe('agent-1');

      useAgentStore.setState({ globalSelectedAgent: null });
      rerender();
      expect(result.current.agentId).toBeUndefined();
    });

    it('should handle agent object with minimal properties', () => {
      const minimalAgent: Agent = {
        id: 'minimal-1',
        name: 'Minimal',
        systemPrompt: 'Test',
        model: 'gpt-4',
        createdAt: '2025-01-01',
        userId: 'user-1',
      };

      useAgentStore.setState({ globalSelectedAgent: minimalAgent });

      const { result } = renderHook(() => useAgentContext());

      expect(result.current.agent).toEqual(minimalAgent);
      expect(result.current.agentId).toBe('minimal-1');
      expect(result.current.isAgentSelected).toBe(true);
    });

    it('should maintain referential stability when agent object is same', () => {
      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });

      const { result, rerender } = renderHook(() => useAgentContext());
      const firstAgent = result.current.agent;

      // Set the same agent object again
      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });
      rerender();

      expect(result.current.agent).toBe(firstAgent);
    });
  });

  describe('Return Value Consistency', () => {
    it('should always return object with three properties', () => {
      const { result } = renderHook(() => useAgentContext());

      const keys = Object.keys(result.current);
      expect(keys).toHaveLength(3);
      expect(keys).toContain('agent');
      expect(keys).toContain('agentId');
      expect(keys).toContain('isAgentSelected');
    });

    it('should maintain consistent types across renders', () => {
      const { result, rerender } = renderHook(() => useAgentContext());

      // No agent
      expect(result.current.agent).toBeNull();
      expect(typeof result.current.agentId).toBe('undefined');
      expect(typeof result.current.isAgentSelected).toBe('boolean');

      // With agent
      useAgentStore.setState({ globalSelectedAgent: mockAgent1 });
      rerender();

      expect(typeof result.current.agent).toBe('object');
      expect(typeof result.current.agentId).toBe('string');
      expect(typeof result.current.isAgentSelected).toBe('boolean');
    });
  });
});
