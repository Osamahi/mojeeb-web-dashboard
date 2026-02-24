import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './features/auth/stores/authStore';
import { Role } from './features/auth/types/auth.types';
import { AuthInitializer } from './features/auth/components/AuthInitializer';
import { AuthLayout } from './components/layout/AuthLayout';
import { PageSkeleton } from './components/ui/PageSkeleton';

// Lazy load all page components for code splitting
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignUpPage = lazy(() => import('./features/auth/pages/SignUpPage').then(m => ({ default: m.SignUpPage })));
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const GoogleCallbackPage = lazy(() => import('./features/auth/pages/GoogleCallbackPage'));
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
const AdminConnectionsPage = lazy(() => import('./features/connections/pages/AdminConnectionsPage'));
const OAuthCallbackPage = lazy(() => import('./features/connections/pages/OAuthCallbackPage'));
const LeadsPage = lazy(() => import('./features/leads/pages/LeadsPage'));
const ActionsPage = lazy(() => import('./features/actions/pages/ActionsPage').then(m => ({ default: m.ActionsPage })));
const WhatsAppManagementPage = lazy(() => import('./features/whatsapp/pages/WhatsAppManagementPage'));
const InstallWidgetPage = lazy(() => import('./pages/InstallWidgetPage').then(m => ({ default: m.InstallWidgetPage })));
const AdminSubscriptionsPage = lazy(() => import('./features/subscriptions/pages/AdminSubscriptionsPage'));
const AdminFollowUpJobsPage = lazy(() => import('./features/followups/pages/AdminFollowUpJobsPage'));
const AdminAppConfigPage = lazy(() => import('./features/appconfig/pages/AdminAppConfigPage'));
const AdminPricingPage = lazy(() => import('./features/pricing/pages/AdminPricingPage'));
const MetaTokenExaminerPage = lazy(() => import('./features/meta/pages/MetaTokenExaminerPage').then(m => ({ default: m.MetaTokenExaminerPage })));
const AdminPlanCataloguePage = lazy(() => import('./features/catalogue/pages/AdminPlanCataloguePage').then(m => ({ default: m.AdminPlanCataloguePage })));
const AdminAddonsPage = lazy(() => import('./features/addons/pages/AdminAddonsPage').then(m => ({ default: m.AdminAddonsPage })));
const AddonPlansPage = lazy(() => import('./features/addons/pages/AddonPlansPage').then(m => ({ default: m.AddonPlansPage })));
const MySubscriptionPage = lazy(() => import('./features/subscriptions/pages/MySubscriptionPage'));
const SubscriptionSuccessPage = lazy(() => import('./features/billing/pages/SubscriptionSuccessPage'));
const SubscriptionCancelPage = lazy(() => import('./features/billing/pages/SubscriptionCancelPage'));
const AddonSuccessPage = lazy(() => import('./features/addons/pages/AddonSuccessPage'));
const AcceptInvitationPage = lazy(() => import('./features/organizations/pages/AcceptInvitationPage').then(m => ({ default: m.AcceptInvitationPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const ServerErrorPage = lazy(() => import('./pages/ServerErrorPage').then(m => ({ default: m.ServerErrorPage })));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage').then(m => ({ default: m.UnauthorizedPage })));

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const user = useAuthStore((state) => state.user);

  // CRITICAL: Handle edge case - isAuthenticated but no refreshToken (corrupted state)
  if (isAuthenticated && !refreshToken) {
    // Clear the corrupted state immediately
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    return <Navigate to="/login" replace />;
  }

  // DEFENSIVE CHECK: Don't redirect if we have a refreshToken
  // Even if isAuthenticated is false (due to race condition), AuthInitializer will handle token validation
  if (!isAuthenticated && !refreshToken) {
    return <Navigate to="/login" replace />;
  }

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

  // CRITICAL: Handle corrupted state - isAuthenticated but no refreshToken
  if (isAuthenticated && !refreshToken) {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    return <Navigate to="/login" replace />;
  }

  // DEFENSIVE CHECK: Don't redirect if we have a refreshToken
  if (!isAuthenticated && !refreshToken) {
    return <Navigate to="/login" replace />;
  }

  // CRITICAL: Check role BEFORE mounting children to prevent API calls
  if (user?.role !== Role.SuperAdmin) {
    return <Navigate to="/conversations" replace />;
  }

  // CRITICAL FIX: Wrap with AuthInitializer like ProtectedRoute does
  // This ensures user data is loaded before children components mount
  // Prevents race condition where OrganizationsPage calls API before role check completes
  return (
    <AuthInitializer>
      <Suspense fallback={<PageSkeleton />}>
        {children}
      </Suspense>
    </AuthInitializer>
  );
};

// Public route wrapper (redirect if already authenticated)
const PublicRoute = ({ children, allowAuthenticatedAccess = false }: { children: React.ReactNode; allowAuthenticatedAccess?: boolean }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  // CRITICAL: Handle corrupted state - isAuthenticated but no refreshToken
  if (isAuthenticated && !refreshToken) {
    // Clear the corrupted state immediately
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    // Don't redirect, just render the public page with clean state
  }

  // CRITICAL FIX: Only redirect if BOTH isAuthenticated AND refreshToken exist
  // This prevents redirect loops during logout when isAuthenticated is briefly true
  // but refreshToken has already been cleared
  if (isAuthenticated && refreshToken && !allowAuthenticatedAccess) {
    return <Navigate to="/conversations" replace />;
  }

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
    // Auth Layout - Shared header for all authentication pages
    element: <AuthLayout />,
    children: [
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
        path: '/accept-invitation',
        element: (
          <PublicRoute allowAuthenticatedAccess={true}>
            <AcceptInvitationPage />
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
        path: '/auth/google/callback',
        element: (
          <PublicRoute allowAuthenticatedAccess={true}>
            <GoogleCallbackPage />
          </PublicRoute>
        ),
      },
    ],
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
    errorElement: (
      <Suspense fallback={<PageSkeleton />}>
        <ServerErrorPage />
      </Suspense>
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
        path: 'actions',
        element: (
          <SuperAdminRoute>
            <ActionsPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'whatsapp-management',
        element: <WhatsAppManagementPage />,
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
        path: 'admin-connections',
        element: (
          <SuperAdminRoute>
            <AdminConnectionsPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'team-management',
        element: <TeamManagementPage />,
      },
      {
        path: 'conversations',
        element: <ConversationsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'subscriptions',
        element: (
          <SuperAdminRoute>
            <AdminSubscriptionsPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'pricing',
        element: (
          <SuperAdminRoute>
            <AdminPricingPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'meta-token-examiner',
        element: (
          <SuperAdminRoute>
            <MetaTokenExaminerPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'catalogue',
        element: (
          <SuperAdminRoute>
            <AdminPlanCataloguePage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'addon-plans',
        element: (
          <SuperAdminRoute>
            <AddonPlansPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'addons',
        element: (
          <SuperAdminRoute>
            <AdminAddonsPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'followup-jobs',
        element: (
          <SuperAdminRoute>
            <AdminFollowUpJobsPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'app-config',
        element: (
          <SuperAdminRoute>
            <AdminAppConfigPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'my-subscription',
        element: <MySubscriptionPage />,
      },
    ],
  },
  {
    path: '/subscription/success',
    element: (
      <ProtectedRoute>
        <SubscriptionSuccessPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/subscription/cancel',
    element: (
      <ProtectedRoute>
        <SubscriptionCancelPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/addon-success',
    element: (
      <ProtectedRoute>
        <AddonSuccessPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/unauthorized',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <UnauthorizedPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);
