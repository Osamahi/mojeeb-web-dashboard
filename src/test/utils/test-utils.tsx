import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with all necessary providers
 * Use this instead of RTL's render for all component tests
 */

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Allow custom query client for specific tests
  queryClient?: QueryClient;
  // Initial router location
  initialRoute?: string;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: Infinity, // Keep cache forever in tests
        staleTime: Infinity, // Never mark as stale in tests
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

function AllTheProviders({
  children,
  queryClient,
  initialRoute = '/',
}: {
  children: ReactNode;
  queryClient?: QueryClient;
  initialRoute?: string;
}) {
  const testQueryClient = queryClient || createTestQueryClient();

  // Set initial route if provided
  if (initialRoute !== '/') {
    window.history.pushState({}, '', initialRoute);
  }

  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, initialRoute, ...renderOptions } = options || {};

  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <AllTheProviders queryClient={queryClient} initialRoute={initialRoute}>
          {children}
        </AllTheProviders>
      ),
      ...renderOptions,
    }),
    // Return the query client for assertions
    queryClient: queryClient || createTestQueryClient(),
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };

/**
 * Helper to create a test query client
 * Use when you need direct access to query client in tests
 */
export { createTestQueryClient };

/**
 * Helper to wait for loading states to complete
 */
export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

/**
 * Mock authentication state helper
 */
export function mockAuthenticatedUser() {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'SuperAdmin' as const,
  };

  localStorage.setItem('accessToken', 'mock-access-token');
  localStorage.setItem('refreshToken', 'mock-refresh-token');

  return mockUser;
}

/**
 * Clear authentication state helper
 */
export function clearAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('mojeeb-auth-storage');
}
