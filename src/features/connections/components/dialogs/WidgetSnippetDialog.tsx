/**
 * Widget Snippet Dialog Component
 * Displays widget installation code and instructions
 */

import { useState, useEffect } from 'react';
import { Copy, Check, Code } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { widgetService } from '../../services/widgetService';
import { useAgentContext } from '@/hooks/useAgentContext';

export interface WidgetSnippetDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WidgetSnippetDialog({ isOpen, onClose }: WidgetSnippetDialogProps) {
  const { agent } = useAgentContext();
  const [snippet, setSnippet] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch snippet when dialog opens
  useEffect(() => {
    if (isOpen && agent) {
      fetchSnippet();
    }
  }, [isOpen, agent]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const fetchSnippet = async () => {
    if (!agent) return;

    setIsLoading(true);
    setError(null);

    try {
      const snippetData = await widgetService.getWidgetSnippet(agent.id);
      setSnippet(snippetData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load widget snippet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setIsCopied(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Embed Mojeeb Chat Widget"
      size="lg"
    >
      <div className="space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-neutral-600">Loading widget code...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchSnippet}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Snippet Display */}
        {!isLoading && !error && snippet && (
          <>
            {/* Installation Code Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Installation Code
                </h3>
                <Button
                  variant={isCopied ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={handleCopy}
                  className="flex items-center gap-2"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>

              {/* Code Block */}
              <div className="relative">
                <pre className="bg-neutral-900 text-neutral-100 rounded-lg p-4 overflow-x-auto text-sm font-mono">
                  <code>{snippet}</code>
                </pre>
              </div>
            </div>

            {/* Installation Instructions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-neutral-900">
                Installation Instructions
              </h3>
              <ol className="space-y-3 text-sm text-neutral-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold">
                    1
                  </span>
                  <span>
                    Copy the code snippet above
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold">
                    2
                  </span>
                  <span>
                    Paste it in your website's HTML, right before the closing <code className="px-1 py-0.5 bg-neutral-100 rounded text-xs">&lt;/body&gt;</code> tag
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold">
                    3
                  </span>
                  <span>
                    The widget will appear on the bottom-right corner of your website
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold">
                    4
                  </span>
                  <span>
                    Customize the widget appearance in Widget Settings
                  </span>
                </li>
              </ol>
            </div>

          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
