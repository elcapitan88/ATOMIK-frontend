// src/services/api/Webhooks/webhookApi.js
import axiosInstance from '@/services/axiosConfig';

class WebhookApi {
    constructor() {
        this.baseUrl = '/api/webhooks';
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
        return this.errorHandler(() => 
            axiosInstance.post(`${this.baseUrl}/generate/`, webhookData)
        );
    }

    async listWebhooks() {
        return this.errorHandler(() => 
            axiosInstance.get(`${this.baseUrl}/list/`)
        );
    }

    async deleteWebhook(token) {
        return this.errorHandler(() => 
            axiosInstance.delete(`${this.baseUrl}/${token}/`)
        );
    }

    async toggleWebhook(token) {
        return this.errorHandler(() => 
            axiosInstance.post(`${this.baseUrl}/${token}/toggle/`)
        );
    }

    async getWebhookLogs(token) {
        return this.errorHandler(() => 
            axiosInstance.get(`${this.baseUrl}/${token}/logs/`)
        );
    }

    async getWebhookStats(token) {
        return this.errorHandler(() => 
            axiosInstance.get(`${this.baseUrl}/${token}/stats/`)
        );
    }

    async testWebhook(token) {
        return this.errorHandler(() => 
            axiosInstance.post(`${this.baseUrl}/${token}/test/`)
        );
    }

    async clearWebhookLogs(token) {
        return this.errorHandler(() => 
            axiosInstance.post(`${this.baseUrl}/${token}/clear-logs/`)
        );
    }
}

// Export a singleton instance
export const webhookApi = new WebhookApi();

// Default export for optional direct class usage
export default WebhookApi;