// src/services/api/creators/creatorApi.js
import axiosInstance from '@/services/axiosConfig';
import { envConfig } from '@/config/environment';

class CreatorApi {
    constructor() {
        this.baseUrl = envConfig.getApiUrl('/creators');
    }

    async errorHandler(apiCall) {
        try {
            const response = await apiCall();
            return response.data;
        } catch (error) {
            console.error('Creator API Error:', error);
            // Transform backend errors into user-friendly messages
            if (error.response?.data?.detail) {
                throw new Error(error.response.data.detail);
            }
            throw new Error(error.message || 'Something went wrong');
        }
    }

    // Creator Profile Management
    async becomeCreator(profileData) {
        return this.errorHandler(() => 
            axiosInstance.post(`${this.baseUrl}/become-creator`, profileData)
        );
    }

    async getCreatorProfile() {
        return this.errorHandler(() => 
            axiosInstance.get(`${this.baseUrl}/profile`)
        );
    }

    async updateCreatorProfile(profileData) {
        return this.errorHandler(() => 
            axiosInstance.put(`${this.baseUrl}/profile`, profileData)
        );
    }

    // Stripe Connect Integration
    async setupStripeConnect(redirectUrls) {
        return this.errorHandler(() => 
            axiosInstance.post(`${this.baseUrl}/setup-stripe-connect`, redirectUrls)
        );
    }

    // Analytics and Earnings
    async getCreatorAnalytics() {
        return this.errorHandler(() => 
            axiosInstance.get(`${this.baseUrl}/analytics`)
        );
    }

    async getCreatorEarnings(params = {}) {
        const searchParams = new URLSearchParams();
        if (params.startDate) searchParams.append('start_date', params.startDate);
        if (params.endDate) searchParams.append('end_date', params.endDate);
        if (params.strategyId) searchParams.append('strategy_id', params.strategyId);

        return this.errorHandler(() => 
            axiosInstance.get(`${this.baseUrl}/earnings?${searchParams.toString()}`)
        );
    }

    async getTierProgress() {
        return this.errorHandler(() => 
            axiosInstance.get(`${this.baseUrl}/tier-progress`)
        );
    }

    // Helper methods for the UI
    async quickSetupCreator(basicInfo) {
        try {
            // Step 1: Become a creator
            const profile = await this.becomeCreator({
                bio: basicInfo.bio || '',
                trading_experience: basicInfo.experience || 'intermediate',
                two_fa_enabled: false // They can enable this later
            });

            // Step 2: Setup Stripe Connect (returns onboarding URL)
            const stripeSetup = await this.setupStripeConnect({
                refresh_url: window.location.href,
                return_url: `${window.location.origin}/creator/dashboard`
            });

            return {
                profile,
                stripeOnboardingUrl: stripeSetup.account_link_url,
                accountId: stripeSetup.account_id
            };
        } catch (error) {
            throw new Error(`Creator setup failed: ${error.message}`);
        }
    }

    // Check if current user is a creator
    async isCreator() {
        try {
            await this.getCreatorProfile();
            return true;
        } catch (error) {
            if (error.response?.status === 404) {
                return false; // User is not a creator
            }
            throw error; // Other errors should be thrown
        }
    }

    // Get creator stats for dashboard
    async getCreatorDashboardData() {
        try {
            const [profile, analytics, earnings, tierProgress] = await Promise.all([
                this.getCreatorProfile(),
                this.getCreatorAnalytics(),
                this.getCreatorEarnings({ limit: 10 }), // Recent earnings
                this.getTierProgress()
            ]);

            return {
                profile,
                analytics,
                recentEarnings: earnings,
                tierProgress,
                // Calculate key metrics
                totalRevenue: analytics.total_revenue || 0,
                totalSubscribers: analytics.total_subscribers || 0,
                activeStrategies: analytics.active_strategies || 0,
                conversionRate: analytics.conversion_rate || 0
            };
        } catch (error) {
            throw new Error(`Failed to load creator dashboard: ${error.message}`);
        }
    }

    // Revenue projections for the pricing setup
    calculateRevenueProjection(monthlyPrice, subscriberCount = 100) {
        if (!monthlyPrice || monthlyPrice <= 0) return 0;

        const price = parseFloat(monthlyPrice);
        const grossRevenue = price * subscriberCount;
        
        // Platform fees based on tier (default to Silver 15% for projection)
        const platformFee = 0.15;
        const netRevenue = grossRevenue * (1 - platformFee);
        
        return {
            grossRevenue,
            platformFee: grossRevenue * platformFee,
            netRevenue,
            subscriberCount,
            monthlyPrice: price
        };
    }

    // Format currency for display
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
}

// Create singleton instance
export const creatorApi = new CreatorApi();
export default creatorApi;