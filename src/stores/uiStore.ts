import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar state
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  closeSidebarOnMobile: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      isSidebarOpen: false, // Closed on mobile by default
      isSidebarCollapsed: true, // Collapsed on desktop by default (hover to expand)

      // Toggle sidebar open/closed (mobile drawer)
      toggleSidebar: () =>
        set((state) => ({
          isSidebarOpen: !state.isSidebarOpen
        })),

      // Set sidebar open/closed directly
      setSidebarOpen: (open: boolean) =>
        set({ isSidebarOpen: open }),

      // Set sidebar collapsed state (desktop/tablet)
      setSidebarCollapsed: (collapsed: boolean) =>
        set({ isSidebarCollapsed: collapsed }),

      // Auto-close sidebar on mobile (called after navigation)
      closeSidebarOnMobile: () => {
        // Only close if we're on mobile (< 768px)
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          set({ isSidebarOpen: false });
        }
      },
    }),
    {
      name: 'mojeeb-ui-storage',
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    }
  )
);
