import type { AgentPurpose } from '../types/onboarding.types';

/**
 * Fuse selected purpose roles into one sentence PersonaPrompt.
 *
 *   [customer-support]                                → "You are a customer support agent."
 *   [customer-support, social-media-moderator]        → "You are a customer support, social media moderator agent."
 *   [customer-support, social, sales]                 → "You are a customer support, social media moderator, and sales assistant agent."
 *
 * Empty input returns empty string — callers decide the fallback.
 */
export function buildMultiRolePersona(purposes: AgentPurpose[]): string {
  const roles = purposes.map((p) => p.role).filter(Boolean);
  if (roles.length === 0) return '';
  if (roles.length === 1) return `You are a ${roles[0]} agent.`;
  if (roles.length === 2) return `You are a ${roles[0]}, ${roles[1]} agent.`;
  // 3+ — Oxford comma before the last role
  const head = roles.slice(0, -1).join(', ');
  const tail = roles[roles.length - 1];
  return `You are a ${head}, and ${tail} agent.`;
}
