/**
 * Auth Header Component
 * Minimal fixed header for authentication pages (login, signup, forgot password)
 * Uses AppLogo for consistent branding
 */

import { AppLogo } from '@/components/ui/AppLogo';
import { HeaderContainer } from './HeaderContainer';

export const AuthHeader = () => {
  return (
    <HeaderContainer>
      <div className="flex items-center">
        <AppLogo />
      </div>
    </HeaderContainer>
  );
};
