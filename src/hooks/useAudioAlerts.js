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
  volume: 0.3,
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
    // Clear any existing timeout
    if (initTimeout.current) {
      clearTimeout(initTimeout.current);
    }
    
    // Reset initialization flag when account changes
    isInitialized.current = false;
    
    // Set flag after 3 seconds to prevent false alerts
    initTimeout.current = setTimeout(() => {
      isInitialized.current = true;
      console.log('[useAudioAlerts] Initialization complete - alerts enabled');
    }, 3000);

    return () => {
      if (initTimeout.current) {
        clearTimeout(initTimeout.current);
      }
    };
  }, [selectedAccount, selectedBroker]);

  // Preload and cache audio files
  useEffect(() => {
    Object.entries(AUDIO_FILES).forEach(([key, path]) => {
      if (!audioCache.current[key]) {
        try {
          const audio = new Audio(path);
          audio.volume = settings.volume;
          audio.preload = 'auto';
          audioCache.current[key] = audio;
          
          // Handle loading errors gracefully
          audio.addEventListener('error', (e) => {
            console.warn(`[useAudioAlerts] Failed to load audio file: ${path}`, e);
          });
        } catch (error) {
          console.warn(`[useAudioAlerts] Error creating audio instance for ${path}:`, error);
        }
      }
    });
  }, [settings.volume]);

  // Update volume for all cached audio instances
  useEffect(() => {
    Object.values(audioCache.current).forEach(audio => {
      if (audio) {
        audio.volume = settings.volume;
      }
    });
  }, [settings.volume]);

  // Play an alert sound
  const playAlert = useCallback((alertType) => {
    if (!settings.enabled || !settings.alerts[alertType]) {
      return;
    }

    const audio = audioCache.current[alertType];
    if (audio) {
      try {
        // Reset audio to beginning and play
        audio.currentTime = 0;
        const playPromise = audio.play();
        
        // Handle play promise for browsers that require user interaction
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn(`[useAudioAlerts] Audio play failed for ${alertType}:`, error);
          });
        }
        
        console.log(`[useAudioAlerts] Played ${alertType} alert`);
      } catch (error) {
        console.warn(`[useAudioAlerts] Error playing ${alertType} alert:`, error);
      }
    } else {
      console.warn(`[useAudioAlerts] Audio not loaded for ${alertType}`);
    }
  }, [settings.enabled, settings.alerts]);

  // Check a single position for changes
  const checkPositionChange = useCallback((position) => {
    if (!isInitialized.current || !position || !position.positionId) {
      return;
    }

    const positionKey = `${position.positionId}_${position.accountId}`;
    const currentQuantity = Math.abs(position.quantity || position.netPos || 0);
    const previousQuantity = previousQuantities.current.get(positionKey) || 0;

    // Skip if no change
    if (currentQuantity === previousQuantity) {
      return;
    }

    console.log(`[useAudioAlerts] Position change detected: ${positionKey}`, {
      previous: previousQuantity,
      current: currentQuantity,
      symbol: position.symbol
    });

    // Determine alert type
    if (previousQuantity === 0 && currentQuantity > 0) {
      // New position opened
      console.log('[useAudioAlerts] Position opened, playing openAdd alert');
      playAlert('openAdd');
    } else if (currentQuantity > previousQuantity) {
      // Position increased (adding to position)
      console.log('[useAudioAlerts] Position increased, playing openAdd alert');
      playAlert('openAdd');
    } else if (currentQuantity === 0 && previousQuantity > 0) {
      // Position closed
      console.log('[useAudioAlerts] Position closed, playing closeSubtract alert');
      playAlert('closeSubtract');
    } else if (currentQuantity < previousQuantity && currentQuantity > 0) {
      // Position reduced (partial close)
      console.log('[useAudioAlerts] Position reduced, playing closeSubtract alert');
      playAlert('closeSubtract');
    }

    // Update tracked quantity
    previousQuantities.current.set(positionKey, currentQuantity);
  }, [playAlert]);

  // Check multiple positions at once
  const checkPositions = useCallback((positions) => {
    if (!Array.isArray(positions)) {
      return;
    }

    positions.forEach(position => {
      checkPositionChange(position);
    });
  }, [checkPositionChange]);

  // Clear tracked positions (useful on account change or disconnect)
  const clearTrackedPositions = useCallback(() => {
    console.log('[useAudioAlerts] Clearing tracked positions');
    previousQuantities.current.clear();
    isInitialized.current = false;
  }, []);

  // Test methods for development
  const testOpenAdd = useCallback(() => {
    console.log('[useAudioAlerts] Testing openAdd alert');
    playAlert('openAdd');
  }, [playAlert]);

  const testCloseSubtract = useCallback(() => {
    console.log('[useAudioAlerts] Testing closeSubtract alert');
    playAlert('closeSubtract');
  }, [playAlert]);

  // Settings controls
  const setVolume = useCallback((volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setSettings(prev => ({
      ...prev,
      volume: clampedVolume
    }));
  }, []);

  const toggleEnabled = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  }, []);

  const toggleAlert = useCallback((alertType) => {
    setSettings(prev => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        [alertType]: !prev.alerts[alertType]
      }
    }));
  }, []);

  return {
    settings,
    checkPositions,
    checkPositionChange,
    clearTrackedPositions,
    testOpenAdd,
    testCloseSubtract,
    setVolume,
    toggleEnabled,
    toggleAlert,
    playAlert
  };
};

export default useAudioAlerts;