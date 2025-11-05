/**
 * Team Store - Zustand
 * Manages team member state
 */

import { create } from 'zustand';
import type { TeamMember, TeamStats } from '../types';

interface TeamStore {
  // State
  teamMembers: TeamMember[];
  teamStats: TeamStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTeamMembers: (members: TeamMember[]) => void;
  setTeamStats: (stats: TeamStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addTeamMember: (member: TeamMember) => void;
  removeTeamMember: (userId: string) => void;
  updateTeamMember: (userId: string, updates: Partial<TeamMember>) => void;
}

export const useTeamStore = create<TeamStore>((set) => ({
  // Initial state
  teamMembers: [],
  teamStats: null,
  isLoading: false,
  error: null,

  // Actions
  setTeamMembers: (members) => set({ teamMembers: members }),

  setTeamStats: (stats) => set({ teamStats: stats }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  addTeamMember: (member) =>
    set((state) => ({
      teamMembers: [...state.teamMembers, member],
    })),

  removeTeamMember: (userId) =>
    set((state) => ({
      teamMembers: state.teamMembers.filter((m) => m.id !== userId),
    })),

  updateTeamMember: (userId, updates) =>
    set((state) => ({
      teamMembers: state.teamMembers.map((m) =>
        m.id === userId ? { ...m, ...updates } : m
      ),
    })),
}));
