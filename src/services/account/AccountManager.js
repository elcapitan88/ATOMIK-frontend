// src/services/account/AccountManager.js
import { Subject } from 'rxjs';
import tradovateApi from '../api/brokers/tradovate/tradovateApi';
import logger from '@/utils/logger';

class AccountManager {
    constructor() {
        // Observable for account updates
        this.accountSubject = new Subject();
        this.accounts = new Map();
        this.lastFetchTime = 0;
        this.fetchCooldown = 5000; // 5 seconds cooldown
        this.isFetching = false;
        
        // Account status tracking
        this.accountStatus = new Map();
        
        // Event emitter for account status changes
        this.statusSubject = new Subject();
    }

    // Get account updates as an observable
    getAccountUpdates() {
        return this.accountSubject.asObservable();
    }

    // Get account status updates as an observable
    getStatusUpdates() {
        return this.statusSubject.asObservable();
    }

    // Fetch accounts with proper error handling and rate limiting
    async fetchAccounts(force = false) {
        const now = Date.now();
        
        // Implement rate limiting unless force is true
        if (!force && this.isFetching) {
            logger.debug('Account fetch already in progress');
            return null;
        }

        if (!force && (now - this.lastFetchTime) < this.fetchCooldown) {
            logger.debug('Account fetch on cooldown');
            return Array.from(this.accounts.values());
        }

        try {
            this.isFetching = true;
            logger.info('Fetching accounts...');

            const fetchedAccounts = await tradovateApi.fetchAccounts();
            this.lastFetchTime = now;

            // Process and store accounts
            this.updateAccounts(fetchedAccounts);

            return Array.from(this.accounts.values());

        } catch (error) {
            logger.error('Error fetching accounts:', error);
            throw error;
        } finally {
            this.isFetching = false;
        }
    }

    // Update account cache and notify subscribers
    updateAccounts(fetchedAccounts) {
        const updates = new Map();
        const removals = new Set(this.accounts.keys());

        fetchedAccounts.forEach(account => {
            const accountId = account.account_id;
            removals.delete(accountId);

            const existingAccount = this.accounts.get(accountId);
            if (!existingAccount || this.hasAccountChanged(existingAccount, account)) {
                updates.set(accountId, account);
            }
        });

        // Process updates
        updates.forEach((account, accountId) => {
            this.accounts.set(accountId, account);
            this.accountSubject.next({
                type: 'update',
                accountId,
                account
            });
        });

        // Process removals
        removals.forEach(accountId => {
            this.accounts.delete(accountId);
            this.accountSubject.next({
                type: 'remove',
                accountId
            });
        });

        // Emit bulk update if needed
        if (updates.size > 0 || removals.size > 0) {
            this.accountSubject.next({
                type: 'bulk',
                accounts: Array.from(this.accounts.values())
            });
        }
    }

    // Check if account has meaningful changes
    hasAccountChanged(existing, updated) {
        const significantFields = [
            'status',
            'balance',
            'is_token_expired',
            'active',
            'nickname'
        ];

        return significantFields.some(field => 
            existing[field] !== updated[field]
        );
    }

    // Update individual account status
    updateAccountStatus(accountId, status) {
        const account = this.accounts.get(accountId);
        if (account) {
            const previousStatus = this.accountStatus.get(accountId);
            if (previousStatus !== status) {
                this.accountStatus.set(accountId, status);
                this.statusSubject.next({
                    accountId,
                    status,
                    previousStatus
                });
            }
        }
    }

    // Get single account
    getAccount(accountId) {
        return this.accounts.get(accountId);
    }

    // Get all accounts
    getAllAccounts() {
        return Array.from(this.accounts.values());
    }

    // Get account status
    getAccountStatus(accountId) {
        return this.accountStatus.get(accountId);
    }

    // Remove account
    async removeAccount(accountId) {
        try {
            await tradovateApi.removeAccount(accountId);
            this.accounts.delete(accountId);
            this.accountStatus.delete(accountId);
            
            this.accountSubject.next({
                type: 'remove',
                accountId
            });

            return true;
        } catch (error) {
            logger.error(`Error removing account ${accountId}:`, error);
            throw error;
        }
    }

    // Cleanup resources
    destroy() {
        this.accountSubject.complete();
        this.statusSubject.complete();
        this.accounts.clear();
        this.accountStatus.clear();
    }
}

// Create and export singleton instance
const accountManager = new AccountManager();
export default accountManager;