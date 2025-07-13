// src/hooks/useAudioAlerts.js
import { useState, useEffect, useCallback, useRef } from 'react';

// Audio file paths - matching exact filenames
const AUDIO_FILES = {
  openAdd: '/sounds/Open-Add.mp3',
  closeSubtract: '/sounds/Close-Subtract.mp3',
  // Future alerts can be added here
};

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  volume: 0.5,
  alerts: {
    openAdd: true,
    closeSubtract: true,
  }
};

// Storage key
const STORAGE_KEY = 'atomik_audio_settings';

export const useAudioAlerts = (selectedAccount, selectedBroker) => {
  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Audio instances cache
  const audioCache = useRef({});
  
  // Track previous position quantities to detect increases/decreases
  const previousQuantities = useRef(new Map());
  
  // Flag to prevent alerts on initial load
  const isInitialized = useRef(false);
  const initTimeout = useRef(null);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);
  
  // Set initialized flag after a delay to prevent page load alerts
  useEffect(() => {
    isInitialized.current = false;
    initTimeout.current = setTimeout(() => {
      isInitialized.current = true;
      console.log('[AudioAlerts] Initialized - alerts now active');
    }, 3000); // 3 second delay before alerts become active
    
    return () => {
      if (initTimeout.current) {
        clearTimeout(initTimeout.current);
      }
    };
  }, [selectedAccount, selectedBroker]); // Reset on account change

  // Preload audio files
  useEffect(() => {
    if (settings.enabled) {
      Object.entries(AUDIO_FILES).forEach(([key, path]) => {
        if (!audioCache.current[key]) {
          const audio = new Audio(path);
          audio.volume = settings.volume;
          audioCache.current[key] = audio;
        }
      });
    }
  }, [settings.enabled, settings.volume]);

  // Play specific sound
  const playSound = useCallback((soundKey) => {
    if (!settings.enabled || !settings.alerts[soundKey]) return;

    try {
      const audio = audioCache.current[soundKey];
      if (audio) {
        audio.volume = settings.volume;
        audio.currentTime = 0; // Reset to start
        audio.play().catch(err => {
          console.warn(`Failed to play ${soundKey} sound:`, err);
        });
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [settings]);

  // Check position changes and play appropriate alert
  const checkPositionChange = useCallback((position) => {
    if (!position || !position.positionId) return;
    
    // Skip alerts if not initialized (prevents page load alerts)
    if (!isInitialized.current) {
      // Still track the position, just don't play sound
      const positionId = position.positionId;
      const currentQuantity = position.quantity || 0;
      if (currentQuantity > 0) {
        previousQuantities.current.set(positionId, currentQuantity);
      }
      return;
    }

    const positionId = position.positionId;
    const currentQuantity = position.quantity || 0;
    const previousQuantity = previousQuantities.current.get(positionId) || 0;

    // New position or quantity increased
    if (previousQuantity === 0 && currentQuantity > 0) {
      // New position opened
      playSound('openAdd');
    } else if (currentQuantity > previousQuantity) {
      // Position increased (added to position)
      playSound('openAdd');
    } else if (currentQuantity < previousQuantity && currentQuantity > 0) {
      // Position decreased (partial close)
      playSound('closeSubtract');
    } else if (previousQuantity > 0 && currentQuantity === 0) {
      // Position fully closed
      playSound('closeSubtract');
      // Remove from tracking
      previousQuantities.current.delete(positionId);
      return;
    }

    // Update the tracked quantity
    if (currentQuantity > 0) {
      previousQuantities.current.set(positionId, currentQuantity);
    }
  }, [playSound]);

  // Process multiple positions (for initial snapshot)
  const checkPositions = useCallback((positions) => {
    if (!Array.isArray(positions)) return;

    positions.forEach(position => {
      checkPositionChange(position);
    });
  }, [checkPositionChange]);

  // Clear all tracked positions (on disconnect/reset)
  const clearTrackedPositions = useCallback(() => {
    previousQuantities.current.clear();
    isInitialized.current = false;
  }, []);
  
  // Test functions for volume adjustment
  const testOpenAdd = useCallback(() => {
    playSound('openAdd');
  }, [playSound]);
  
  const testCloseSubtract = useCallback(() => {
    playSound('closeSubtract');
  }, [playSound]);

  // Update settings
  const updateSettings = useCallback((updates) => {
    setSettings(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Update volume
  const setVolume = useCallback((volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    updateSettings({ volume: clampedVolume });
    
    // Update all cached audio volumes
    Object.values(audioCache.current).forEach(audio => {
      audio.volume = clampedVolume;
    });
  }, [updateSettings]);

  // Toggle specific alert
  const toggleAlert = useCallback((alertKey) => {
    setSettings(prev => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        [alertKey]: !prev.alerts[alertKey]
      }
    }));
  }, []);

  // Toggle all alerts
  const toggleEnabled = useCallback(() => {
    updateSettings({ enabled: !settings.enabled });
  }, [settings.enabled, updateSettings]);

  return {
    // Settings
    settings,
    
    // Main functions
    checkPositionChange,
    checkPositions,
    clearTrackedPositions,
    
    // Direct playback (if needed)
    playOpenAdd: () => playSound('openAdd'),
    playCloseSubtract: () => playSound('closeSubtract'),
    
    // Test functions
    testOpenAdd,
    testCloseSubtract,
    
    // Settings management
    setVolume,
    toggleAlert,
    toggleEnabled,
    updateSettings,
  };
};

export default useAudioAlerts;