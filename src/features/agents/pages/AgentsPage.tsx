/**
 * Mojeeb Minimal Agents Page
 * Clean agents list with search and vertical cards
 * NO animations, NO glass effects - just professional simplicity
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { agentService } from '../services/agentService';
import { useAgentStore } from '../stores/agentStore';
import AgentCard from '../components/AgentCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AgentsPage() {
  const setAgents = useAgentStore((state) => state.setAgents);

  // Fetch agents - backend handles role-based filtering
  const { data: agents, isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      console.log('Fetching agents...');
      try {
        const result = await agentService.getAgents();
        console.log('Agents fetched:', result);
        return result;
      } catch (err) {
        console.error('Error in getAgents:', err);
        throw err;
      }
    },
  });

  // Sync agents to Zustand store when data changes
  useEffect(() => {
    if (agents) {
      setAgents(agents);
    }
  }, [agents, setAgents]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    console.error('Error loading agents:', error);
    return (
      <div className="p-6">
        <EmptyState
          icon={Search}
          title="Error Loading Agents"
          description={`Failed to load agents: ${error instanceof Error ? error.message : 'Unknown error'}`}
        />
        <div className="mt-4 p-4 bg-error/5 border border-error/20 rounded-lg">
          <pre className="text-xs text-error whitespace-pre-wrap">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header - Clean & Minimal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-950">AI Agents</h1>
          <p className="text-neutral-600 mt-1">
            Manage your intelligent AI assistants
          </p>
        </div>
        <Link to="/agents/new">
          <Button variant="primary" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Create Agent
          </Button>
        </Link>
      </div>

      {/* Agents List - Vertical Cards */}
      {agents && agents.length > 0 ? (
        <div className="space-y-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No agents yet"
          description="Create your first AI agent to get started"
          action={
            <Link to="/agents/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
