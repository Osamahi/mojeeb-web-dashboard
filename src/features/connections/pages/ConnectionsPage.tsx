/**
 * Connections Page
 * Display and manage platform connections for the selected agent
 */

import { useState } from 'react';
import { Link2, RefreshCw, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useConnections } from '../hooks/useConnections';
import { ConnectionsList } from '../components/ConnectionsList';
import { AddConnectionModal } from '../components/AddConnectionModal';
import { useAgentContext } from '@/hooks/useAgentContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import NoAgentEmptyState from '@/features/agents/components/NoAgentEmptyState';

export default function ConnectionsPage() {
  const [showHealthStatus, setShowHealthStatus] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { agent: globalSelectedAgent } = useAgentContext();

  const { data: connections, isLoading, error, refetch, isFetching } = useConnections();

  // Show empty state if no agent is selected
  if (!globalSelectedAgent) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <NoAgentEmptyState
          title="No Agent Selected"
          message="Please select an agent from the dropdown above to view its platform connections."
          showCreateButton={false}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Connections</h1>
          <p className="text-neutral-600 mt-1">
            Platform connections for {globalSelectedAgent.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Health Check Toggle */}
          <Button
            variant={showHealthStatus ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowHealthStatus(!showHealthStatus)}
            className="flex items-center gap-2"
          >
            {showHealthStatus ? 'Hide Health Status' : 'Show Health Status'}
          </Button>

          {/* Add Connection Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Connection
          </Button>
        </div>
      </motion.div>

      {/* Connections List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {error ? (
          <Card>
            <EmptyState
              icon={<Link2 className="w-12 h-12 text-neutral-400" />}
              title="Error Loading Connections"
              description={
                error instanceof Error
                  ? error.message
                  : 'Failed to load platform connections. Please try again.'
              }
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="mt-4"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                  {isFetching ? 'Retrying...' : 'Retry'}
                </Button>
              }
            />
          </Card>
        ) : (
          <ConnectionsList
            connections={connections || []}
            isLoading={isLoading}
            showHealthStatus={showHealthStatus}
          />
        )}
      </motion.div>

      {/* Add Connection Modal */}
      <AddConnectionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
