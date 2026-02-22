export type FollowUpStep = {
  id: string;
  agentId: string;
  stepOrder: number;
  delayMinutes: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateFollowUpStepRequest = {
  stepOrder: number;
  delayMinutes: number;
  isEnabled?: boolean;
};

export type UpdateFollowUpStepRequest = {
  delayMinutes?: number;
  isEnabled?: boolean;
};
