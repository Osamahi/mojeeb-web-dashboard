/**
 * Mojeeb Knowledge Base Editor Component
 * Clean list of knowledge bases with minimal design
 * Simplified for tab-based layout
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
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <>
      {/* Knowledge Base List */}
      <div className="space-y-4">
        {/* Add KB Button */}
        <div className="flex justify-end">
          <Button variant="primary" size="md" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Knowledge Base
          </Button>
        </div>

        {/* KB Cards */}
        {knowledgeBases.length > 0 ? (
          <div className="space-y-4">
            {knowledgeBases.map((kb) => (
              <KnowledgeBaseItem
                key={kb.id}
                knowledgeBase={kb}
                onUpdate={onRefetch}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-neutral-300">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
              <BookOpen className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-base font-medium text-neutral-950 mb-2">
              No Knowledge Bases Yet
            </h3>
            <p className="text-sm text-neutral-600 mb-6 max-w-md mx-auto">
              Add knowledge bases to provide context and information to your agent.
            </p>
            <Button
              variant="primary"
              size="md"
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
