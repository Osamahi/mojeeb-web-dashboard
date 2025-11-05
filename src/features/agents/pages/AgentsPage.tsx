/**
 * Mojeeb Minimal Agents Page
 * Clean agents list with search and vertical cards
 * NO animations, NO glass effects - just professional simplicity
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { agentService } from '../services/agentService';
import AgentCard from '../components/AgentCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState('');

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

  // Client-side search filtering (optional UX enhancement)
  const filteredAgents = agents?.filter((agent) => {
    const query = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(query) ||
      agent.description?.toLowerCase().includes(query)
    );
  });

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

      {/* Search Bar - Minimal */}
      <div className="bg-white rounded-lg p-4 border border-neutral-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search agents by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Agents List - Vertical Cards */}
      {filteredAgents && filteredAgents.length > 0 ? (
        <div className="space-y-4">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title={searchQuery ? 'No agents found' : 'No agents yet'}
          description={
            searchQuery
              ? 'Try adjusting your search query'
              : 'Create your first AI agent to get started'
          }
          action={
            !searchQuery ? (
              <Link to="/agents/new">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Agent
                </Button>
              </Link>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
