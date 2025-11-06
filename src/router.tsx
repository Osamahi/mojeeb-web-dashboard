import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { SignUpPage } from './features/auth/pages/SignUpPage';
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ConversationsPage } from './pages/ConversationsPage';
import { SettingsPage } from './pages/SettingsPage';
import AgentsPage from './features/agents/pages/AgentsPage';
import StudioPage from './features/agents/pages/StudioPage';
import UsersPage from './features/users/pages/UsersPage';
import TeamPage from './features/team/pages/TeamPage';
import { useAuthStore } from './features/auth/stores/authStore';
import { Role } from './features/auth/types/auth.types';
import { AuthInitializer } from './features/auth/components/AuthInitializer';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Wrap with AuthInitializer to validate tokens before rendering
  return <AuthInitializer>{children}</AuthInitializer>;
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

  return <>{children}</>;
};

// Public route wrapper (redirect to conversations if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/conversations" replace />;
  }

  return <>{children}</>;
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
      <PublicRoute>
        <SignUpPage />
      </PublicRoute>
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
