/**
 * Onboarding Types
 * Types for the customer onboarding flow
 */

export enum OnboardingStep {
  Name = 0,
  Purpose = 1,
  Knowledge = 2,
  Success = 3,
}

export interface AgentPurpose {
  id: string;
  label: string;
  description: string;
  icon: string;
  prompt: string;
  isPopular?: boolean;
}

export interface OnboardingData {
  agentName: string;
  selectedPurposes: AgentPurpose[];
  knowledgeContent: string;
  createdAgentId: string | null;
}

export interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  totalSteps: number;
}

/**
 * Base props shared by all modal components
 * Ensures consistent modal interface across the onboarding feature
 */
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}
