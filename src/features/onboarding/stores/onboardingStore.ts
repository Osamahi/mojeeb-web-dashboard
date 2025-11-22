/**
 * Onboarding Store
 * Zustand store for managing onboarding state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OnboardingStep, type OnboardingData, type AgentPurpose } from '../types/onboarding.types';

interface OnboardingState {
  // Progress tracking
  currentStep: OnboardingStep;
  hasCompletedOnboarding: boolean;

  // Agent data
  data: OnboardingData;

  // Actions
  nextStep: () => void;
  setAgentName: (name: string) => void;
  setSelectedPurposes: (purposes: AgentPurpose[]) => void;
  togglePurpose: (purpose: AgentPurpose) => void;
  setKnowledgeContent: (content: string) => void;
  setCreatedAgentId: (id: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const initialData: OnboardingData = {
  agentName: '',
  selectedPurposes: [],
  knowledgeContent: '',
  createdAgentId: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: OnboardingStep.Name,
      hasCompletedOnboarding: false,
      data: initialData,

      // Step navigation
      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < OnboardingStep.Success) {
          set({ currentStep: currentStep + 1 });
        }
      },

      // Data mutations
      setAgentName: (name) =>
        set((state) => ({
          data: { ...state.data, agentName: name },
        })),

      setSelectedPurposes: (purposes) =>
        set((state) => ({
          data: { ...state.data, selectedPurposes: purposes },
        })),

      togglePurpose: (purpose) =>
        set((state) => {
          const { selectedPurposes } = state.data;
          const isSelected = selectedPurposes.some((p) => p.id === purpose.id);

          const newPurposes = isSelected
            ? selectedPurposes.filter((p) => p.id !== purpose.id)
            : [...selectedPurposes, purpose];

          return {
            data: { ...state.data, selectedPurposes: newPurposes },
          };
        }),

      setKnowledgeContent: (content) =>
        set((state) => ({
          data: { ...state.data, knowledgeContent: content },
        })),

      setCreatedAgentId: (id) =>
        set((state) => ({
          data: { ...state.data, createdAgentId: id },
        })),

      // Completion
      completeOnboarding: () => set({
        hasCompletedOnboarding: true,
        currentStep: OnboardingStep.Name,
        data: initialData, // Clear form data after completion
      }),

      // Reset
      resetOnboarding: () =>
        set({
          currentStep: OnboardingStep.Name,
          hasCompletedOnboarding: false,
          data: initialData,
        }),
    }),
    {
      name: 'mojeeb-onboarding-storage',
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        currentStep: state.currentStep,
        data: state.data,
      }),
    }
  )
);
