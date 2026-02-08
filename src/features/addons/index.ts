/**
 * Add-ons feature exports
 */

// Components
export { GrantAddonModal } from './components/GrantAddonModal';
export { AddonHistoryTable } from './components/AddonHistoryTable';

// Pages
export { AdminAddonsPage } from './pages/AdminAddonsPage';

// Hooks
export { useAddonPlans } from './hooks/useAddonPlans';
export { useGrantAddonMutation } from './hooks/useGrantAddonMutation';
export { useAddonOperations, useOrganizationAddonHistory } from './hooks/useAddonOperations';

// Types
export type {
    AddonPlan,
    AddonOperation,
    GrantAddonRequest,
    GrantAddonResult,
    AddonOperationsFilters,
    AddonType,
} from './types/addon.types';
