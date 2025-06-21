import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from './AuthContext';
import logger from '../utils/logger';

// Define onboarding steps - OPTIMIZED ACCOUNT-FIRST FLOW
export const ONBOARDING_STEPS = {
  WELCOME: 'welcome',
  ACCOUNT_CONNECTION: 'account_connection',
  STRATEGY_ACTIVATION: 'strategy_activation', // Combined selection + activation
  NETWORK_AMPLIFICATION: 'network_amplification', // Optional post-success enhancement
  COMPLETED: 'completed'
};

// Define user types for experience personalization
export const USER_TYPES = {
  NEW_USER: 'new_user',
  RETURNING_USER: 'returning_user',
  BETA_TESTER: 'beta_tester',
  POWER_USER: 'power_user'
};

// Define network states
export const NETWORK_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  SYNCHRONIZING: 'synchronizing',
  ACTIVE: 'active',
  ERROR: 'error',
  MAINTENANCE: 'maintenance'
};

// Initial context state - OPTIMIZED ACCOUNT-FIRST FLOW
const initialState = {
  // Onboarding state
  currentStep: ONBOARDING_STEPS.ACCOUNT_CONNECTION, // Start with account connection
  completedSteps: [],
  onboardingProgress: 0,
  isOnboardingComplete: false,
  
  // User experience state
  userType: USER_TYPES.NEW_USER,
  isFirstTime: true,
  hasSeenFeatures: {},
  
  // Strategy selection
  selectedStrategy: null,
  strategyConfig: null,
  
  // Account connection
  primaryAccount: null,
  satelliteAccounts: [],
  accountConnectionStatus: {},
  accountData: {
    coreAccount: null,
    accounts: [],
    totalBuyingPower: 0
  },
  
  // Network state
  networkState: NETWORK_STATES.IDLE,
  networkMetrics: {
    totalPower: 0,
    activeAccounts: 0,
    synchronizationStatus: 'waiting'
  },
  
  // Trading Lab preferences
  preferences: {
    showMagicMoments: true,
    enableAnimations: true,
    compactMode: false,
    notifications: {
      trades: true,
      networkStatus: true,
      achievements: true
    }
  },
  
  // UI state
  isLoading: false,
  error: null,
  showCelebration: false,
  celebrationType: null,
  
  // Feature progression
  unlockedFeatures: new Set(),
  achievementProgress: {},
  
  // Mobile optimization
  isMobileView: false,
  touchOptimized: false
};

// Create the context
export const TradingLabContext = createContext(initialState);

export const TradingLabProvider = ({ children }) => {
  // Core state - OPTIMIZED ACCOUNT-FIRST FLOW
  const [currentStep, setCurrentStep] = useState(ONBOARDING_STEPS.ACCOUNT_CONNECTION);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [onboardingProgress, setOnboardingProgress] = useState(0);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  
  // User experience
  const [userType, setUserType] = useState(USER_TYPES.NEW_USER);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [hasSeenFeatures, setHasSeenFeatures] = useState({});
  
  // Strategy and configuration
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [strategyConfig, setStrategyConfig] = useState(null);
  
  // Account management
  const [primaryAccount, setPrimaryAccount] = useState(null);
  const [satelliteAccounts, setSatelliteAccounts] = useState([]);
  const [accountConnectionStatus, setAccountConnectionStatus] = useState({});
  const [accountData, setAccountData] = useState(initialState.accountData);
  
  // Network state
  const [networkState, setNetworkState] = useState(NETWORK_STATES.IDLE);
  const [networkMetrics, setNetworkMetrics] = useState({
    totalPower: 0,
    activeAccounts: 0,
    synchronizationStatus: 'waiting'
  });
  
  // Preferences
  const [preferences, setPreferences] = useState(initialState.preferences);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState(null);
  
  // Feature progression
  const [unlockedFeatures, setUnlockedFeatures] = useState(new Set());
  const [achievementProgress, setAchievementProgress] = useState({});
  
  // Mobile state
  const [isMobileView, setIsMobileView] = useState(false);
  const [touchOptimized, setTouchOptimized] = useState(false);
  
  // External dependencies
  const { user, isAuthenticated } = useAuth();
  // TEMP: Skip feature flags to avoid API errors during testing
  // const { hasAtomikTradingLab } = useFeatureFlags();

  // Initialize user type based on authentication state and user data
  useEffect(() => {
    if (isAuthenticated && user) {
      // Determine user type based on existing data
      const hasStrategies = user.strategies?.length > 0;
      const hasAccounts = user.broker_accounts?.length > 0;
      const isBeta = user.is_beta_tester || user.app_role === 'Beta Tester';
      
      if (isBeta) {
        setUserType(USER_TYPES.BETA_TESTER);
      } else if (hasStrategies && hasAccounts) {
        setUserType(USER_TYPES.POWER_USER);
      } else if (hasStrategies || hasAccounts) {
        setUserType(USER_TYPES.RETURNING_USER);
      } else {
        setUserType(USER_TYPES.NEW_USER);
      }
      
      // Check if this is truly first time
      const tradingLabData = localStorage.getItem(`tradingLab_${user.id}`);
      setIsFirstTime(!tradingLabData);
    }
  }, [user, isAuthenticated]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsMobileView(isMobile);
      setTouchOptimized(isTouchDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate onboarding progress
  useEffect(() => {
    const totalSteps = Object.keys(ONBOARDING_STEPS).length - 1; // Exclude COMPLETED
    const progress = (completedSteps.length / totalSteps) * 100;
    setOnboardingProgress(Math.min(progress, 100));
    
    // Check if onboarding is complete - OPTIMIZED FLOW
    if (completedSteps.includes(ONBOARDING_STEPS.STRATEGY_ACTIVATION)) {
      setIsOnboardingComplete(true);
    }
  }, [completedSteps]);

  // Load persisted data
  useEffect(() => {
    if (user?.id) {
      loadTradingLabData();
    }
  }, [user?.id]);

  // Save data when state changes
  useEffect(() => {
    if (user?.id && !isFirstTime) {
      saveTradingLabData();
    }
  }, [
    currentStep, completedSteps, selectedStrategy, strategyConfig,
    primaryAccount, satelliteAccounts, accountData, preferences, user?.id, isFirstTime
  ]);

  // Load Trading Lab data from localStorage
  const loadTradingLabData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(`tradingLab_${user.id}`);
      if (savedData) {
        const data = JSON.parse(savedData);
        
        setCurrentStep(data.currentStep || ONBOARDING_STEPS.WELCOME);
        setCompletedSteps(data.completedSteps || []);
        setSelectedStrategy(data.selectedStrategy || null);
        setStrategyConfig(data.strategyConfig || null);
        setPrimaryAccount(data.primaryAccount || null);
        setSatelliteAccounts(data.satelliteAccounts || []);
        setAccountData({ ...initialState.accountData, ...data.accountData });
        setPreferences({ ...initialState.preferences, ...data.preferences });
        setHasSeenFeatures(data.hasSeenFeatures || {});
        setUnlockedFeatures(new Set(data.unlockedFeatures || []));
        setAchievementProgress(data.achievementProgress || {});
        
        logger.info('[TradingLab] Loaded saved data for user', user.id);
      }
    } catch (error) {
      logger.error('[TradingLab] Failed to load saved data:', error);
    }
  }, [user?.id]);

  // Save Trading Lab data to localStorage
  const saveTradingLabData = useCallback(() => {
    try {
      const dataToSave = {
        currentStep,
        completedSteps,
        selectedStrategy,
        strategyConfig,
        primaryAccount,
        satelliteAccounts,
        accountData,
        preferences,
        hasSeenFeatures,
        unlockedFeatures: Array.from(unlockedFeatures),
        achievementProgress,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(`tradingLab_${user.id}`, JSON.stringify(dataToSave));
      logger.debug('[TradingLab] Saved data for user', user.id);
    } catch (error) {
      logger.error('[TradingLab] Failed to save data:', error);
    }
  }, [
    currentStep, completedSteps, selectedStrategy, strategyConfig,
    primaryAccount, satelliteAccounts, accountData, preferences, hasSeenFeatures,
    unlockedFeatures, achievementProgress, user?.id
  ]);

  // Onboarding flow functions
  const nextStep = useCallback(() => {
    const steps = Object.values(ONBOARDING_STEPS);
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1) {
      const nextStepValue = steps[currentIndex + 1];
      setCurrentStep(nextStepValue);
      
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      
      logger.info('[TradingLab] Advanced to step:', nextStepValue);
    }
  }, [currentStep, completedSteps]);

  const previousStep = useCallback(() => {
    const steps = Object.values(ONBOARDING_STEPS);
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex > 0) {
      const prevStepValue = steps[currentIndex - 1];
      setCurrentStep(prevStepValue);
      logger.info('[TradingLab] Returned to step:', prevStepValue);
    }
  }, [currentStep]);

  const skipToStep = useCallback((step) => {
    setCurrentStep(step);
    logger.info('[TradingLab] Skipped to step:', step);
  }, []);

  const completeOnboarding = useCallback(() => {
    setCurrentStep(ONBOARDING_STEPS.COMPLETED);
    setIsOnboardingComplete(true);
    setCompletedSteps(Object.values(ONBOARDING_STEPS).slice(0, -1));
    setOnboardingProgress(100);
    
    // Trigger celebration
    triggerCelebration('onboarding_complete');
    
    logger.info('[TradingLab] Onboarding completed');
  }, []);

  // Strategy management
  const selectStrategy = useCallback((strategy) => {
    setSelectedStrategy(strategy);
    logger.info('[TradingLab] Selected strategy:', strategy?.name);
  }, []);

  const updateStrategyConfig = useCallback((config) => {
    setStrategyConfig(config);
    logger.debug('[TradingLab] Updated strategy config');
  }, []);

  // Account management
  const setPrimary = useCallback((account) => {
    setPrimaryAccount(account);
    setAccountConnectionStatus(prev => ({
      ...prev,
      [account.id]: 'connected'
    }));
    logger.info('[TradingLab] Set primary account:', account.nickname || account.id);
  }, []);

  const addSatelliteAccount = useCallback((account) => {
    setSatelliteAccounts(prev => [...prev, account]);
    setAccountConnectionStatus(prev => ({
      ...prev,
      [account.id]: 'connected'
    }));
    logger.info('[TradingLab] Added satellite account:', account.nickname || account.id);
  }, []);

  const removeSatelliteAccount = useCallback((accountId) => {
    setSatelliteAccounts(prev => prev.filter(acc => acc.id !== accountId));
    setAccountConnectionStatus(prev => {
      const updated = { ...prev };
      delete updated[accountId];
      return updated;
    });
    logger.info('[TradingLab] Removed satellite account:', accountId);
  }, []);

  // Network management
  const updateNetworkState = useCallback((state) => {
    setNetworkState(state);
    logger.info('[TradingLab] Network state changed to:', state);
  }, []);

  const updateNetworkMetrics = useCallback((metrics) => {
    setNetworkMetrics(prev => ({ ...prev, ...metrics }));
  }, []);

  // Feature management
  const unlockFeature = useCallback((featureName) => {
    setUnlockedFeatures(prev => new Set([...prev, featureName]));
    logger.info('[TradingLab] Unlocked feature:', featureName);
  }, []);

  const markFeatureSeen = useCallback((featureName) => {
    setHasSeenFeatures(prev => ({ ...prev, [featureName]: true }));
  }, []);

  // Celebration system
  const triggerCelebration = useCallback((type) => {
    setCelebrationType(type);
    setShowCelebration(true);
    
    // Auto-hide after animation
    setTimeout(() => {
      setShowCelebration(false);
      setCelebrationType(null);
    }, 5000);
    
    logger.info('[TradingLab] Triggered celebration:', type);
  }, []);

  // Preference management
  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset functions
  const resetOnboarding = useCallback(() => {
    setCurrentStep(ONBOARDING_STEPS.WELCOME);
    setCompletedSteps([]);
    setOnboardingProgress(0);
    setIsOnboardingComplete(false);
    setSelectedStrategy(null);
    setStrategyConfig(null);
    logger.info('[TradingLab] Reset onboarding');
  }, []);

  const resetTradingLab = useCallback(() => {
    // Reset to initial state
    Object.keys(initialState).forEach(key => {
      const setState = eval(`set${key.charAt(0).toUpperCase() + key.slice(1)}`);
      if (setState) setState(initialState[key]);
    });
    
    // Clear localStorage
    if (user?.id) {
      localStorage.removeItem(`tradingLab_${user.id}`);
    }
    
    logger.info('[TradingLab] Complete reset performed');
  }, [user?.id]);

  // Context value
  const contextValue = {
    // State
    currentStep,
    completedSteps,
    onboardingProgress,
    isOnboardingComplete,
    userType,
    isFirstTime,
    hasSeenFeatures,
    selectedStrategy,
    strategyConfig,
    primaryAccount,
    satelliteAccounts,
    accountConnectionStatus,
    accountData,
    networkState,
    networkMetrics,
    preferences,
    isLoading,
    error,
    showCelebration,
    celebrationType,
    unlockedFeatures,
    achievementProgress,
    isMobileView,
    touchOptimized,
    
    // Onboarding functions
    nextStep,
    previousStep,
    skipToStep,
    completeOnboarding,
    resetOnboarding,
    
    // Strategy functions
    selectStrategy,
    updateStrategyConfig,
    
    // Account functions
    setPrimary,
    addSatelliteAccount,
    removeSatelliteAccount,
    setAccountData,
    
    // Network functions
    updateNetworkState,
    updateNetworkMetrics,
    
    // Feature functions
    unlockFeature,
    markFeatureSeen,
    
    // UI functions
    triggerCelebration,
    updatePreferences,
    
    // Utility functions
    resetTradingLab,
    
    // Computed values
    hasMultipleAccounts: satelliteAccounts.length > 0,
    totalAccountPower: (primaryAccount?.buying_power || 0) + 
                     satelliteAccounts.reduce((sum, acc) => sum + (acc.buying_power || 0), 0),
    isNetworkActive: networkState === NETWORK_STATES.ACTIVE,
    canAccessTradingLab: true, // TEMP: Always allow access during testing
    
    // Constants
    ONBOARDING_STEPS,
    USER_TYPES,
    NETWORK_STATES
  };

  return (
    <TradingLabContext.Provider value={contextValue}>
      {children}
    </TradingLabContext.Provider>
  );
};

// Custom hook for using the Trading Lab context
export const useTradingLab = () => {
  const context = useContext(TradingLabContext);
  if (!context) {
    throw new Error('useTradingLab must be used within a TradingLabProvider');
  }
  return context;
};

export default TradingLabContext;