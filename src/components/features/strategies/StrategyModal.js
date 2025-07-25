// frontend/src/components/features/strategies/StrategyModal.js
import React from 'react';
import { useStrategyModal } from '../../../hooks/useStrategyEnhancements';
import WebhookModal from '../webhooks/WebhookModal';
import EnhancedStrategyModal from './EnhancedStrategyModal';

/**
 * Smart modal component that renders either the legacy WebhookModal 
 * or the new EnhancedStrategyModal based on feature flags
 */
const StrategyModal = (props) => {
  const { useEnhanced, loading } = useStrategyModal();

  // Show nothing while loading feature flags
  if (loading) {
    return null;
  }

  // Render enhanced modal if feature is enabled
  if (useEnhanced) {
    return <EnhancedStrategyModal {...props} />;
  }

  // Fallback to legacy webhook modal
  return <WebhookModal {...props} />;
};

export default StrategyModal;