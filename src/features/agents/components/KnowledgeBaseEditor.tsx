/**
 * Mojeeb Knowledge Base Editor Component
 * List and manage knowledge bases for an agent
 * Features: Add, edit, delete knowledge bases
 */

import { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import type { KnowledgeBase } from '../types/agent.types';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import KnowledgeBaseItem from './KnowledgeBaseItem';
import AddKnowledgeBaseModal from './AddKnowledgeBaseModal';

interface KnowledgeBaseEditorProps {
  agentId: string;
  knowledgeBases: KnowledgeBase[];
  isLoading?: boolean;
  onRefetch: () => void;
}

export default function KnowledgeBaseEditor({
  agentId,
  knowledgeBases,
  isLoading,
  onRefetch,
}: KnowledgeBaseEditorProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Knowledge Bases ({knowledgeBases.length})
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Add and manage knowledge bases for your agent
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add KB
          </Button>
        </div>

        {/* Knowledge Base List */}
        {knowledgeBases.length > 0 ? (
          <div className="space-y-3">
            {knowledgeBases.map((kb) => (
              <KnowledgeBaseItem
                key={kb.id}
                knowledgeBase={kb}
                agentId={agentId}
                onUpdate={onRefetch}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-neutral-300 rounded-lg">
            <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-950 mb-1">
              No knowledge bases yet
            </p>
            <p className="text-sm text-neutral-500 mb-4">
              Add knowledge bases to provide context to your agent
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Knowledge Base
            </Button>
          </div>
        )}
      </div>

      {/* Add Knowledge Base Modal */}
      <AddKnowledgeBaseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        agentId={agentId}
        onSuccess={onRefetch}
      />
    </>
  );
}
