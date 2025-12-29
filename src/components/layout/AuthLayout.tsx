/**
 * Auth Layout Component
 * Parent layout for all authentication pages (login, signup, forgot password)
 * Renders AuthHeader once at router level to prevent logo reload on navigation
 * Uses React Router Outlet for child route content
 */

import { Outlet } from 'react-router-dom';
import { AuthHeader } from './AuthHeader';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header - Rendered once, persists across auth pages */}
      <AuthHeader />

      {/* Content Area - Child routes render here via Outlet */}
      <div className="flex-1 flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
