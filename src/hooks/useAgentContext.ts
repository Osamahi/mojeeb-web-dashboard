import { useAgentStore } from '@/features/agents/stores/agentStore';

/**
 * Universal agent context hook for accessing the globally selected agent.
 *
 * This hook provides a consistent interface for components to access agent context
 * without directly depending on the Zustand store implementation.
 *
 * @returns {Object} Agent context
 * @returns {Agent | null} agent - The currently selected agent
 * @returns {string | undefined} agentId - The ID of the currently selected agent
 * @returns {boolean} isAgentSelected - Whether an agent is currently selected
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { agent, agentId, isAgentSelected } = useAgentContext();
 *
 *   if (!isAgentSelected) {
 *     return <div>Please select an agent</div>;
 *   }
 *
 *   return <div>Current agent: {agent.name}</div>;
 * }
 * ```
 */
export function useAgentContext() {
  const globalSelectedAgent = useAgentStore((state) => state.globalSelectedAgent);

  return {
    agent: globalSelectedAgent,
    agentId: globalSelectedAgent?.id,
    isAgentSelected: !!globalSelectedAgent,
  };
}
