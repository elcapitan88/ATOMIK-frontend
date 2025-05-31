// frontend/src/components/common/beta/index.js
// Centralized exports for beta feature components and utilities

// Components
export { default as BetaFeature } from '../BetaFeature';
export { default as BetaBadge } from '../BetaBadge';
export { default as withBetaAccess } from '../withBetaAccess';

// Hooks
export { useBetaAccess } from '../../../hooks/useBetaAccess';

// Utilities
export * from '../../../utils/betaUtils';

// Re-export for convenience
export { 
  isBetaTester, 
  isAdmin, 
  isModerator,
  getRolePermissions 
} from '../../../utils/roleColors';