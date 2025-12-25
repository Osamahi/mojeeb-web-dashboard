/**
 * useLogStream Hook
 * Real-time log streaming via Supabase Realtime or SignalR
 * Connects to backend log stream and maintains log buffer
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { LogEntry } from '../components/LogStreamTerminal';
import { channelRegistry } from '@/lib/supabaseChannelRegistry';

interface UseLogStreamOptions {
  agentId?: string;
  logLevel?: 'critical' | 'error' | 'warning' | 'information' | 'debug' | 'all';
  maxBufferSize?: number;
  autoStart?: boolean;
}

export function useLogStream({
  agentId,
  logLevel = 'all',
  maxBufferSize = 500,
  autoStart = true,
}: UseLogStreamOptions = {}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(autoStart);
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Start streaming
  const startStream = useCallback(() => {
    setIsStreaming(true);
  }, []);

  // Stop streaming
  const stopStream = useCallback(() => {
    setIsStreaming(false);
  }, []);

  // Toggle streaming
  const toggleStream = useCallback(() => {
    setIsStreaming((prev) => !prev);
  }, []);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Download logs as text file
  const downloadLogs = useCallback(() => {
    const logText = logs
      .map((log) => {
        const timestamp = log.timestamp.toISOString();
        const level = log.level.toUpperCase();
        const source = log.source ? `[${log.source}]` : '';
        const correlationId = log.correlationId ? `{${log.correlationId}}` : '';
        return `${timestamp} [${level}] ${source} ${correlationId} ${log.message}`;
      })
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mojeeb-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [logs]);

  // Add new log entry
  const addLog = useCallback(
    (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
      if (!isStreaming) return;

      const newLog: LogEntry = {
        ...log,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };

      setLogs((prev) => {
        const updated = [...prev, newLog];
        // Keep only the last maxBufferSize logs
        if (updated.length > maxBufferSize) {
          return updated.slice(-maxBufferSize);
        }
        return updated;
      });
    },
    [isStreaming, maxBufferSize]
  );

  // Subscribe to Supabase Realtime logs channel
  useEffect(() => {
    if (!isStreaming) return;

    // Create channel for log streaming
    const channel = supabase.channel('application-logs', {
      config: {
        broadcast: { self: true },
      },
    });

    // Subscribe to log broadcasts
    channel
      .on('broadcast', { event: 'log' }, (payload) => {
        const logData = payload.payload as Omit<LogEntry, 'id' | 'timestamp'>;

        // Filter by log level
        if (logLevel !== 'all') {
          const levels = ['critical', 'error', 'warning', 'information', 'debug'];
          const targetLevelIndex = levels.indexOf(logLevel);
          const logLevelIndex = levels.indexOf(logData.level);

          // Only show logs at or above the target level
          if (logLevelIndex > targetLevelIndex) return;
        }

        // Filter by agent ID if specified
        if (agentId && logData.source !== agentId) return;

        addLog(logData);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    subscriptionRef.current = channel;

    // Register channel for cleanup on logout
    channelRegistry.register(channel, 'application-logs');

    return () => {
      channelRegistry.unregister(channel);
      channel.unsubscribe();
      subscriptionRef.current = null;
      setIsConnected(false);
    };
  }, [isStreaming, agentId, logLevel, addLog]);

  // Mock log generator for testing (remove in production)
  useEffect(() => {
    if (!isStreaming || process.env.NODE_ENV === 'production') return;

    const levels: LogEntry['level'][] = ['debug', 'information', 'warning', 'error', 'critical'];
    const sources = ['AuthController', 'ChatController', 'AgentService', 'Database', 'GeminiAPI'];
    const messages = [
      'Request received',
      'Processing chat message',
      'Database query executed',
      'API call successful',
      'User authenticated',
      'Rate limit check passed',
      'Gemini API response received',
      'Connection timeout',
      'Validation failed',
      'Exception caught',
    ];

    const interval = setInterval(() => {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];

      addLog({
        level,
        source,
        message: `${message} (mock log for testing)`,
        correlationId: crypto.randomUUID(),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isStreaming, addLog]);

  return {
    logs,
    isStreaming,
    isConnected,
    startStream,
    stopStream,
    toggleStream,
    clearLogs,
    downloadLogs,
    addLog,
  };
}
