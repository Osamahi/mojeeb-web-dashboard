import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './features/auth/stores/authStore';
import { Role } from './features/auth/types/auth.types';
import { AuthInitializer } from './features/auth/components/AuthInitializer';
import { PageSkeleton } from './components/ui/PageSkeleton';

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
const OrganizationsPage = lazy(() => import('./features/organizations/pages/OrganizationsPage'));
const TeamManagementPage = lazy(() => import('./features/organizations/pages/TeamManagementPage'));
const ConnectionsPage = lazy(() => import('./features/connections/pages/ConnectionsPage'));
const OAuthCallbackPage = lazy(() => import('./features/connections/pages/OAuthCallbackPage'));
const LeadsPage = lazy(() => import('./features/leads/pages/LeadsPage'));
const InstallWidgetPage = lazy(() => import('./pages/InstallWidgetPage').then(m => ({ default: m.InstallWidgetPage })));

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const user = useAuthStore((state) => state.user);

  // DIAGNOSTIC: Log protected route access attempts
  console.log(`\n🛡️ [ProtectedRoute] Access check at ${new Date().toISOString()}`);
  console.log(`   isAuthenticated: ${isAuthenticated}`);
  console.log(`   refreshToken: ${refreshToken ? 'EXISTS' : 'MISSING'}`);
  console.log(`   user: ${user ? user.email : 'MISSING'}`);
  console.log(`   Current URL: ${window.location.pathname}`);

  // DEFENSIVE CHECK: Don't redirect if we have a refreshToken
  // Even if isAuthenticated is false (due to race condition), AuthInitializer will handle token validation
  if (!isAuthenticated && !refreshToken) {
    console.log(`   ⚠️ [ProtectedRoute] NOT AUTHENTICATED - Redirecting to /login`);
    console.log(`   📍 Redirect triggered from: ${window.location.pathname}`);
    return <Navigate to="/login" replace />;
  }

  console.log(`   ✅ [ProtectedRoute] Access granted - rendering protected content`);

  // Wrap with AuthInitializer to validate tokens before rendering
  return (
    <AuthInitializer>
      <Suspense fallback={<PageSkeleton />}>
        {children}
      </Suspense>
    </AuthInitializer>
  );
};

// SuperAdmin-only route wrapper
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const user = useAuthStore((state) => state.user);

  // DEFENSIVE CHECK: Don't redirect if we have a refreshToken
  if (!isAuthenticated && !refreshToken) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== Role.SuperAdmin) {
    return <Navigate to="/conversations" replace />;
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      {children}
    </Suspense>
  );
};

// Public route wrapper (redirect if already authenticated)
const PublicRoute = ({ children, allowAuthenticatedAccess = false }: { children: React.ReactNode; allowAuthenticatedAccess?: boolean }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // DIAGNOSTIC: Log public route access
  console.log(`\n🌐 [PublicRoute] Access check at ${new Date().toISOString()}`);
  console.log(`   isAuthenticated: ${isAuthenticated}`);
  console.log(`   user: ${user ? user.email : 'MISSING'}`);
  console.log(`   allowAuthenticatedAccess: ${allowAuthenticatedAccess}`);
  console.log(`   Current URL: ${window.location.pathname}`);

  if (isAuthenticated && !allowAuthenticatedAccess) {
    console.log(`   ⚠️ [PublicRoute] User already authenticated - Redirecting to /conversations`);
    console.log(`   📍 Redirect triggered from: ${window.location.pathname}`);
    return <Navigate to="/conversations" replace />;
  }

  console.log(`   ✅ [PublicRoute] Access granted - rendering public content`);

  return (
    <Suspense fallback={<PageSkeleton />}>
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
      <Suspense fallback={<PageSkeleton />}>
        <OAuthCallbackPage />
      </Suspense>
    ),
  },
  {
    path: '/install/:token',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <InstallWidgetPage />
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
        path: 'connections',
        element: <ConnectionsPage />,
      },
      {
        path: 'leads',
        element: <LeadsPage />,
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
        path: 'organizations',
        element: (
          <SuperAdminRoute>
            <OrganizationsPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'team-management',
        element: (
          <SuperAdminRoute>
            <TeamManagementPage />
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
