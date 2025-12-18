/**
 * Widget Snippet Dialog Component
 * Two-step wizard: Mode selection → Installation instructions
 */

import { useState, useEffect } from 'react';
import { Copy, Check, Code, ArrowLeft } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { widgetService } from '../../services/widgetService';
import { useAgentContext } from '@/hooks/useAgentContext';
import { type WidgetMode, WIDGET_MODES } from '../../types/widget.types';

export interface WidgetSnippetDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 'mode-selection' | 'installation';

export function WidgetSnippetDialog({ isOpen, onClose }: WidgetSnippetDialogProps) {
  const { agent } = useAgentContext();
  const [currentStep, setCurrentStep] = useState<WizardStep>('mode-selection');
  const [selectedMode, setSelectedMode] = useState<WidgetMode | null>(null);
  const [snippet, setSnippet] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Reset wizard when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('mode-selection');
      setSelectedMode(null);
      setSnippet('');
      setError(null);
      setIsCopied(false);
    }
  }, [isOpen]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const fetchSnippet = async (mode: WidgetMode) => {
    if (!agent) return;

    setIsLoading(true);
    setError(null);

    try {
      const snippetData = await widgetService.getWidgetSnippet(agent.id, mode);
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

  const handleModeSelect = async (mode: WidgetMode) => {
    setSelectedMode(mode);
    setIsLoading(true);
    setError(null);

    try {
      const snippetData = await widgetService.getWidgetSnippet(agent!.id, mode);
      setSnippet(snippetData);
      setCurrentStep('installation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load widget snippet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep('mode-selection');
    setIsCopied(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentStep === 'mode-selection' ? 'Choose Integration Type' : 'Install Widget Code'}
      size="lg"
    >
      {/* Scrollable Content Area */}
      <div className="relative flex-1 overflow-y-auto px-6 py-4">
        {/* Step 1: Mode Selection */}
        <div
          className={`
            space-y-6 transition-all duration-500 ease-in-out
            ${
              currentStep === 'mode-selection'
                ? 'translate-x-0 opacity-100 relative'
                : '-translate-x-full opacity-0 absolute inset-0 pointer-events-none h-0 overflow-hidden'
            }
          `}
        >
          <>
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">
                Select how you want to integrate the chat widget into your website
              </p>
            </div>

            <div className="space-y-3">
              {WIDGET_MODES.map((modeOption) => (
                <button
                  key={modeOption.value}
                  onClick={() => handleModeSelect(modeOption.value)}
                  disabled={isLoading}
                  className={`
                    w-full flex items-start gap-4 p-5 border-2 rounded-lg text-left transition-all
                    ${
                      isLoading
                        ? 'opacity-50 cursor-not-allowed'
                        : 'border-neutral-200 bg-white hover:border-[#00D084] hover:bg-[#F0FDF9] cursor-pointer'
                    }
                  `}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-neutral-900">
                        {modeOption.label}
                      </span>
                      {modeOption.badge && (
                        <span
                          className={`
                            text-xs font-medium px-2 py-0.5 rounded
                            ${
                              modeOption.badgeVariant === 'recommended'
                                ? 'bg-[#00D084] text-white'
                                : 'bg-neutral-600 text-white'
                            }
                          `}
                        >
                          {modeOption.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                      {modeOption.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-8">
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
                  onClick={() => selectedMode && handleModeSelect(selectedMode)}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            )}
          </>
        </div>

        {/* Step 2: Installation Instructions */}
        <div
          className={`
            space-y-6 transition-all duration-500 ease-in-out
            ${
              currentStep === 'installation'
                ? 'translate-x-0 opacity-100 relative'
                : 'translate-x-full opacity-0 absolute inset-0 pointer-events-none h-0 overflow-hidden'
            }
          `}
        >
          {selectedMode && snippet && (
          <>
            {/* Installation Instructions - Conditional based on mode */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-neutral-900">
                Installation Instructions
              </h3>

              {selectedMode === 'default' ? (
                // Default Mode Instructions
                <div className="space-y-6">
                  {/* Step 1: Copy Widget Script */}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold">
                        1
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-neutral-900">Copy the Widget Script</h4>
                          <Button
                            variant={isCopied ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={handleCopy}
                            className="flex items-center gap-2"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy Code
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-neutral-600 mb-3">
                          Click "Copy Code" to copy the widget script below.
                        </p>
                        <div className="relative">
                          <pre className="bg-neutral-900 text-neutral-100 rounded-lg p-3 overflow-x-auto text-xs font-mono">
                            <code>{snippet}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Paste in HTML */}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold">
                        2
                      </span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900 mb-1">Paste in Your HTML</h4>
                        <p className="text-sm text-neutral-600">
                          Paste the code in your website's HTML, right before the closing{' '}
                          <code className="px-1 py-0.5 bg-neutral-100 rounded text-xs">&lt;/body&gt;</code> tag.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Save and Publish */}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold">
                        3
                      </span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900 mb-1">Save and Publish</h4>
                        <p className="text-sm text-neutral-600">
                          Save your changes and publish your website. The widget will appear automatically with a launcher button in the bottom-right corner.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Headless Mode Instructions - 3 clear steps with detailed explanations
                <div className="space-y-6">
                  {/* Step 1: Create Custom Button */}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold">
                        1
                      </span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900 mb-1">Create Your Custom Button</h4>
                        <p className="text-sm text-neutral-600 mb-3">
                          Add this button anywhere in your HTML <code className="px-1 py-0.5 bg-neutral-100 rounded text-xs">&lt;body&gt;</code> where you want it to appear (e.g., header, footer, or main content).
                        </p>
                        <div className="relative">
                          <pre className="bg-neutral-900 text-neutral-100 rounded-lg p-3 overflow-x-auto text-xs font-mono">
                            <code>{`<!-- Your custom button -->
<button
  id="my-chat-button"
  style="padding: 10px 20px;
         background: #00D084;
         color: white;
         border: none;
         border-radius: 8px;
         cursor: pointer;">
  Chat with us
</button>`}</code>
                          </pre>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">
                          💡 <strong>Tip:</strong> The button ID <code className="px-1 py-0.5 bg-neutral-100 rounded">my-chat-button</code> is important - you'll use it in Step 3.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Add Widget Script */}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold">
                        2
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-neutral-900">Add the Mojeeb Widget Script</h4>
                          <Button
                            variant={isCopied ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={handleCopy}
                            className="flex items-center gap-2"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy Code
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-neutral-600 mb-3">
                          Paste this code in your HTML, right before the closing <code className="px-1 py-0.5 bg-neutral-100 rounded text-xs">&lt;/body&gt;</code> tag.
                        </p>
                        <div className="relative">
                          <pre className="bg-neutral-900 text-neutral-100 rounded-lg p-3 overflow-x-auto text-xs font-mono">
                            <code>{snippet}</code>
                          </pre>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">
                          💡 <strong>Tip:</strong> This code contains your unique widget ID - don't modify it.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Attach Widget to Button */}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold">
                        3
                      </span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900 mb-1">Attach Widget to Your Button</h4>
                        <p className="text-sm text-neutral-600 mb-3">
                          Add this code right after the widget script (still before <code className="px-1 py-0.5 bg-neutral-100 rounded text-xs">&lt;/body&gt;</code>).
                        </p>
                        <div className="relative">
                          <pre className="bg-neutral-900 text-neutral-100 rounded-lg p-3 overflow-x-auto text-xs font-mono">
                            <code>{`<!-- Attach widget to your button -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    MojeebWidget.attach('#my-chat-button');
  });
</script>`}</code>
                          </pre>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">
                          💡 <strong>Tip:</strong> The <code className="px-1 py-0.5 bg-neutral-100 rounded">#my-chat-button</code> selector must match your button's ID from Step 1.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Complete Example - Only show for headless mode */}
            {selectedMode === 'headless' && (
              <div className="space-y-3 border-t border-neutral-200 pt-6">
                <h3 className="text-sm font-semibold text-neutral-900">
                  ✅ Complete Code Example
                </h3>
                <p className="text-xs text-neutral-600 mb-3">
                  Here's how all three steps look together in your HTML:
                </p>
                <div className="relative">
                  <pre className="bg-neutral-900 text-neutral-100 rounded-lg p-4 overflow-x-auto text-sm font-mono">
                    <code>{`<!DOCTYPE html>
<html>
<body>
  <!-- Step 1: Your custom button (place anywhere in body) -->
  <button id="my-chat-button" style="padding: 10px 20px; background: #00D084; color: white; border: none; border-radius: 8px; cursor: pointer;">
    Chat with us
  </button>

  <!-- Your website content... -->

  <!-- Step 2: Mojeeb Widget Script (before </body>) -->
${snippet}

  <!-- Step 3: Attach widget to button (after widget script) -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      MojeebWidget.attach('#my-chat-button');
    });
  </script>
</body>
</html>`}</code>
                  </pre>
                </div>
              </div>
            )}
          </>
          )}
        </div>
      </div>

      {/* Sticky Actions Footer - Pinned to bottom */}
      <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 border-t border-neutral-200 bg-white rounded-b-2xl">
        {currentStep === 'installation' ? (
          <>
            <Button variant="secondary" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </>
        ) : (
          <div className="w-full flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
