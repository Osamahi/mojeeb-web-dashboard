import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar state
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  closeSidebarOnMobile: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      isSidebarOpen: false, // Closed on mobile by default
      isSidebarCollapsed: false, // Expanded on desktop by default

      // Toggle sidebar open/closed (mobile drawer)
      toggleSidebar: () =>
        set((state) => ({
          isSidebarOpen: !state.isSidebarOpen
        })),

      // Set sidebar open/closed directly
      setSidebarOpen: (open: boolean) =>
        set({ isSidebarOpen: open }),

      // Toggle sidebar collapsed/expanded (desktop)
      toggleSidebarCollapse: () =>
        set((state) => ({
          isSidebarCollapsed: !state.isSidebarCollapsed
        })),

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
      // Only persist desktop collapse preference
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    }
  )
);
