/**
 * Mojeeb No Agent Empty State Component
 * Displays when no agent is selected or no agents exist
 * Provides clear call-to-action to create an agent
 */

import { Bot, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

interface NoAgentEmptyStateProps {
  title?: string;
  message?: string;
  showCreateButton?: boolean;
}

export default function NoAgentEmptyState({
  title = 'No Agent Selected',
  message = 'Please select an agent from the dropdown above to get started, or create your first agent.',
  showCreateButton = true,
}: NoAgentEmptyStateProps) {
  const navigate = useNavigate();

  const handleCreateAgent = () => {
    navigate('/agents/new');
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-neutral-100 rounded-full mb-6">
          <Bot className="w-10 h-10 text-neutral-400" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-neutral-950 mb-3">
          {title}
        </h3>

        {/* Message */}
        <p className="text-neutral-600 mb-6">
          {message}
        </p>

        {/* Create Agent Button */}
        {showCreateButton && (
          <Button
            onClick={handleCreateAgent}
            className="inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Agent
          </Button>
        )}
      </div>
    </div>
  );
}
