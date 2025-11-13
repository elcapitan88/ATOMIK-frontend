// src/services/api/strategies/engineStrategiesApi.js
import axiosInstance from '@/services/axiosConfig';
import { envConfig } from '@/config/environment';

class EngineStrategiesApi {
    constructor() {
        // Updated: Use unified strategies endpoint (removed /engine/ subdirectory)
        // Backend migration consolidated all endpoints under /strategies
        this.baseUrl = envConfig.getApiUrl('/strategies');
    }

    async errorHandler(apiCall) {
        try {
            const response = await apiCall();
            return response.data;
        } catch (error) {
            console.error('Engine Strategies API Error:', error);
            throw error;
        }
    }

    async subscribeToStrategy(strategyId) {
        return this.errorHandler(() => 
            axiosInstance.post(`${this.baseUrl}/${strategyId}/subscribe`)
        );
    }
    
    async unsubscribeFromStrategy(strategyId) {
        return this.errorHandler(() => 
            axiosInstance.post(`${this.baseUrl}/${strategyId}/unsubscribe`)
        );
    }

    async getSubscriptions() {
        return this.errorHandler(() => 
            axiosInstance.get(`${this.baseUrl}/subscriptions`)
        );
    }
}

export const engineStrategiesApi = new EngineStrategiesApi();