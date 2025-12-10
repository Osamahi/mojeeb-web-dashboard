/**
 * LogStreamTerminal Component
 * Azure-style terminal for real-time log streaming
 * Black background with colored log levels
 */

import { useEffect, useRef, useState } from 'react';
import { X, Download, Trash2, Pause, Play, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'critical' | 'error' | 'warning' | 'information' | 'debug';
  message: string;
  source?: string;
  correlationId?: string;
}

interface LogStreamTerminalProps {
  logs: LogEntry[];
  isStreaming: boolean;
  onToggleStream: () => void;
  onClear: () => void;
  onDownload: () => void;
  maxLines?: number;
}

const LOG_COLORS = {
  critical: 'text-red-500',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  information: 'text-white',
  debug: 'text-neutral-400',
};

const LOG_LABELS = {
  critical: 'CRT',
  error: 'ERR',
  warning: 'WRN',
  information: 'INF',
  debug: 'DBG',
};

export function LogStreamTerminal({
  logs,
  isStreaming,
  onToggleStream,
  onClear,
  onDownload,
  maxLines = 500,
}: LogStreamTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (terminalRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
      setAutoScroll(isAtBottom);
    }
  };

  // Filter logs by search query
  const filteredLogs = searchQuery
    ? logs.filter((log) =>
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.correlationId?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : logs;

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  return (
    <div className="flex flex-col h-full bg-black rounded-lg overflow-hidden border border-neutral-800">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm font-mono text-neutral-400">
            {isStreaming ? 'Live Stream' : 'Paused'} · {filteredLogs.length} logs
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Toggle */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded hover:bg-neutral-800 transition-colors ${
              isSearchOpen ? 'bg-neutral-800 text-white' : 'text-neutral-400'
            }`}
            title="Search logs"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={onToggleStream}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title={isStreaming ? 'Pause stream' : 'Resume stream'}
          >
            {isStreaming ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          {/* Clear */}
          <button
            onClick={onClear}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Download */}
          <button
            onClick={onDownload}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title="Download logs"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-neutral-800 bg-neutral-900"
          >
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full pl-9 pr-8 py-1.5 bg-black border border-neutral-700 rounded text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-600"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto font-mono text-sm p-4 space-y-1"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#404040 #000000',
        }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-neutral-600 text-sm">
              {searchQuery
                ? 'No logs match your search'
                : isStreaming
                ? 'Waiting for logs...'
                : 'Stream paused. Click play to resume.'}
            </p>
          </div>
        ) : (
          filteredLogs.slice(-maxLines).map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 hover:bg-neutral-900/50 px-2 py-1 -mx-2 rounded transition-colors group"
            >
              {/* Timestamp */}
              <span className="text-neutral-500 flex-shrink-0 select-text">
                {formatTime(log.timestamp)}
              </span>

              {/* Level Badge */}
              <span
                className={`${
                  LOG_COLORS[log.level]
                } font-bold flex-shrink-0 select-text`}
              >
                [{LOG_LABELS[log.level]}]
              </span>

              {/* Source (if available) */}
              {log.source && (
                <span className="text-blue-400 flex-shrink-0 select-text">
                  {log.source}
                </span>
              )}

              {/* Message */}
              <span className={`${LOG_COLORS[log.level]} flex-1 break-all select-text`}>
                {log.message}
              </span>

              {/* Correlation ID (hover to show) */}
              {log.correlationId && (
                <span className="text-neutral-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 select-text">
                  {log.correlationId.slice(0, 8)}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-4 right-4"
        >
          <button
            onClick={() => {
              setAutoScroll(true);
              if (terminalRef.current) {
                terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
              }
            }}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-full shadow-lg transition-colors"
          >
            ↓ Jump to bottom
          </button>
        </motion.div>
      )}
    </div>
  );
}
