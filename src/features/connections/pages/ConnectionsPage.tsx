/**
 * Connections Page
 * Display and manage platform connections for the selected agent
 */

import { useState } from 'react';
import { Link2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useConnections, useDisconnectPlatform, useConnectionHealth } from '../hooks/useConnections';
import { ConnectedPlatformsSection } from '../components/sections/ConnectedPlatformsSection';
import { AvailablePlatformsSection } from '../components/sections/AvailablePlatformsSection';
import { AddConnectionModal } from '../components/AddConnectionModal';
import { DisconnectConfirmationDialog } from '../components/dialogs/DisconnectConfirmationDialog';
import { HealthCheckDialog } from '../components/dialogs/HealthCheckDialog';
import { useAgentContext } from '@/hooks/useAgentContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import NoAgentEmptyState from '@/features/agents/components/NoAgentEmptyState';
import type { PlatformType, PlatformConnection } from '../types';

export default function ConnectionsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(null);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [healthCheckDialogOpen, setHealthCheckDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<PlatformConnection | null>(null);

  const { agent: globalSelectedAgent } = useAgentContext();

  const { data: connections, isLoading, error, refetch, isFetching } = useConnections();
  const disconnectMutation = useDisconnectPlatform();
  const { data: healthStatus, isLoading: isLoadingHealth, error: healthError } = useConnectionHealth(
    healthCheckDialogOpen ? selectedConnection?.id : undefined
  );

  // Handle platform connection
  const handleConnect = (platformId: PlatformType) => {
    setSelectedPlatform(platformId);
    setIsAddModalOpen(true);
  };

  // Handle connection management
  const handleManageConnection = (connection: PlatformConnection) => {
    // TODO: Open connection management view
    console.log('Manage connection:', connection);
  };

  // Handle disconnection - Open confirmation dialog
  const handleDisconnect = (connection: PlatformConnection) => {
    setSelectedConnection(connection);
    setDisconnectDialogOpen(true);
  };

  // Confirm disconnection
  const confirmDisconnect = () => {
    if (selectedConnection) {
      disconnectMutation.mutate(selectedConnection.id, {
        onSuccess: () => {
          setDisconnectDialogOpen(false);
          setSelectedConnection(null);
        },
      });
    }
  };

  // Handle view health status - Open health check dialog
  const handleViewHealth = (connection: PlatformConnection) => {
    setSelectedConnection(connection);
    setHealthCheckDialogOpen(true);
  };

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
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Connections</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Platform connections for {globalSelectedAgent.name}
          </p>
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
        </motion.div>
      )}

      {/* Connected Platforms Section - Only show if there are connections */}
      {!error && !isLoading && connections && connections.length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ConnectedPlatformsSection
              connections={connections}
              isLoading={false}
              onManage={handleManageConnection}
              onDisconnect={handleDisconnect}
              onViewHealth={handleViewHealth}
            />
          </motion.div>

          {/* Divider - Only show when connected section is visible */}
          <div className="border-t border-neutral-200" />
        </>
      )}

      {/* Available Integrations Section */}
      {!error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AvailablePlatformsSection
            connections={connections || []}
            onConnect={handleConnect}
            isLoading={isLoading}
          />
        </motion.div>
      )}

      {/* Add Connection Modal */}
      <AddConnectionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedPlatform(null);
        }}
        initialPlatform={selectedPlatform}
      />

      {/* Disconnect Confirmation Dialog */}
      <DisconnectConfirmationDialog
        isOpen={disconnectDialogOpen}
        onClose={() => {
          setDisconnectDialogOpen(false);
          setSelectedConnection(null);
        }}
        onConfirm={confirmDisconnect}
        connection={selectedConnection}
        isDisconnecting={disconnectMutation.isPending}
      />

      {/* Health Check Dialog */}
      <HealthCheckDialog
        isOpen={healthCheckDialogOpen}
        onClose={() => {
          setHealthCheckDialogOpen(false);
          setSelectedConnection(null);
        }}
        connection={selectedConnection}
        healthStatus={healthStatus || null}
        isLoading={isLoadingHealth}
        error={healthError || null}
      />
    </div>
  );
}
