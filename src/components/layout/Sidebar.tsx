import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { authService } from '@/features/auth/services/authService';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/login';
  };

  return (
    <div className="h-screen w-64 bg-white border-r border-neutral-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-neutral-900">Mojeeb</h1>
            <p className="text-xs text-neutral-600">AI Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-5 h-5', isActive && 'text-primary-600')} />
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center gap-3 mb-3 px-2">
          <Avatar
            name={user?.name || 'User'}
            src={user?.avatarUrl}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-neutral-600 truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </motion.button>
      </div>
    </div>
  );
};
