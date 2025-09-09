// src/services/api/strategies/engineStrategiesApi.js
import axiosInstance from '@/services/axiosConfig';
import { envConfig } from '@/config/environment';

class EngineStrategiesApi {
    constructor() {
        this.baseUrl = envConfig.getApiUrl('/strategies/engine');
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