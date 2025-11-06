/**
 * Error Boundary Component
 * Catches React errors and prevents full app crashes
 * Provides graceful error handling with fallback UI
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Store error info in state
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to error logging service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="bg-white rounded-lg border border-neutral-200 p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-semibold text-neutral-950 text-center mb-2">
                Something went wrong
              </h1>

              {/* Description */}
              <p className="text-neutral-600 text-center mb-6">
                We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
              </p>

              {/* Error Details (Development only) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-6 bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                  <summary className="cursor-pointer text-sm font-medium text-neutral-700 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="mt-4 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-neutral-700 mb-1">Error Message:</p>
                      <p className="text-xs text-red-600 font-mono bg-red-50 p-2 rounded border border-red-200">
                        {this.state.error.message}
                      </p>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <p className="text-xs font-medium text-neutral-700 mb-1">Stack Trace:</p>
                        <pre className="text-xs text-neutral-600 font-mono bg-neutral-100 p-2 rounded border border-neutral-200 overflow-auto max-h-48">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <p className="text-xs font-medium text-neutral-700 mb-1">Component Stack:</p>
                        <pre className="text-xs text-neutral-600 font-mono bg-neutral-100 p-2 rounded border border-neutral-200 overflow-auto max-h-48">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="primary"
                  size="md"
                  onClick={this.handleReset}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={this.handleReload}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={this.handleGoHome}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </div>

            {/* Contact Support */}
            <p className="text-center text-sm text-neutral-500 mt-6">
              If this problem persists, please{' '}
              <a
                href="mailto:support@mojeeb.com"
                className="text-neutral-900 hover:underline font-medium"
              >
                contact support
              </a>
              .
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
