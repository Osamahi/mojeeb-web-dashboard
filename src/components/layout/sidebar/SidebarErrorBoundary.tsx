import { Component } from 'react';
import type { ReactNode } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error Boundary for Sidebar Component
 * Prevents sidebar errors from crashing the entire application
 * Shows minimal fallback UI when errors occur
 */
class SidebarErrorBoundaryComponent extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Sidebar error:', error, errorInfo);
  }

  render() {
    const { t } = this.props;

    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-20 bg-neutral-50 border-r border-neutral-200 flex items-center justify-center">
            <p className="text-xs text-neutral-500 p-4 text-center">
              {t('sidebar_error_boundary.navigation_unavailable')}
            </p>
          </aside>
        )
      );
    }

    return this.props.children;
  }
}

export const SidebarErrorBoundary = withTranslation()(SidebarErrorBoundaryComponent);
