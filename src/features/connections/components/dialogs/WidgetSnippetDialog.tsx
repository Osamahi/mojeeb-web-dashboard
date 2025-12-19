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
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

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

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSnippet(text);
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

  // Code snippets for headless mode
  const customButtonSnippet = `<!-- Your custom button -->
<button
  id="my-chat-button"
  style="padding: 10px 20px;
         background: #00D084;
         color: white;
         border: none;
         border-radius: 8px;
         cursor: pointer;">
  Chat with us
</button>`;

  const attachWidgetSnippet = `<!-- Attach widget to your button -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    MojeebWidget.attach('#my-chat-button');
  });
</script>`;

  const completeExampleSnippet = `<!DOCTYPE html>
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
</html>`;

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
                      isLoading && selectedMode === modeOption.value
                        ? 'border-[#00D084] bg-[#F0FDF9] cursor-wait'
                        : isLoading
                        ? 'opacity-50 cursor-not-allowed'
                        : 'border-neutral-200 bg-white hover:border-[#00D084] hover:bg-[#F0FDF9] cursor-pointer'
                    }
                  `}
                >
                  {isLoading && selectedMode === modeOption.value ? (
                    // Show loading state INSIDE the selected card
                    <div className="flex-1 flex flex-col items-center justify-center py-4">
                      <Spinner size="md" />
                      <p className="mt-3 text-sm text-neutral-600">Loading widget code...</p>
                    </div>
                  ) : (
                    // Show normal card content
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
                  )}
                </button>
              ))}
            </div>

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
                    <div className="flex gap-3 items-start">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold mt-0.5">
                        1
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-neutral-900 mb-3">Copy the Widget Script</h4>
                        <div className="relative">
                          <button
                            onClick={() => handleCopy(snippet)}
                            className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-[#00D084] text-xs font-medium rounded transition-colors"
                          >
                            {isCopied && copiedSnippet === snippet ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy
                              </>
                            )}
                          </button>
                          <pre className="bg-neutral-900 text-neutral-100 rounded-lg p-3 overflow-x-auto text-xs font-mono max-w-full">
                            <code>{snippet}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Paste in HTML */}
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold mt-0.5">
                        2
                      </span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900">
                          Paste in Your HTML, right before the closing{' '}
                          <code className="px-1 py-0.5 bg-neutral-100 rounded text-xs">&lt;/body&gt;</code> tag
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Save and Publish */}
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold mt-0.5">
                        3
                      </span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900">Save and Publish</h4>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Headless Mode Instructions - 3 clear steps with detailed explanations
                <div className="space-y-6">
                  {/* Step 1: Create Custom Button */}
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold mt-0.5">
                        1
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-neutral-900 mb-3">Create Your Custom Button</h4>
                        <div className="relative">
                          <button
                            onClick={() => handleCopy(customButtonSnippet)}
                            className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-[#00D084] text-xs font-medium rounded transition-colors"
                          >
                            {isCopied && copiedSnippet === customButtonSnippet ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy
                              </>
                            )}
                          </button>
                          <pre className="bg-neutral-900 text-neutral-100 rounded-lg p-3 overflow-x-auto text-xs font-mono max-w-full">
                            <code>{customButtonSnippet}</code>
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
                    <div className="flex gap-3 items-start">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold mt-0.5">
                        2
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-neutral-900 mb-3">Add Script Before Closing &lt;/body&gt; Tag</h4>
                        <div className="relative">
                          <button
                            onClick={() => handleCopy(snippet)}
                            className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-[#00D084] text-xs font-medium rounded transition-colors"
                          >
                            {isCopied && copiedSnippet === snippet ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy
                              </>
                            )}
                          </button>
                          <pre className="bg-neutral-900 text-neutral-100 rounded-lg p-3 overflow-x-auto text-xs font-mono max-w-full">
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
                    <div className="flex gap-3 items-start">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D084] text-white text-xs font-bold mt-0.5">
                        3
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-neutral-900 mb-3">Attach Widget to Your Button</h4>
                        <div className="relative">
                          <button
                            onClick={() => handleCopy(attachWidgetSnippet)}
                            className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-[#00D084] text-xs font-medium rounded transition-colors"
                          >
                            {isCopied && copiedSnippet === attachWidgetSnippet ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy
                              </>
                            )}
                          </button>
                          <pre className="bg-neutral-900 text-neutral-100 rounded-lg p-3 overflow-x-auto text-xs font-mono max-w-full">
                            <code>{attachWidgetSnippet}</code>
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
                  <button
                    onClick={() => handleCopy(completeExampleSnippet)}
                    className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-[#00D084] text-xs font-medium rounded transition-colors"
                  >
                    {isCopied && copiedSnippet === completeExampleSnippet ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                  <pre className="bg-neutral-900 text-neutral-100 rounded-lg p-4 overflow-x-auto text-sm font-mono max-w-full">
                    <code>{completeExampleSnippet}</code>
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
