import React, { createContext, useState, useEffect, useCallback } from 'react';
import logger from '@/utils/logger';

// Define types of strategy components
export const COMPONENT_TYPES = {
  ENTRY: 'entry',
  EXIT: 'exit',
  STOP_LOSS: 'stop_loss',
  TAKE_PROFIT: 'take_profit',
  RISK_MANAGEMENT: 'risk_management',
  CUSTOM: 'custom'
};

// Initial context state
const initialState = {
  components: [],
  selectedComponentId: null,
  isCreating: false,
  componentTypeToCreate: null,
  isLoading: false,
  error: null,
  strategyMetadata: {
    name: '',
    description: ''
  }
};

// Create the context
export const StrategyBuilderContext = createContext(initialState);

export const StrategyBuilderProvider = ({ children }) => {
  // State initialization
  const [components, setComponents] = useState([]);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [componentTypeToCreate, setComponentTypeToCreate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [strategyMetadata, setStrategyMetadata] = useState({
    name: '',
    description: ''
  });

  // Load components and metadata from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const storedComponents = localStorage.getItem('strategyBuilderComponents');
        const storedMetadata = localStorage.getItem('strategyBuilderMetadata');
        
        if (storedComponents) {
          setComponents(JSON.parse(storedComponents));
        }
        
        if (storedMetadata) {
          setStrategyMetadata(JSON.parse(storedMetadata));
        }
      } catch (err) {
        logger.error('Error loading strategy data:', err);
        setError('Failed to load saved strategy');
      }
    };

    loadData();
  }, []);

  // Save components to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('strategyBuilderComponents', JSON.stringify(components));
    } catch (err) {
      logger.error('Error saving strategy components:', err);
    }
  }, [components]);

  // Save metadata to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('strategyBuilderMetadata', JSON.stringify(strategyMetadata));
    } catch (err) {
      logger.error('Error saving strategy metadata:', err);
    }
  }, [strategyMetadata]);

  // Create a new component
  const createComponent = useCallback((type, title = 'New Component') => {
    const newComponent = {
      id: `component-${Date.now()}`,
      type,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: {},
      isActive: true,
      position: { x: 100, y: 100 } // Add default position
    };

    setComponents(prev => [...prev, newComponent]);
    setSelectedComponentId(newComponent.id);
    setIsCreating(false);
    setComponentTypeToCreate(null);
    
    return newComponent;
  }, []);

  // Update existing component
  const updateComponent = useCallback((id, updates) => {
    setComponents(prev => 
      prev.map(component => 
        component.id === id 
          ? { 
              ...component, 
              ...updates, 
              updatedAt: new Date().toISOString() 
            } 
          : component
      )
    );
  }, []);

  // Delete a component
  const deleteComponent = useCallback((id) => {
    setComponents(prev => prev.filter(component => component.id !== id));
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
  }, [selectedComponentId]);

  // Select a component
  const selectComponent = useCallback((id) => {
    setSelectedComponentId(id);
  }, []);

  // Start the creation process
  const startCreatingComponent = useCallback((type) => {
    setIsCreating(true);
    setComponentTypeToCreate(type);
  }, []);

  // Cancel the creation process
  const cancelCreatingComponent = useCallback(() => {
    setIsCreating(false);
    setComponentTypeToCreate(null);
  }, []);

  // Update strategy metadata
  const updateStrategyMetadata = useCallback((updates) => {
    setStrategyMetadata(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Context value
  const value = {
    components,
    selectedComponentId,
    isCreating,
    componentTypeToCreate,
    isLoading,
    error,
    strategyMetadata,
    createComponent,
    updateComponent,
    deleteComponent,
    selectComponent,
    startCreatingComponent,
    cancelCreatingComponent,
    updateStrategyMetadata
  };

  return (
    <StrategyBuilderContext.Provider value={value}>
      {children}
    </StrategyBuilderContext.Provider>
  );
};

export default StrategyBuilderContext;