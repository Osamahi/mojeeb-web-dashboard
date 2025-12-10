/**
 * Log Feature Types
 */

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'critical' | 'error' | 'warning' | 'information' | 'debug';
  message: string;
  source?: string;
  correlationId?: string;
}

export type LogLevel = LogEntry['level'] | 'all';

export interface LogStreamOptions {
  agentId?: string;
  logLevel?: LogLevel;
  maxBufferSize?: number;
  autoStart?: boolean;
}
