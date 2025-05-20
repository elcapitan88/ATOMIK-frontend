// src/services/api/Webhooks/webhookApi.js
import axiosInstance from '@/services/axiosConfig';
import { envConfig } from '@/config/environment';

class WebhookApi {
    constructor() {
        this.baseUrl = envConfig.getApiUrl('/webhooks');
    }

    async errorHandler(apiCall) {
        try {
            const response = await apiCall();
            return response.data;
        } catch (error) {
            console.error('Webhook API Error:', error);
            throw error;
        }
    }

    async generateWebhook(webhookData) {
        try {
            console.log('Sending webhook data:', webhookData);
            const response = await axiosInstance.post(
                `${this.baseUrl}/generate`,  // Now using environment-based URL
                webhookData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
            console.log('Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Webhook creation error:', error);
            console.error('Error response:', error.response?.data);
            throw error;
        }
    }

    async listWebhooks() {
        return this.errorHandler(() => 
            axiosInstance.get(`${this.baseUrl}/list`)
        );
    }

    async toggleSharing(token, data) {
        try {
            console.log('Toggle sharing data being sent:', data);
            const response = await axiosInstance.post(`${this.baseUrl}/${token}/share`, {
                isActive: data.isActive,
                description: data.description,
                strategyType: data.strategyType
            });
            
            console.log('Toggle sharing response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Share toggle error:', error);
            throw error.response?.data?.detail 
                ? new Error(error.response.data.detail)
                : new Error('Failed to update webhook sharing status');
        }
    }

    async deleteWebhook(token) {
        console.log('DeleteWebhook called with token:', token);
        console.log('Constructed URL:', `${this.baseUrl}/${token}`);
        return this.errorHandler(async () => {
            try {
                const response = await axiosInstance.delete(`${this.baseUrl}/${token}`);
                console.log('Delete response:', response);
                return response;
            } catch (error) {
                console.log('Full error:', error);
                console.log('Error response:', error.response);
                throw error;
            }
        });
    }

    async getAllAvailableWebhooks() {
        try {
          // Fetch both owned and subscribed webhooks in parallel
          const [ownedWebhooks, subscribedWebhooks] = await Promise.all([
            this.listWebhooks(),          // Uses existing method
            this.getSubscribedStrategies() // Uses existing method
          ]);
    
          // Combine and format the webhooks
          const combinedWebhooks = [
            ...ownedWebhooks,
            ...subscribedWebhooks.map(webhook => ({
              ...webhook,
              isSubscribed: true // Add flag to identify subscribed webhooks
            }))
          ];
    
          return combinedWebhooks;
        } catch (error) {
          console.error('Error fetching all available webhooks:', error);
          throw error;
        }
    }
    

    async toggleWebhook(token) {
        return this.errorHandler(() => 
            axiosInstance.post(`${this.baseUrl}/${token}/toggle`)
        );
    }

    async getWebhookLogs(token) {
        return this.errorHandler(() => 
            axiosInstance.get(`${this.baseUrl}/${token}/logs`)
        );
    }

    async getWebhookStats(token) {
        return this.errorHandler(() => 
            axiosInstance.get(`${this.baseUrl}/${token}/stats`)
        );
    }

    async testWebhook(token) {
        return this.errorHandler(() => 
            axiosInstance.post(`${this.baseUrl}/${token}/test`)
        );
    }

    async clearWebhookLogs(token) {
        return this.errorHandler(() => 
            axiosInstance.post(`${this.baseUrl}/${token}/clear-logs`)
        );
    }

    // New marketplace-related methods
    async listSharedStrategies() {
        return this.errorHandler(() => 
            axiosInstance.get(`${this.baseUrl}/shared`)
        );
    }

    async subscribeToStrategy(token) {
        return this.errorHandler(() => 
            axiosInstance.post(`${this.baseUrl}/${token}/subscribe`)
        );
    }
    
    async unsubscribeFromStrategy(token) {
        return this.errorHandler(() => 
            axiosInstance.post(`${this.baseUrl}/${token}/unsubscribe`)
        );
    }

    async getSubscribedStrategies() {
        return this.errorHandler(() => 
            axiosInstance.get(`${this.baseUrl}/subscribed`)
        );
    }

    async rateStrategy(token, rating) {
        console.log('Rating payload:', { rating }); // Debug log
        return this.errorHandler(() => 
            axiosInstance.post(
                `${this.baseUrl}/${token}/rate`,
                { rating: parseInt(rating) }, // Ensure rating is a number
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
        );
    }

    async getStrategySubscribers(token) {
        return this.errorHandler(() => 
            axiosInstance.get(`${this.baseUrl}/${token}/subscribers`)
        );
    }

    async validateWebhook(token, payload, signature) {
        return this.errorHandler(() => 
            axiosInstance.post(`${this.baseUrl}/${token}/validate`, {
                payload,
                signature
            })
        );
    }

    async getWebhookDetails(token) {
        return this.errorHandler(() => 
            axiosInstance.get(`${this.baseUrl}/${token}`)
        );
    }

    async updateWebhook(token, data) {
        return this.errorHandler(() => 
            axiosInstance.patch(`${this.baseUrl}/${token}`, data)
        );
    }
}

// Export a singleton instance
export const webhookApi = new WebhookApi();

// Default export for optional direct class usage
export default WebhookApi;