import { Suspense } from 'react';
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

// Translation loading fallback
function TranslationLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        <p className="text-sm text-neutral-600">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<TranslationLoader />}>
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
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
