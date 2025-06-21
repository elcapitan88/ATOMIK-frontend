/**
 * Atomik Brand Terminology Constants
 * 
 * This file establishes consistent atomic/scientific terminology 
 * throughout the Trading Lab components to reinforce the premium
 * brand positioning and scientific precision theme.
 */

// Core Atomic Terminology
export const ATOMIC_TERMS = {
  // Account Types
  CORE_ACCOUNT: 'Core Account',
  CORE_ACCOUNT_SHORT: 'Core',
  SATELLITE_ACCOUNT: 'Satellite Network',
  SATELLITE_ACCOUNT_SHORT: 'Satellite',
  
  // Actions & Processes
  INITIATE: 'Initiate',
  ACTIVATE: 'Activate',
  SYNCHRONIZE: 'Synchronize',
  REACTION: 'Reaction',
  FUSION: 'Fusion',
  CATALYZE: 'Catalyze',
  AMPLIFY: 'Amplify',
  
  // Network & System
  NETWORK: 'Network',
  TRADING_NETWORK: 'Trading Network',
  ATOMIC_NETWORK: 'Atomic Network',
  SYNCHRONIZATION: 'Synchronization',
  NETWORK_POWER: 'Atomic Power',
  NETWORK_STRENGTH: 'Network Strength',
  
  // Strategy & Trading
  STRATEGY: 'Strategy',
  REACTION_PATTERN: 'Reaction Pattern',
  TRADING_REACTION: 'Trading Reaction',
  MOLECULAR_PATTERN: 'Molecular Pattern',
  SIGNAL_RECEPTION: 'Signal Reception',
  EXTERNAL_CATALYST: 'External Catalyst',
  
  // States & Status
  SCANNING: 'Scanning',
  ANALYZING: 'Analyzing',
  SYNCHRONIZED: 'Synchronized',
  ACTIVE_REACTION: 'Active Reaction',
  CHAIN_REACTION: 'Chain Reaction',
  STABLE: 'Stable',
  UNSTABLE: 'Unstable',
  
  // Lab & Environment
  TRADING_LAB: 'Trading Lab',
  LABORATORY: 'Laboratory',
  COMMAND_CENTER: 'Command Center',
  CONTROL_PANEL: 'Control Panel',
  RESEARCH_CENTER: 'Research Center',
  
  // User Types
  ALGORITHMIC_TRADER: 'Algorithmic Trader',
  NETWORK_OPERATOR: 'Network Operator',
  STRATEGY_ARCHITECT: 'Strategy Architect',
  LAB_TECHNICIAN: 'Lab Technician'
};

// UI Labels with Atomic Terminology
export const UI_LABELS = {
  // Buttons
  INITIATE_STRATEGY: 'Initiate Strategy',
  ACTIVATE_NETWORK: 'Activate Network',
  SYNCHRONIZE_ACCOUNTS: 'Synchronize Accounts',
  START_REACTION: 'Start the Reaction!',
  AMPLIFY_NETWORK: 'Amplify Network',
  
  // Navigation
  ENTER_LAB: 'Enter Trading Lab',
  LAB_OVERVIEW: 'Lab Overview',
  NETWORK_STATUS: 'Network Status',
  REACTION_MONITOR: 'Reaction Monitor',
  
  // Status Indicators
  NETWORK_ACTIVE: 'Network Active',
  REACTION_IN_PROGRESS: 'Reaction in Progress',
  SYNCHRONIZING_NETWORK: 'Synchronizing Network',
  SCANNING_MARKETS: 'Scanning Molecular Patterns',
  AWAITING_SIGNALS: 'Awaiting Catalyst Signals',
  
  // Achievements
  NETWORK_ACTIVATED: 'Network Activated!',
  FIRST_REACTION: 'First Reaction Complete!',
  SYNCHRONIZED_SUCCESS: 'Perfect Synchronization!',
  POWER_AMPLIFIED: 'Network Power Amplified!',
  
  // Configuration
  REACTION_SETTINGS: 'Reaction Settings',
  NETWORK_CONFIGURATION: 'Network Configuration',
  SIGNAL_SENSITIVITY: 'Signal Sensitivity',
  CATALYST_FILTERS: 'Catalyst Filters'
};

// Status Messages with Scientific Language
export const STATUS_MESSAGES = {
  // Connection States
  ESTABLISHING_CONNECTION: 'Establishing molecular bonds...',
  CONNECTION_STABLE: 'Molecular bonds stable',
  CONNECTION_UNSTABLE: 'Molecular instability detected',
  
  // Synchronization
  SYNC_IN_PROGRESS: 'Synchronizing atomic frequencies...',
  SYNC_COMPLETE: 'All elements in perfect harmony',
  SYNC_FAILED: 'Synchronization disrupted',
  
  // Trading Activity
  SCANNING_PATTERNS: 'Scanning molecular patterns...',
  SIGNAL_DETECTED: 'Catalyst signal detected',
  REACTION_TRIGGERED: 'Trading reaction initiated',
  REACTION_COMPLETE: 'Reaction cycle complete',
  
  // Network States
  NETWORK_STABLE: 'Network operating at optimal frequency',
  NETWORK_EXPANDING: 'Network expansion in progress',
  NETWORK_OPTIMIZING: 'Optimizing atomic alignment',
  
  // Error States
  NETWORK_DISRUPTION: 'Network disruption detected',
  SIGNAL_INTERFERENCE: 'Signal interference present',
  CATALYST_UNAVAILABLE: 'External catalyst unavailable'
};

// Notification Templates
export const NOTIFICATIONS = {
  // Success Notifications
  NETWORK_ACTIVATED: {
    title: '⚛️ Network Activated!',
    message: 'Your trading network is now synchronized and scanning for opportunities.',
    type: 'success'
  },
  FIRST_TRADE: {
    title: '🎯 First Reaction Complete!',
    message: 'Your network has executed its first trading reaction.',
    type: 'achievement'
  },
  SATELLITE_CONNECTED: {
    title: '🔗 Satellite Connected!',
    message: 'New satellite account successfully synchronized to your network.',
    type: 'success'
  },
  
  // Information Notifications
  SIGNAL_RECEIVED: {
    title: '📡 Catalyst Signal Received',
    message: 'External catalyst detected. Network analyzing for reaction potential.',
    type: 'info'
  },
  SYNC_REQUIRED: {
    title: '⚡ Synchronization Required',
    message: 'Network elements require frequency alignment for optimal performance.',
    type: 'warning'
  },
  
  // Error Notifications
  CONNECTION_LOST: {
    title: '⚠️ Network Disruption',
    message: 'Temporary disruption in network connectivity. Attempting to restore...',
    type: 'error'
  }
};

// Help Text with Scientific Explanations
export const HELP_TEXT = {
  CORE_ACCOUNT: 'Your Core Account serves as the primary nucleus of your trading network, providing the foundational structure for all trading reactions.',
  
  SATELLITE_ACCOUNTS: 'Satellite accounts orbit your Core Account, mirroring its trading reactions to amplify your overall network power and diversify execution.',
  
  NETWORK_SYNCHRONIZATION: 'Synchronization ensures all network elements operate on the same frequency, executing trades simultaneously across your entire network.',
  
  TRADING_REACTIONS: 'Trading reactions are triggered when market conditions align with your strategy parameters, causing coordinated execution across your network.',
  
  ATOMIC_POWER: 'Your total Atomic Power represents the combined buying power of all synchronized accounts in your trading network.',
  
  SIGNAL_RECEPTION: 'External signals from webhooks act as catalysts, triggering specific trading reactions when received by your network.'
};

// Animation and Celebration Messages
export const CELEBRATIONS = {
  ONBOARDING_COMPLETE: {
    title: '🎊 Network Operator Initiated!',
    subtitle: 'You\'re now an algorithmic trader with a synchronized trading network.',
    message: 'Your transformation is complete. Welcome to the future of precision trading.'
  },
  
  FIRST_NETWORK_ACTIVATION: {
    title: '⚛️ Network Activated!',
    subtitle: 'All elements synchronized and scanning for opportunities.',
    message: 'Your trading network is now operational and ready to react.'
  },
  
  MULTI_ACCOUNT_SETUP: {
    title: '🔗 Network Amplified!',
    subtitle: 'Multiple accounts synchronized successfully.',
    message: 'Your trading power has been amplified through network effects.'
  },
  
  FIRST_PROFITABLE_TRADE: {
    title: '💰 Reaction Profitable!',
    subtitle: 'Your network generated positive returns.',
    message: 'The precision of your trading network is already paying dividends.'
  }
};

// Onboarding Flow Messages
export const ONBOARDING_MESSAGES = {
  WELCOME: {
    title: '⚛️ Welcome to Atomik Trading!',
    subtitle: 'You\'re 3 minutes away from having AI trading for you automatically',
    description: 'Transform from manual trader to network operator with our premium onboarding experience.'
  },
  
  STRATEGY_SELECTION: {
    title: 'Choose Your Reaction Pattern',
    subtitle: 'Select a proven strategy to power your trading network',
    description: 'Each strategy represents a unique molecular approach to market opportunities.'
  },
  
  ACCOUNT_CONNECTION: {
    title: 'Connect Your Core Account',
    subtitle: 'Your strategy needs accounts to trade with',
    description: 'Establish the foundational nucleus of your trading network.'
  },
  
  NETWORK_EXPANSION: {
    title: 'Build Your Trading Network',
    subtitle: 'Amplify your power with satellite accounts',
    description: 'Optional but powerful - synchronize multiple accounts for maximum effect.'
  },
  
  ACTIVATION: {
    title: 'Initiate Your Network',
    subtitle: 'Deploy your strategy across all connected accounts',
    description: 'Activate synchronized trading reactions across your entire network.'
  }
};

// Error Messages with Atomic Theming
export const ERROR_MESSAGES = {
  NETWORK_INSTABILITY: 'Network instability detected. Attempting to restore molecular bonds...',
  SYNCHRONIZATION_FAILED: 'Synchronization failed. Network elements operating on different frequencies.',
  SIGNAL_INTERFERENCE: 'External signal interference preventing catalyst reception.',
  INSUFFICIENT_POWER: 'Insufficient atomic power for this reaction. Increase account balances.',
  CONNECTION_DISRUPTED: 'Molecular bonds disrupted. Checking network connectivity...',
  STRATEGY_MALFUNCTION: 'Strategy reaction pattern malfunction. Reverting to stable configuration.'
};

// Progress Indicators
export const PROGRESS_MESSAGES = {
  ANALYZING: 'Analyzing molecular patterns...',
  CONNECTING: 'Establishing quantum entanglement...',
  SYNCHRONIZING: 'Aligning atomic frequencies...',
  OPTIMIZING: 'Optimizing reaction pathways...',
  EXECUTING: 'Initiating chain reaction...',
  COMPLETING: 'Stabilizing network state...'
};

// Export all terminology for easy access
export const ATOMIK_TERMINOLOGY = {
  ATOMIC_TERMS,
  UI_LABELS,
  STATUS_MESSAGES,
  NOTIFICATIONS,
  HELP_TEXT,
  CELEBRATIONS,
  ONBOARDING_MESSAGES,
  ERROR_MESSAGES,
  PROGRESS_MESSAGES
};

export default ATOMIK_TERMINOLOGY;