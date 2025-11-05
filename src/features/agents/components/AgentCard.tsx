import { Link } from 'react-router-dom';
import { Edit2, Trash2, Crown, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent, AgentStatus } from '../types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const [showActions, setShowActions] = useState(false);

  const statusColors: Record<AgentStatus, string> = {
    draft: 'warning',
    active: 'success',
    deleted: 'danger',
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement delete confirmation modal
    console.log('Delete agent:', agent.id);
  };

  return (
    <Link to={`/agents/${agent.id}`}>
      <motion.div
        className={cn(
          'glass rounded-xl p-6 border border-neutral-200/50 shadow-glass',
          'transition-all duration-300 hover:shadow-float hover:scale-[1.02]',
          'relative overflow-hidden group'
        )}
        whileHover={{ y: -4 }}
      >
        {/* Background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={agent.avatarUrl}
                alt={agent.name}
                fallback={agent.name.charAt(0).toUpperCase()}
                size="lg"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-neutral-900 text-lg">
                    {agent.name}
                  </h3>
                  {agent.isOwner && (
                    <Crown className="w-4 h-4 text-amber-500" title="Owner" />
                  )}
                </div>
                <Badge
                  variant={statusColors[agent.status] as any}
                  size="sm"
                  className="mt-1"
                >
                  {agent.status}
                </Badge>
              </div>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-neutral-600" />
              </button>

              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 glass rounded-lg border border-neutral-200/50 shadow-float overflow-hidden z-20"
                    onMouseLeave={() => setShowActions(false)}
                  >
                    {agent.canEdit && (
                      <Link
                        to={`/agents/${agent.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-neutral-600" />
                        <span className="text-sm text-neutral-700">Edit</span>
                      </Link>
                    )}
                    {agent.canDelete && (
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 transition-colors text-left"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-600">Delete</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Description */}
          <p className="text-neutral-600 text-sm line-clamp-2 min-h-[40px]">
            {agent.description || 'No description provided'}
          </p>

          {/* Footer Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200/50">
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              {agent.knowledgeBaseCount !== undefined && (
                <div>
                  <span className="font-medium text-neutral-700">
                    {agent.knowledgeBaseCount}
                  </span>{' '}
                  Knowledge Bases
                </div>
              )}
              {agent.conversationCount !== undefined && (
                <div>
                  <span className="font-medium text-neutral-700">
                    {agent.conversationCount}
                  </span>{' '}
                  Conversations
                </div>
              )}
            </div>

            {/* View Details Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              View Details →
            </Button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
