/**
 * Development Logger Utility
 *
 * Provides structured logging that:
 * - Only logs in development environment
 * - Supports log levels (debug, info, warn, error)
 * - Formats logs consistently with timestamps
 * - Easy to disable in production builds
 *
 * Usage:
 *   logger.debug('[Component]', 'Debug message', { data });
 *   logger.info('[Component]', 'Info message', { data });
 *   logger.warn('[Component]', 'Warning message', { context });
 *   logger.error('[Component]', 'Error occurred', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  timestamp: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enabled: import.meta.env.DEV, // Only enabled in development
      timestamp: true,
      ...config,
    };
  }

  private formatMessage(level: LogLevel, component: string, message: string): string {
    const timestamp = this.config.timestamp
      ? `[${new Date().toISOString()}]`
      : '';
    return `${timestamp} [${level.toUpperCase()}] ${component} ${message}`.trim();
  }

  debug(component: string, message: string, ...args: unknown[]): void {
    if (!this.config.enabled) return;
    console.log(this.formatMessage('debug', component, message), ...args);
  }

  info(component: string, message: string, ...args: unknown[]): void {
    if (!this.config.enabled) return;
    console.log(this.formatMessage('info', component, message), ...args);
  }

  warn(component: string, message: string, ...args: unknown[]): void {
    if (!this.config.enabled) return;
    console.warn(this.formatMessage('warn', component, message), ...args);
  }

  error(component: string, message: string, ...args: unknown[]): void {
    if (!this.config.enabled) return;
    console.error(this.formatMessage('error', component, message), ...args);
  }

  /**
   * Enable or disable logging at runtime
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Check if logging is currently enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing or custom configurations
export { Logger };
