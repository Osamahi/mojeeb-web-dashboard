import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { router } from './router';
import { ErrorBoundary } from './components/ErrorBoundary';
import { setGlobalQueryClient } from './lib/api';
import { AppLifecycleProvider } from './contexts/AppLifecycleContext';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Refetch queries when app regains focus (important for mobile)
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (cache retention time)
    },
  },
});

// Register QueryClient globally for API interceptor to clear cache on logout
setGlobalQueryClient(queryClient);

function App() {
  return (
    <ErrorBoundary>
      <AppLifecycleProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'white',
                color: '#171717',
                border: '1px solid #e5e5e5',
              },
            }}
          />
        </QueryClientProvider>
      </AppLifecycleProvider>
    </ErrorBoundary>
  );
}

export default App;
