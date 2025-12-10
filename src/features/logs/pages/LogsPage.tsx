/**
 * LogsPage Component
 * Azure-style application log streaming page
 * Real-time log viewer with filters and controls
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, Radio } from 'lucide-react';
import { useAgentContext } from '@/hooks/useAgentContext';
import { LogStreamTerminal } from '../components/LogStreamTerminal';
import { useLogStream } from '../hooks/useLogStream';
import { EmptyState } from '@/components/ui/EmptyState';
import type { LogEntry } from '../components/LogStreamTerminal';

export default function LogsPage() {
  const { currentAgent, isAgentSelected } = useAgentContext();
  const [logLevel, setLogLevel] = useState<'all' | 'critical' | 'error' | 'warning' | 'information' | 'debug'>('all');
  const [showApplicationLogs, setShowApplicationLogs] = useState(true);
  const [showWebServerLogs, setShowWebServerLogs] = useState(false);

  // Use log stream hook
  const {
    logs,
    isStreaming,
    isConnected,
    toggleStream,
    clearLogs,
    downloadLogs,
  } = useLogStream({
    agentId: currentAgent?.id,
    logLevel,
    maxBufferSize: 1000,
    autoStart: true,
  });

  // No agent selected
  if (!isAgentSelected) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <EmptyState
          icon={<Activity className="w-12 h-12 text-neutral-400" />}
          title="No Agent Selected"
          description="Please select an agent to view application logs"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6 h-[calc(100vh-80px)] flex flex-col"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-neutral-900">
              {currentAgent?.name || 'Agent'} | Log Stream
            </h1>
            {isConnected && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded-full">
                <Radio className="w-3.5 h-3.5 text-green-600 animate-pulse" />
                <span className="text-xs font-medium text-green-700">Live</span>
              </div>
            )}
          </div>
          <p className="text-sm text-neutral-600 mt-1">
            Real-time application logs and diagnostics
          </p>
        </div>

        {/* Log Type Selector (Azure-style radio buttons) */}
        <div className="flex items-center gap-4 bg-white border border-neutral-200 rounded-lg p-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="logType"
              checked={showApplicationLogs}
              onChange={() => {
                setShowApplicationLogs(true);
                setShowWebServerLogs(false);
              }}
              className="w-4 h-4 text-black focus:ring-black"
            />
            <span className="text-sm text-neutral-700">Application logs</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="logType"
              checked={showWebServerLogs}
              onChange={() => {
                setShowApplicationLogs(false);
                setShowWebServerLogs(true);
              }}
              className="w-4 h-4 text-black focus:ring-black"
            />
            <span className="text-sm text-neutral-700">Web server logs</span>
          </label>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Log Level Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-neutral-700">Log Level:</label>
            <select
              value={logLevel}
              onChange={(e) => setLogLevel(e.target.value as typeof logLevel)}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-sm bg-white"
            >
              <option value="all">All Levels</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="information">Information</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          {/* Info Message */}
          {showWebServerLogs && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm text-amber-800">
                Web server logs are currently disabled. Enable them in App Service settings.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 min-h-0">
        {showApplicationLogs ? (
          <LogStreamTerminal
            logs={logs}
            isStreaming={isStreaming}
            onToggleStream={toggleStream}
            onClear={clearLogs}
            onDownload={downloadLogs}
            maxLines={1000}
          />
        ) : (
          <div className="h-full bg-black rounded-lg border border-neutral-800 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 font-mono text-sm mb-2">
                Application logs are switched off. You can turn them on using the 'App Service logs' settings.
              </p>
              <p className="text-neutral-500 font-mono text-xs">
                Web server logs require additional configuration in Azure App Service.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-4">
          <span>Stream: {isStreaming ? 'Active' : 'Paused'}</span>
          <span>Connection: {isConnected ? 'Connected' : 'Disconnected'}</span>
          <span>Buffer: {logs.length} / 1000 logs</span>
        </div>
        <span className="text-neutral-400">
          Tip: Use Ctrl+F to search within the terminal
        </span>
      </div>
    </motion.div>
  );
}
