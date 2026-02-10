// components/ARIA/index.js
// ARIA Assistant - Pill + Panel Architecture

// Main orchestrator (default export)
export { default } from './ARIAAssistant';
export { default as ARIAAssistant } from './ARIAAssistant';

// Individual components
export { default as ARIAPill } from './ARIAPill';
export { default as ARIAPanel } from './ARIAPanel';
export { default as ARIAChat } from './ARIAChat';
export { default as ARIAFlyingMessage } from './ARIAFlyingMessage';

// Hook and utilities
export { default as useARIA, EXAMPLE_COMMANDS, WELCOME_MESSAGE } from './useARIA';

// Legacy component (for rollback if needed)
// export { default as ARIAAssistantLegacy } from './ARIAAssistant.legacy';
