import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './features/auth/stores/authStore';
import { Role } from './features/auth/types/auth.types';
import { AuthInitializer } from './features/auth/components/AuthInitializer';
import { PageSpinner } from './components/ui/Spinner';

// Lazy load all page components for code splitting
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignUpPage = lazy(() => import('./features/auth/pages/SignUpPage').then(m => ({ default: m.SignUpPage })));
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const OnboardingWizard = lazy(() => import('./features/onboarding/pages/OnboardingWizard'));
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const ConversationsPage = lazy(() => import('./pages/ConversationsPage').then(m => ({ default: m.ConversationsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AgentsPage = lazy(() => import('./features/agents/pages/AgentsPage'));
const StudioPage = lazy(() => import('./features/agents/pages/StudioPage'));
const UsersPage = lazy(() => import('./features/users/pages/UsersPage'));
const TeamPage = lazy(() => import('./features/team/pages/TeamPage'));
const ConnectionsPage = lazy(() => import('./features/connections/pages/ConnectionsPage'));
const OAuthCallbackPage = lazy(() => import('./features/connections/pages/OAuthCallbackPage'));

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Wrap with AuthInitializer to validate tokens before rendering
  return (
    <AuthInitializer>
      <Suspense fallback={<PageSpinner />}>
        {children}
      </Suspense>
    </AuthInitializer>
  );
};

// SuperAdmin-only route wrapper
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== Role.SuperAdmin) {
    return <Navigate to="/conversations" replace />;
  }

  return (
    <Suspense fallback={<PageSpinner />}>
      {children}
    </Suspense>
  );
};

// Public route wrapper (redirect if already authenticated)
const PublicRoute = ({ children, allowAuthenticatedAccess = false }: { children: React.ReactNode; allowAuthenticatedAccess?: boolean }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated && !allowAuthenticatedAccess) {
    return <Navigate to="/conversations" replace />;
  }

  return (
    <Suspense fallback={<PageSpinner />}>
      {children}
    </Suspense>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/conversations" replace />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <PublicRoute allowAuthenticatedAccess={true}>
        <SignUpPage />
      </PublicRoute>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <OnboardingWizard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicRoute>
        <ForgotPasswordPage />
      </PublicRoute>
    ),
  },
  {
    path: '/oauth/callback',
    element: (
      <Suspense fallback={<PageSpinner />}>
        <OAuthCallbackPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'agents',
        element: <AgentsPage />,
      },
      {
        path: 'studio',
        element: <StudioPage />,
      },
      {
        path: 'team',
        element: <TeamPage />,
      },
      {
        path: 'connections',
        element: <ConnectionsPage />,
      },
      {
        path: 'users',
        element: (
          <SuperAdminRoute>
            <UsersPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'conversations',
        element: <ConversationsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
]);
