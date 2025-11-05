import { create } from 'zustand';
import type { User, RoleStatistic } from '../types';

interface UserState {
  users: User[];
  roleStatistics: RoleStatistic[];
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUsers: (users: User[]) => void;
  setRoleStatistics: (statistics: RoleStatistic[]) => void;
  setSelectedUser: (user: User | null) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  removeUser: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  users: [],
  roleStatistics: [],
  selectedUser: null,
  isLoading: false,
  error: null,
};

export const useUserStore = create<UserState>((set) => ({
  ...initialState,

  setUsers: (users) => set({ users, error: null }),

  setRoleStatistics: (roleStatistics) => set({ roleStatistics, error: null }),

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  addUser: (user) =>
    set((state) => ({
      users: [user, ...state.users],
      error: null,
    })),

  updateUser: (id, updatedUser) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.id === id ? { ...user, ...updatedUser } : user
      ),
      selectedUser:
        state.selectedUser?.id === id
          ? { ...state.selectedUser, ...updatedUser }
          : state.selectedUser,
      error: null,
    })),

  removeUser: (id) =>
    set((state) => ({
      users: state.users.filter((user) => user.id !== id),
      selectedUser: state.selectedUser?.id === id ? null : state.selectedUser,
      error: null,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
