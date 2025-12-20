/**
 * Public Widget Installation Page
 * Accessible via shareable link with token
 * No authentication required
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { installationLinkService } from '@/features/connections/services/installationLinkService';
import type { InstallationData } from '@/features/connections/services/installationLinkService';

export function InstallWidgetPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<InstallationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isExampleCopied, setIsExampleCopied] = useState(false);
  const [isHeadlessCopied, setIsHeadlessCopied] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'default' | 'headless' | null>(null);

  useEffect(() => {
    const fetchInstallationData = async () => {
      if (!token) {
        setError('Invalid installation link');
        setIsLoading(false);
        return;
      }

      try {
        const installData = await installationLinkService.getInstallationData(token);
        setData(installData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load installation instructions. This link may have expired.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstallationData();
  }, [token]);

  const handleCopy = async () => {
    if (!data?.snippet) return;

    try {
      await navigator.clipboard.writeText(data.snippet);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy snippet:', err);
    }
  };

  const handleCopyExample = async () => {
    const exampleCode = `  ...
  <!-- Your website content -->

  <!-- Mojeeb Chat Widget -->
  <script id="mojeeb-chat-widget"...></script>
</body>
</html>`;

    try {
      await navigator.clipboard.writeText(exampleCode);
      setIsExampleCopied(true);
      setTimeout(() => setIsExampleCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy example:', err);
    }
  };

  const handleCopyHeadless = async () => {
    const headlessCode = `<script>
  document.addEventListener('DOMContentLoaded', function() {
    MojeebWidget.attach('#your-button-id');
  });
</script>`;

    try {
      await navigator.clipboard.writeText(headlessCode);
      setIsHeadlessCopied(true);
      setTimeout(() => setIsHeadlessCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy headless code:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#00D084] animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 text-sm">Loading installation instructions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg border border-neutral-200 p-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h1 className="text-lg font-semibold text-neutral-900">Link Expired or Invalid</h1>
          </div>
          <p className="text-sm text-neutral-600 mb-6">
            {error || 'This installation link is no longer valid. Please request a new link from your Mojeeb administrator.'}
          </p>
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <p className="text-xs text-neutral-500">
              <strong>Note:</strong> Installation links expire after 30 days for security purposes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state - Show installation instructions
  const expiresAt = new Date(data.expiresAt);
  const isExpiringSoon = expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // Less than 7 days

  const modeOptions = [
    {
      value: 'default' as const,
      label: 'Simple (Recommended)',
      description: 'Automatic floating chat button - just paste one script and you\'re done',
      badge: 'Easiest',
    },
    {
      value: 'headless' as const,
      label: 'Advanced',
      description: 'Use your own custom button to trigger the chat widget',
      badge: 'Custom',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#00D084] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Install</h1>
          </div>
          <p className="text-neutral-600">
            Add this chat widget to your website in just a few steps
          </p>

          {/* Expiration warning */}
          {isExpiringSoon && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                ⚠️ This installation link will expire on {expiresAt.toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {!selectedMode ? (
            // Mode Selection Screen
            <div className="p-8 space-y-6">
              <div className="space-y-1 mb-6">
                <h2 className="text-lg font-semibold text-neutral-900">Choose Integration Type</h2>
                <p className="text-sm text-neutral-600">
                  Select how you want to integrate the chat widget into your website
                </p>
              </div>

              <div className="space-y-3">
                {modeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedMode(option.value)}
                    className="w-full text-left border-2 border-neutral-200 rounded-lg p-4 hover:border-[#00D084] hover:bg-neutral-50 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-neutral-900 group-hover:text-[#00D084] transition-colors">
                            {option.label}
                          </h3>
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#00D084] text-white">
                            {option.badge}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                          {option.description}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-neutral-400 group-hover:text-[#00D084] transition-colors flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : selectedMode === 'default' ? (
            // Default Mode Instructions
            <div className="p-8 space-y-8">
              {/* Back button */}
              <button
                onClick={() => setSelectedMode(null)}
                className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to mode selection
              </button>

              {/* Step 1 */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#00D084] text-white text-sm font-bold">
                    1
                  </span>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-3">
                      Copy the Widget Code
                    </h2>
                    <div className="relative">
                      <button
                        onClick={handleCopy}
                        className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-[#00D084] text-sm font-medium rounded transition-colors"
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
                      </button>
                      <pre className="bg-neutral-900 text-neutral-100 rounded-lg p-4 pr-4 pb-12 sm:pr-32 sm:pb-4 overflow-x-auto text-sm font-mono break-all whitespace-pre-wrap">
                        <code className="break-all">{data.snippet}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#00D084] text-white text-sm font-bold">
                    2
                  </span>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-3">
                      Paste Before Closing &lt;/body&gt; Tag
                    </h2>
                    <p className="text-neutral-600 text-sm mb-4">
                      Open your website's HTML file and paste the code right before the closing{' '}
                      <code className="px-2 py-1 bg-neutral-100 rounded text-xs font-mono">&lt;/body&gt;</code>{' '}
                      tag, then save and publish your changes.
                    </p>
                    <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-neutral-500">
                          <strong>Example placement:</strong>
                        </p>
                        <button
                          onClick={handleCopyExample}
                          className="text-xs font-medium text-[#00D084] hover:text-[#00B570] transition-colors flex items-center gap-1"
                        >
                          {isExampleCopied ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-xs font-mono text-neutral-700 overflow-x-auto">
{`  ...
  <!-- Your website content -->

  <!-- Mojeeb Chat Widget -->
  <script id="mojeeb-chat-widget"...></script>
</body>
</html>`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success note */}
              <div className="bg-[#F0FDF9] border border-[#00D084]/20 rounded-lg p-4">
                <p className="text-sm text-neutral-700">
                  ✅ <strong>That's it!</strong> Your chat widget will appear on your website immediately after you publish the changes.
                </p>
              </div>
            </div>
          ) : (
            // Headless Mode Instructions
            <div className="p-8 space-y-8">
              {/* Back button */}
              <button
                onClick={() => setSelectedMode(null)}
                className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to mode selection
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  <strong>Headless Mode:</strong> You're using a custom button to trigger the chat widget. Follow all 3 steps carefully.
                </p>
              </div>

              {/* Headless steps - simplified for public page */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#00D084] text-white text-sm font-bold">
                    1
                  </span>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                      Add the Widget Script
                    </h2>
                    <p className="text-neutral-600 text-sm mb-3">
                      Copy the code below and paste it before the closing <code className="px-2 py-1 bg-neutral-100 rounded text-xs font-mono">&lt;/body&gt;</code> tag
                    </p>
                    <div className="relative">
                      <button
                        onClick={handleCopy}
                        className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-[#00D084] text-sm font-medium rounded transition-colors"
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
                      </button>
                      <pre className="bg-neutral-900 text-neutral-100 rounded-lg p-4 pr-4 pb-12 sm:pr-32 sm:pb-4 overflow-x-auto text-sm font-mono break-all whitespace-pre-wrap">
                        <code className="break-all">{data.snippet}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#00D084] text-white text-sm font-bold">
                    2
                  </span>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                      Attach to Your Custom Button
                    </h2>
                    <p className="text-neutral-600 text-sm mb-3">
                      Use JavaScript to connect the widget to your existing button:
                    </p>
                    <div className="relative">
                      <button
                        onClick={handleCopyHeadless}
                        className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-[#00D084] text-sm font-medium rounded transition-colors"
                      >
                        {isHeadlessCopied ? (
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
                      </button>
                      <pre className="bg-neutral-900 text-neutral-100 rounded-lg p-4 pr-4 pb-12 sm:pr-32 sm:pb-4 overflow-x-auto text-sm font-mono break-all whitespace-pre-wrap">
                        <code className="break-all">{`<script>
  document.addEventListener('DOMContentLoaded', function() {
    MojeebWidget.attach('#your-button-id');
  });
</script>`}</code>
                      </pre>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">
                      Replace <code className="px-1 py-0.5 bg-neutral-100 rounded">#your-button-id</code> with your button's CSS selector
                    </p>
                  </div>
                </div>
              </div>

              {/* Success note */}
              <div className="bg-[#F0FDF9] border border-[#00D084]/20 rounded-lg p-4">
                <p className="text-sm text-neutral-700">
                  ✅ <strong>Done!</strong> Your custom button will now open the chat widget when clicked.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-500">
            Powered by{' '}
            <a
              href="https://mojeeb.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00D084] hover:underline font-medium"
            >
              Mojeeb
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
