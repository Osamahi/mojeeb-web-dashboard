import { create } from 'zustand';
import type { RoleStatistic } from '../types';

interface UserState {
  roleStatistics: RoleStatistic[];
  error: string | null;

  setRoleStatistics: (statistics: RoleStatistic[]) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  roleStatistics: [],
  error: null,
};

export const useUserStore = create<UserState>((set) => ({
  ...initialState,

  setRoleStatistics: (roleStatistics) => set({ roleStatistics, error: null }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
