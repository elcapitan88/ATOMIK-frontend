import { useContext, useMemo, useCallback } from 'react';
import { StrategyBuilderContext, COMPONENT_TYPES } from '@/contexts/StrategyBuilderContext';
import logger from '@/utils/logger';

/**
 * Custom hook to interact with the Strategy Builder context
 * Provides methods and state for managing strategy components
 */
const useStrategyBuilder = () => {
  const context = useContext(StrategyBuilderContext);

  if (!context) {
    throw new Error(
      'useStrategyBuilder must be used within a StrategyBuilderProvider'
    );
  }

  // Get active component
  const activeComponent = useMemo(() => {
    if (!context.selectedComponentId) return null;
    return context.components.find(c => c.id === context.selectedComponentId) || null;
  }, [context.selectedComponentId, context.components]);

  // Get components by type
  const getComponentsByType = useCallback((type) => {
    return context.components.filter(component => component.type === type);
  }, [context.components]);

  // Get all component types with counts
  const componentTypeCounts = useMemo(() => {
    const counts = {};
    Object.values(COMPONENT_TYPES).forEach(type => {
      counts[type] = context.components.filter(c => c.type === type).length;
    });
    return counts;
  }, [context.components]);

  // Check if a component type is available (based on subscription limits, etc.)
  const isComponentTypeAvailable = useCallback((type) => {
    // This could integrate with subscription context in the future
    // For now, all component types are available
    return true;
  }, []);

  // Create a formatted title when creating a new component
  const getFormattedTitleForType = useCallback((type) => {
    const count = componentTypeCounts[type] + 1;
    
    switch(type) {
      case COMPONENT_TYPES.ENTRY:
        return `Entry Condition ${count}`;
      case COMPONENT_TYPES.EXIT:
        return `Exit Condition ${count}`;
      case COMPONENT_TYPES.STOP_LOSS:
        return `Stop Loss ${count}`;
      case COMPONENT_TYPES.TAKE_PROFIT:
        return `Take Profit ${count}`;
      case COMPONENT_TYPES.RISK_MANAGEMENT:
        return `Risk Management ${count}`;
      case COMPONENT_TYPES.CUSTOM:
        return `Custom Rule ${count}`;
      default:
        return `New Component ${count}`;
    }
  }, [componentTypeCounts]);

  // Create new component with formatted title
  const createComponentWithDefaultTitle = useCallback((type) => {
    const title = getFormattedTitleForType(type);
    return context.createComponent(type, title);
  }, [context.createComponent, getFormattedTitleForType]);

  // Log component changes (for debugging)
  const logComponentState = useCallback(() => {
    logger.debug('Strategy Builder Components:', context.components);
  }, [context.components]);

  return {
    // Original context values
    ...context,
    
    // Enhanced values and methods
    activeComponent,
    getComponentsByType,
    componentTypeCounts,
    isComponentTypeAvailable,
    createComponentWithDefaultTitle,
    getFormattedTitleForType,
    logComponentState,
    
    // Export component types
    COMPONENT_TYPES
  };
};

export default useStrategyBuilder;