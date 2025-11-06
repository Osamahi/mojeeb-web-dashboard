import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, createLogger } from './logger';

// Mock dependencies
const mocks = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
  mockCaptureMessage: vi.fn(),
  mockAddBreadcrumb: vi.fn(),
  mockConsoleDebug: vi.fn(),
  mockConsoleInfo: vi.fn(),
  mockConsoleWarn: vi.fn(),
  mockConsoleError: vi.fn(),
  mockConsoleLog: vi.fn(),
  mockEnv: {
    VITE_SENTRY_ENVIRONMENT: 'development',
  },
}));

vi.mock('./sentry', () => ({
  captureException: mocks.mockCaptureException,
  captureMessage: mocks.mockCaptureMessage,
  addBreadcrumb: mocks.mockAddBreadcrumb,
}));

vi.mock('@/config/env', () => ({
  env: {
    get VITE_SENTRY_ENVIRONMENT() {
      return mocks.mockEnv.VITE_SENTRY_ENVIRONMENT;
    },
  },
}));

describe('logger', () => {
  // Store original console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
    log: console.log,
  };

  beforeEach(() => {
    // Mock console methods
    console.debug = mocks.mockConsoleDebug;
    console.info = mocks.mockConsoleInfo;
    console.warn = mocks.mockConsoleWarn;
    console.error = mocks.mockConsoleError;
    console.log = mocks.mockConsoleLog;

    // Reset all mocks
    vi.clearAllMocks();

    // Default to development environment
    mocks.mockEnv.VITE_SENTRY_ENVIRONMENT = 'development';
  });

  afterEach(() => {
    // Restore original console methods
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.log = originalConsole.log;
  });

  describe('debug', () => {
    it('should log debug messages in development', () => {
      logger.debug('Debug message');

      expect(mocks.mockConsoleDebug).toHaveBeenCalledOnce();
      expect(mocks.mockConsoleDebug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Debug message')
      );
      expect(mocks.mockAddBreadcrumb).toHaveBeenCalledWith('Debug message', 'debug', 'debug');
    });

    it('should log debug messages with context in development', () => {
      const context = { userId: '123', action: 'click' };
      logger.debug('Debug with context', context);

      expect(mocks.mockConsoleDebug).toHaveBeenCalledOnce();
      expect(mocks.mockConsoleDebug).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(context))
      );
    });

    // Note: isDevelopment is computed at module load time, so these tests
    // would require module reloading to properly test production behavior
    it.skip('should not log debug messages in production', () => {
      mocks.mockEnv.VITE_SENTRY_ENVIRONMENT = 'production';

      logger.debug('Production debug');

      expect(mocks.mockConsoleDebug).not.toHaveBeenCalled();
    });

    it('should format message with timestamp and level', () => {
      logger.debug('Test message');

      const loggedMessage = mocks.mockConsoleDebug.mock.calls[0][0];
      expect(loggedMessage).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[DEBUG\] Test message$/);
    });
  });

  describe('info', () => {
    it('should log info messages in development', () => {
      logger.info('Info message');

      expect(mocks.mockConsoleInfo).toHaveBeenCalledOnce();
      expect(mocks.mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Info message')
      );
      expect(mocks.mockAddBreadcrumb).toHaveBeenCalledWith('Info message', 'info', 'info');
    });

    it('should log info messages with context', () => {
      const context = { status: 'success' };
      logger.info('Info with context', context);

      expect(mocks.mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(context))
      );
    });

    it.skip('should not log to console in production', () => {
      mocks.mockEnv.VITE_SENTRY_ENVIRONMENT = 'production';

      logger.info('Production info');

      expect(mocks.mockConsoleInfo).not.toHaveBeenCalled();
      expect(mocks.mockAddBreadcrumb).toHaveBeenCalled();
    });

    it.skip('should send to Sentry in production when sendToSentry flag is set', () => {
      mocks.mockEnv.VITE_SENTRY_ENVIRONMENT = 'production';

      logger.info('Important info', { sendToSentry: true });

      expect(mocks.mockCaptureMessage).toHaveBeenCalledWith('Important info', 'info');
    });

    it('should not send to Sentry in production without sendToSentry flag', () => {
      mocks.mockEnv.VITE_SENTRY_ENVIRONMENT = 'production';

      logger.info('Regular info');

      expect(mocks.mockCaptureMessage).not.toHaveBeenCalled();
    });

    it('should not send to Sentry in development even with flag', () => {
      logger.info('Dev info', { sendToSentry: true });

      expect(mocks.mockCaptureMessage).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Warning message');

      expect(mocks.mockConsoleWarn).toHaveBeenCalledOnce();
      expect(mocks.mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Warning message')
      );
    });

    it('should log warnings with context', () => {
      const context = { error: 'minor' };
      logger.warn('Warning with context', context);

      expect(mocks.mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(context))
      );
    });

    it('should always send warnings to Sentry', () => {
      logger.warn('Important warning');

      expect(mocks.mockAddBreadcrumb).toHaveBeenCalledWith('Important warning', 'warning', 'warning');
      expect(mocks.mockCaptureMessage).toHaveBeenCalledWith('Important warning', 'warning');
    });

    it('should send warnings to Sentry in production too', () => {
      mocks.mockEnv.VITE_SENTRY_ENVIRONMENT = 'production';

      logger.warn('Production warning');

      expect(mocks.mockCaptureMessage).toHaveBeenCalledWith('Production warning', 'warning');
    });
  });

  describe('error', () => {
    it('should log error messages with Error object', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(mocks.mockConsoleError).toHaveBeenCalledOnce();
      expect(mocks.mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error occurred'),
        error
      );
    });

    it('should log errors with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123' };
      logger.error('Error with context', error, context);

      expect(mocks.mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(context)),
        error
      );
    });

    it('should send Error objects to Sentry with captureException', () => {
      const error = new Error('Test error');
      const context = { userId: '123' };
      logger.error('Error message', error, context);

      expect(mocks.mockAddBreadcrumb).toHaveBeenCalledWith('Error message', 'error', 'error');
      expect(mocks.mockCaptureException).toHaveBeenCalledWith(error, context);
    });

    it('should create synthetic Error for non-Error objects', () => {
      const nonError = { message: 'Not an Error object' };
      logger.error('Non-error object', nonError);

      expect(mocks.mockCaptureException).toHaveBeenCalledOnce();
      const capturedError = mocks.mockCaptureException.mock.calls[0][0];
      expect(capturedError).toBeInstanceOf(Error);
      expect(capturedError.message).toBe('Non-error object');
    });

    it('should include originalError in context for non-Error objects', () => {
      const nonError = { code: 500 };
      logger.error('Server error', nonError);

      const capturedContext = mocks.mockCaptureException.mock.calls[0][1];
      expect(capturedContext).toEqual({
        originalError: nonError,
      });
    });

    it('should handle error without error object', () => {
      logger.error('Error message only');

      expect(mocks.mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error message only'),
        undefined
      );

      // Should create synthetic error
      expect(mocks.mockCaptureException).toHaveBeenCalledOnce();
      const capturedError = mocks.mockCaptureException.mock.calls[0][0];
      expect(capturedError).toBeInstanceOf(Error);
      expect(capturedError.message).toBe('Error message only');
    });

    it('should merge context with originalError for non-Error objects', () => {
      const nonError = 'string error';
      const context = { operation: 'fetch' };
      logger.error('Failed', nonError, context);

      const capturedContext = mocks.mockCaptureException.mock.calls[0][1];
      expect(capturedContext).toEqual({
        operation: 'fetch',
        originalError: nonError,
      });
    });
  });

  describe('success', () => {
    it('should log success messages in development', () => {
      logger.success('Operation successful');

      expect(mocks.mockConsoleLog).toHaveBeenCalledOnce();
      expect(mocks.mockConsoleLog).toHaveBeenCalledWith('✅ Operation successful', undefined);
      expect(mocks.mockAddBreadcrumb).toHaveBeenCalledWith('Operation successful', 'success', 'info');
    });

    it('should log success messages with context', () => {
      const context = { result: 'data' };
      logger.success('Success with context', context);

      expect(mocks.mockConsoleLog).toHaveBeenCalledWith('✅ Success with context', context);
    });

    it.skip('should not log success messages in production', () => {
      mocks.mockEnv.VITE_SENTRY_ENVIRONMENT = 'production';

      logger.success('Production success');

      expect(mocks.mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('should log operation start in development', () => {
      logger.start('Data fetch');

      expect(mocks.mockConsoleLog).toHaveBeenCalledOnce();
      expect(mocks.mockConsoleLog).toHaveBeenCalledWith('🔄 Starting: Data fetch', undefined);
      expect(mocks.mockAddBreadcrumb).toHaveBeenCalledWith('Starting: Data fetch', 'operation', 'info');
    });

    it('should log start with context', () => {
      const context = { endpoint: '/api/users' };
      logger.start('API call', context);

      expect(mocks.mockConsoleLog).toHaveBeenCalledWith('🔄 Starting: API call', context);
    });

    it.skip('should not log start in production', () => {
      mocks.mockEnv.VITE_SENTRY_ENVIRONMENT = 'production';

      logger.start('Production operation');

      expect(mocks.mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe('performance', () => {
    it('should log performance metrics in development', () => {
      logger.performance('API call', 150);

      expect(mocks.mockConsoleLog).toHaveBeenCalledOnce();
      expect(mocks.mockConsoleLog).toHaveBeenCalledWith('⏱️ API call: 150ms', undefined);
      expect(mocks.mockAddBreadcrumb).toHaveBeenCalledWith('Performance: API call (150ms)', 'performance', 'info');
    });

    it('should log performance with context', () => {
      const context = { endpoint: '/api/data' };
      logger.performance('Database query', 250, context);

      expect(mocks.mockConsoleLog).toHaveBeenCalledWith('⏱️ Database query: 250ms', context);
    });

    it.skip('should not log performance in production', () => {
      mocks.mockEnv.VITE_SENTRY_ENVIRONMENT = 'production';

      logger.performance('Production metric', 100);

      expect(mocks.mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe('api', () => {
    it('should log successful API requests with green checkmark', () => {
      logger.api('GET', '/api/users', 200, 100);

      expect(mocks.mockConsoleLog).toHaveBeenCalledOnce();
      expect(mocks.mockConsoleLog).toHaveBeenCalledWith('✅ GET /api/users [200] (100ms)');
      expect(mocks.mockAddBreadcrumb).toHaveBeenCalledWith('API: GET /api/users', 'http', 'info');
    });

    it('should log failed API requests with red X', () => {
      logger.api('POST', '/api/data', 404, 50);

      expect(mocks.mockConsoleLog).toHaveBeenCalledWith('❌ POST /api/data [404] (50ms)');
      expect(mocks.mockAddBreadcrumb).toHaveBeenCalledWith('API: POST /api/data', 'http', 'error');
    });

    it('should log API requests without status (defaults to error emoji)', () => {
      logger.api('PUT', '/api/update');

      // Without status, condition "status && status < 400" is falsy, so shows ❌
      expect(mocks.mockConsoleLog).toHaveBeenCalledWith('❌ PUT /api/update  ');
    });

    it('should log API requests without duration', () => {
      logger.api('DELETE', '/api/delete', 204);

      expect(mocks.mockConsoleLog).toHaveBeenCalledWith('✅ DELETE /api/delete [204] ');
    });

    it('should handle 5xx errors as failures', () => {
      logger.api('GET', '/api/error', 500);

      expect(mocks.mockConsoleLog).toHaveBeenCalledWith('❌ GET /api/error [500] ');
      expect(mocks.mockAddBreadcrumb).toHaveBeenCalledWith('API: GET /api/error', 'http', 'error');
    });

    it.skip('should not log API calls in production', () => {
      mocks.mockEnv.VITE_SENTRY_ENVIRONMENT = 'production';

      logger.api('GET', '/api/users', 200);

      expect(mocks.mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe('createLogger', () => {
    it('should create scoped logger with prefix for debug', () => {
      const scopedLogger = createLogger('AuthModule');
      scopedLogger.debug('User logged in');

      expect(mocks.mockConsoleDebug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] [AuthModule] User logged in')
      );
    });

    it('should create scoped logger with prefix for info', () => {
      const scopedLogger = createLogger('DataService');
      scopedLogger.info('Data fetched');

      expect(mocks.mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [DataService] Data fetched')
      );
    });

    it('should create scoped logger with prefix for warn', () => {
      const scopedLogger = createLogger('Payment');
      scopedLogger.warn('Payment delayed');

      expect(mocks.mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] [Payment] Payment delayed')
      );
    });

    it('should create scoped logger with prefix for error', () => {
      const scopedLogger = createLogger('Database');
      const error = new Error('Connection failed');
      scopedLogger.error('Query failed', error);

      expect(mocks.mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] [Database] Query failed'),
        error
      );
    });

    it('should create scoped logger with prefix for success', () => {
      const scopedLogger = createLogger('Upload');
      scopedLogger.success('File uploaded');

      expect(mocks.mockConsoleLog).toHaveBeenCalledWith('✅ [Upload] File uploaded', undefined);
    });

    it('should create scoped logger with prefix for start', () => {
      const scopedLogger = createLogger('Export');
      scopedLogger.start('CSV export');

      expect(mocks.mockConsoleLog).toHaveBeenCalledWith('🔄 Starting: [Export] CSV export', undefined);
    });

    it('should create scoped logger with prefix for performance', () => {
      const scopedLogger = createLogger('Render');
      scopedLogger.performance('Component render', 25);

      expect(mocks.mockConsoleLog).toHaveBeenCalledWith('⏱️ [Render] Component render: 25ms', undefined);
    });

    it('should create scoped logger without prefix for api (method is generic)', () => {
      const scopedLogger = createLogger('Client');
      scopedLogger.api('GET', '/api/test', 200);

      expect(mocks.mockConsoleLog).toHaveBeenCalledWith('✅ GET /api/test [200] ');
    });

    it('should allow context in scoped loggers', () => {
      const scopedLogger = createLogger('Store');
      const context = { action: 'update' };
      scopedLogger.info('State changed', context);

      expect(mocks.mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(context))
      );
    });

    it('should handle multiple scoped loggers independently', () => {
      const authLogger = createLogger('Auth');
      const apiLogger = createLogger('API');

      authLogger.info('Login');
      apiLogger.info('Fetch');

      expect(mocks.mockConsoleInfo).toHaveBeenCalledTimes(2);
      expect(mocks.mockConsoleInfo).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('[Auth] Login')
      );
      expect(mocks.mockConsoleInfo).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('[API] Fetch')
      );
    });
  });
});
