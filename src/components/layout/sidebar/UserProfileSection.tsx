import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@/features/auth/types/auth.types';

interface UserProfileSectionProps {
  user: User | null;
  onLogout: () => void | Promise<void>;
}

/**
 * User Profile Section Component
 * Shows user info and logout button
 * Used in both mobile and desktop sidebars
 */
export const UserProfileSection = ({ user, onLogout }: UserProfileSectionProps) => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await onLogout(); // Clear auth state
      navigate('/login', { replace: true }); // Navigate using React Router
    } catch (error) {
      console.error('Logout failed:', error);
      // Error is logged, user can try again
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Smart avatar fallback: name first letter -> email first letter -> 'U'
  const getAvatarText = (): string => {
    const nameInitial = user?.name?.trim().charAt(0).toUpperCase();
    if (nameInitial) return nameInitial;

    const emailInitial = user?.email?.trim().charAt(0).toUpperCase();
    if (emailInitial) return emailInitial;

    return 'U';
  };

  return (
    <div className="p-4 border-t border-neutral-200 bg-white">
      <div className="flex items-center gap-3 px-2 py-2">
        <div
          className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-semibold flex-shrink-0"
          aria-hidden="true"
        >
          {getAvatarText()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-950 truncate">
            {user?.name || 'User'}
          </p>
          <p className="text-xs text-neutral-600 truncate">{user?.email || ''}</p>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={cn(
          'mt-3 w-full flex items-center gap-2 px-4 py-2.5 text-sm rounded-md transition-colors duration-200',
          isLoggingOut
            ? 'text-neutral-400 cursor-not-allowed bg-neutral-100'
            : 'text-neutral-700 hover:text-red-600 hover:bg-red-50'
        )}
        aria-label={isLoggingOut ? 'Logging out...' : 'Logout'}
      >
        <LogOut
          className={cn('w-4 h-4', isLoggingOut && 'animate-spin')}
          aria-hidden="true"
        />
        <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
      </button>
    </div>
  );
};
