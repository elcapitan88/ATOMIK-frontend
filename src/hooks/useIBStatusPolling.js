// hooks/useIBStatusPolling.js
import { useEffect, useRef, useCallback } from 'react';
import axiosInstance from '@/services/axiosConfig';

// Polling intervals based on account state
const POLLING_INTERVALS = {
  TRANSITIONING: 10000,    // 10 seconds during state changes
  RUNNING: 30000,          // 30 seconds for running accounts
  STOPPED: 60000,          // 60 seconds for stopped accounts
  ERROR: 120000,           // 2 minutes for error states
  MAX_DURATION: 600000,    // 10 minutes max for provisioning
};

// States that indicate a transition is happening
const TRANSITIONING_STATES = [
  'provisioning',
  'initializing',
  'starting',
  'stopping',
  'restarting'
];

export const useIBStatusPolling = (accounts, onStatusUpdate) => {
  const pollingTimersRef = useRef({});
  const pollingStartTimesRef = useRef({});
  const lastStatusRef = useRef({});

  // Check IBeam health status
  const checkIBeamHealth = useCallback(async (account) => {
    if (!account.do_ip_address) return null;
    
    try {
      const response = await axiosInstance.get(
        `/api/v1/brokers/interactivebrokers/accounts/${account.account_id}/ibeam-health`
      );
      return response.data?.authenticated || false;
    } catch (error) {
      console.error(`IBeam health check failed for ${account.account_id}:`, error);
      return null;
    }
  }, []);

  // Get account status from backend
  const fetchAccountStatus = useCallback(async (account) => {
    try {
      const response = await axiosInstance.get(
        `/api/v1/brokers/interactivebrokers/accounts/${account.account_id}/status`
      );
      
      const serverStatus = response.data?.status;
      const ibeamAuthenticated = await checkIBeamHealth(account);
      
      // Combine server status with IBeam health
      let finalStatus = serverStatus;
      if (serverStatus === 'running' && ibeamAuthenticated === false) {
        finalStatus = 'initializing'; // Server is up but IBeam not ready
      }
      
      return {
        status: finalStatus,
        ibeamAuthenticated,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Status check failed for ${account.account_id}:`, error);
      return {
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }, [checkIBeamHealth]);

  // Determine polling interval based on status
  const getPollingInterval = useCallback((status, accountId) => {
    // Check if stuck in provisioning for too long
    const startTime = pollingStartTimesRef.current[accountId];
    if (startTime && status === 'provisioning') {
      const elapsed = Date.now() - startTime;
      if (elapsed > POLLING_INTERVALS.MAX_DURATION) {
        console.warn(`Account ${accountId} stuck in provisioning for ${elapsed}ms`);
        return POLLING_INTERVALS.ERROR;
      }
    }

    if (TRANSITIONING_STATES.includes(status)) {
      return POLLING_INTERVALS.TRANSITIONING;
    }
    
    switch (status) {
      case 'running':
        return POLLING_INTERVALS.RUNNING;
      case 'stopped':
      case 'off':
        return POLLING_INTERVALS.STOPPED;
      case 'error':
      case 'deleted':
        return POLLING_INTERVALS.ERROR;
      default:
        return POLLING_INTERVALS.STOPPED;
    }
  }, []);

  // Poll a single account
  const pollAccount = useCallback(async (account) => {
    const accountId = account.account_id;
    
    // Don't poll deleted accounts
    if (account.status === 'deleted' || account.digital_ocean_status === 'deleted') {
      if (pollingTimersRef.current[accountId]) {
        clearTimeout(pollingTimersRef.current[accountId]);
        delete pollingTimersRef.current[accountId];
      }
      return;
    }

    // Fetch latest status
    const statusData = await fetchAccountStatus(account);
    
    // Check if status changed
    const previousStatus = lastStatusRef.current[accountId];
    if (previousStatus !== statusData.status) {
      console.log(`IB account ${accountId} status changed: ${previousStatus} → ${statusData.status}`);
      
      // Track when provisioning starts
      if (statusData.status === 'provisioning' && !pollingStartTimesRef.current[accountId]) {
        pollingStartTimesRef.current[accountId] = Date.now();
      }
      
      // Clear provisioning start time when done
      if (previousStatus === 'provisioning' && statusData.status !== 'provisioning') {
        delete pollingStartTimesRef.current[accountId];
      }
      
      lastStatusRef.current[accountId] = statusData.status;
    }

    // Update account status
    onStatusUpdate(accountId, statusData);

    // Schedule next poll with adaptive interval
    const interval = getPollingInterval(statusData.status, accountId);
    pollingTimersRef.current[accountId] = setTimeout(() => {
      pollAccount(account);
    }, interval);
  }, [fetchAccountStatus, getPollingInterval, onStatusUpdate]);

  // Start polling for all IB accounts
  const startPolling = useCallback(() => {
    const ibAccounts = accounts.filter(acc => 
      acc.broker_id === 'interactivebrokers' && 
      acc.status !== 'deleted'
    );

    ibAccounts.forEach(account => {
      // Clear existing timer if any
      if (pollingTimersRef.current[account.account_id]) {
        clearTimeout(pollingTimersRef.current[account.account_id]);
      }

      // Start immediate poll
      pollAccount(account);
    });
  }, [accounts, pollAccount]);

  // Stop all polling
  const stopPolling = useCallback(() => {
    Object.values(pollingTimersRef.current).forEach(timer => {
      clearTimeout(timer);
    });
    pollingTimersRef.current = {};
    pollingStartTimesRef.current = {};
    lastStatusRef.current = {};
  }, []);

  // Effect to manage polling lifecycle
  useEffect(() => {
    startPolling();

    return () => {
      stopPolling();
    };
  }, [accounts, startPolling, stopPolling]);

  // Manual refresh function
  const refreshStatus = useCallback((accountId) => {
    const account = accounts.find(acc => acc.account_id === accountId);
    if (account && account.broker_id === 'interactivebrokers') {
      pollAccount(account);
    }
  }, [accounts, pollAccount]);

  return {
    refreshStatus,
    stopPolling,
    startPolling
  };
};

export default useIBStatusPolling;