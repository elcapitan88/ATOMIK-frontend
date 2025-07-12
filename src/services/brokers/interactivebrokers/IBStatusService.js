// src/services/brokers/interactivebrokers/IBStatusService.js
import { Subject } from 'rxjs';
import axiosInstance from '@/services/axiosConfig';
import logger from '@/utils/logger';

class IBStatusService {
    constructor() {
        // Observable for status updates
        this.statusSubject = new Subject();
        
        // Active polling timers (accountId -> timerId)
        this.pollingTimers = new Map();
        
        // Last known status for each account
        this.lastStatus = new Map();
        
        // Polling start times for provisioning timeout
        this.pollingStartTimes = new Map();
        
        // Service state
        this.isActive = false;
        
        logger.info('IBStatusService initialized');
    }

    // Polling intervals based on account status
    getPollingInterval(status, accountId) {
        const POLLING_INTERVALS = {
            TRANSITIONING: 10000,    // 10 seconds during state changes
            RUNNING: 30000,          // 30 seconds for running accounts
            STOPPED: 60000,          // 60 seconds for stopped accounts
            ERROR: 120000,           // 2 minutes for error states
            MAX_DURATION: 600000,    // 10 minutes max for provisioning
        };

        // Check if we've been polling for too long (provisioning timeout)
        const startTime = this.pollingStartTimes.get(accountId);
        if (startTime && (Date.now() - startTime) > POLLING_INTERVALS.MAX_DURATION) {
            logger.warn(`IB account ${accountId} has been provisioning for over 10 minutes`);
            return POLLING_INTERVALS.ERROR;
        }

        // Determine interval based on status
        if (['provisioning', 'initializing', 'starting', 'stopping', 'restarting'].includes(status)) {
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
    }

    // Fetch account status from backend
    async fetchAccountStatus(account) {
        try {
            const response = await axiosInstance.get(
                `/api/v1/brokers/interactivebrokers/accounts/${account.account_id}/status`
            );
            
            const statusData = {
                status: response.data.digital_ocean_status || response.data.status || 'unknown',
                ibeamAuthenticated: response.data.ibeam_authenticated || null,
                lastChecked: new Date().toISOString(),
                account: account
            };

            logger.debug(`IB status fetched for ${account.account_id}: ${statusData.status}`);
            return statusData;
        } catch (error) {
            logger.error(`Error fetching IB status for ${account.account_id}:`, error);
            return {
                status: 'error',
                ibeamAuthenticated: false,
                lastChecked: new Date().toISOString(),
                account: account,
                error: error.message
            };
        }
    }

    // Poll a single account
    async pollAccount(account) {
        const accountId = account.account_id;
        
        // Don't poll deleted accounts
        if (account.status === 'deleted' || account.digital_ocean_status === 'deleted') {
            this.stopPollingAccount(accountId);
            return;
        }

        try {
            // Fetch latest status
            const statusData = await this.fetchAccountStatus(account);
            
            // Check if status changed
            const previousStatus = this.lastStatus.get(accountId);
            if (previousStatus !== statusData.status) {
                logger.info(`IB account ${accountId} status changed: ${previousStatus} → ${statusData.status}`);
                
                // Track when provisioning starts
                if (statusData.status === 'provisioning' && !this.pollingStartTimes.has(accountId)) {
                    this.pollingStartTimes.set(accountId, Date.now());
                }
                
                // Clear provisioning start time when done
                if (previousStatus === 'provisioning' && statusData.status !== 'provisioning') {
                    this.pollingStartTimes.delete(accountId);
                }
                
                this.lastStatus.set(accountId, statusData.status);
                
                // Emit status update
                this.statusSubject.next({
                    type: 'status_update',
                    accountId: accountId,
                    statusData: statusData
                });
            }

            // Schedule next poll
            const interval = this.getPollingInterval(statusData.status, accountId);
            const timerId = setTimeout(() => {
                this.pollAccount(account);
            }, interval);
            
            this.pollingTimers.set(accountId, timerId);
            
        } catch (error) {
            logger.error(`Error polling IB account ${accountId}:`, error);
            
            // Retry with error interval
            const timerId = setTimeout(() => {
                this.pollAccount(account);
            }, this.getPollingInterval('error', accountId));
            
            this.pollingTimers.set(accountId, timerId);
        }
    }

    // Start polling for an IB account
    startPollingAccount(account) {
        if (account.broker_id !== 'interactivebrokers') {
            return;
        }

        const accountId = account.account_id;
        
        // Stop existing polling if any
        this.stopPollingAccount(accountId);
        
        logger.info(`Starting IB status polling for account: ${accountId}`);
        
        // Start polling with initial delay to avoid immediate call
        const initialInterval = this.getPollingInterval(account.digital_ocean_status || 'provisioning', accountId);
        const timerId = setTimeout(() => {
            this.pollAccount(account);
        }, 2000); // 2-second initial delay to avoid startup rush
        
        this.pollingTimers.set(accountId, timerId);
    }

    // Stop polling for an account
    stopPollingAccount(accountId) {
        const timerId = this.pollingTimers.get(accountId);
        if (timerId) {
            clearTimeout(timerId);
            this.pollingTimers.delete(accountId);
            logger.info(`Stopped IB status polling for account: ${accountId}`);
        }
        
        // Clean up tracking data
        this.lastStatus.delete(accountId);
        this.pollingStartTimes.delete(accountId);
    }

    // Start the service with a list of accounts
    start(accounts = []) {
        if (this.isActive) {
            logger.warn('IBStatusService is already active');
            return;
        }

        this.isActive = true;
        logger.info('Starting IBStatusService');

        // Start polling for all IB accounts
        const ibAccounts = accounts.filter(acc => 
            acc.broker_id === 'interactivebrokers' && 
            acc.status !== 'deleted'
        );

        ibAccounts.forEach(account => {
            this.startPollingAccount(account);
        });

        logger.info(`IBStatusService started polling ${ibAccounts.length} IB accounts`);
    }

    // Stop the service
    stop() {
        if (!this.isActive) {
            return;
        }

        this.isActive = false;
        logger.info('Stopping IBStatusService');

        // Clear all polling timers
        this.pollingTimers.forEach((timerId, accountId) => {
            clearTimeout(timerId);
            logger.debug(`Cleared timer for account: ${accountId}`);
        });

        // Clear all data
        this.pollingTimers.clear();
        this.lastStatus.clear();
        this.pollingStartTimes.clear();

        logger.info('IBStatusService stopped');
    }

    // Add a new account to polling
    addAccount(account) {
        if (!this.isActive || account.broker_id !== 'interactivebrokers') {
            return;
        }

        logger.info(`Adding IB account to polling: ${account.account_id}`);
        this.startPollingAccount(account);
    }

    // Remove an account from polling
    removeAccount(accountId) {
        logger.info(`Removing IB account from polling: ${accountId}`);
        this.stopPollingAccount(accountId);
    }

    // Get observable for status updates
    getStatusUpdates() {
        return this.statusSubject.asObservable();
    }

    // Manual refresh for an account
    refreshAccount(accountId, account) {
        if (!this.isActive || !account || account.broker_id !== 'interactivebrokers') {
            return;
        }

        logger.info(`Manual refresh requested for IB account: ${accountId}`);
        
        // Stop current polling
        this.stopPollingAccount(accountId);
        
        // Start immediate poll
        this.pollAccount(account);
    }

    // Get service status
    getStatus() {
        return {
            isActive: this.isActive,
            activePolls: this.pollingTimers.size,
            accounts: Array.from(this.pollingTimers.keys())
        };
    }

    // Cleanup resources
    destroy() {
        this.stop();
        this.statusSubject.complete();
        logger.info('IBStatusService destroyed');
    }
}

// Create and export singleton instance
const ibStatusService = new IBStatusService();
export default ibStatusService;