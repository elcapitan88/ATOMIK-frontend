// services/api/brokers/baseApi.js
import axiosInstance from '@/services/axiosConfig';
import { 
 getBrokerById, 
 getBrokerEndpoints 
} from '@/utils/constants/brokers';

export class BaseApi {
 constructor(brokerName) {
   this.brokerConfig = getBrokerById(brokerName);
   if (!this.brokerConfig) {
     throw new Error(`Unsupported broker: ${brokerName}`);
   }
   this.brokerName = brokerName;
   this.baseUrl = `/api/${brokerName}`;
 }

 // Error handler utility
 async errorHandler(apiCall) {
  try {
      const response = await apiCall();
      return response.data;
  } catch (error) {
      console.error(`${this.brokerName} API Error:`, error);
      
      // Handle 422 errors specifically
      if (error.response?.status === 422) {
          throw new Error(error.response.data.detail || 'Invalid request data');
      }
      
      throw error;
  }
}

 // Standard broker interface methods
 async fetchAccounts() {
   return this.errorHandler(() => 
     axiosInstance.get(`${this.baseUrl}/fetch-accounts/`)
   );
 }

 async getAccountPositions(accountId) {
   return this.errorHandler(() => 
     axiosInstance.get(`${this.baseUrl}/positions/${accountId}/`)
   );
 }

 async getAccountOrders(accountId) {
   return this.errorHandler(() => 
     axiosInstance.get(`${this.baseUrl}/get-account-orders/${accountId}/`)
   );
 }

 async removeAccount(accountId) {
   return this.errorHandler(() => 
     axiosInstance.delete(`${this.baseUrl}/remove-account/${accountId}/`)
   );
 }

 async toggleAccount(accountId) {
   return this.errorHandler(() => 
     axiosInstance.post(`${this.baseUrl}/toggle-account/${accountId}/`)
   );
 }

 async refreshToken() {
   return this.errorHandler(() => 
     axiosInstance.post(`${this.baseUrl}/refresh-token/`)
   );
 }

 // OAuth methods
 async initiateOAuth(environment = 'demo') {
   return this.errorHandler(() => 
     axiosInstance.post(`${this.baseUrl}/initiate-oauth/`, { environment })
   );
 }

 async handleOAuthCallback(code) {
   return this.errorHandler(() => 
     axiosInstance.get(`${this.baseUrl}/callback/?code=${code}`)
   );
 }

 // Rate limiting helper
 async withRateLimit(apiCall, retryCount = 3, delay = 1000) {
   for (let attempt = 0; attempt < retryCount; attempt++) {
     try {
       return await apiCall();
     } catch (error) {
       if (error.response?.status === 429 && attempt < retryCount - 1) {
         await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
         continue;
       }
       throw error;
     }
   }
 }

 // Health check method
 async checkHealth() {
   return this.errorHandler(() => 
     axiosInstance.get(`${this.baseUrl}/health/`)
   );
 }

 // New broker configuration utility methods
 getEndpoints(environment) {
   const endpoints = getBrokerEndpoints(this.brokerName, environment);
   if (!endpoints) {
     throw new Error(`Invalid environment ${environment} for broker ${this.brokerName}`);
   }
   return endpoints;
 }

 getBrokerFeatures() {
   return this.brokerConfig.features;
 }

 supportsEnvironment(environment) {
   return this.brokerConfig.environments.includes(environment);
 }

 getConnectionMethod() {
   return this.brokerConfig.connectionMethod;
 }

 // Utility method for building URLs with query parameters
 buildUrl(endpoint, params = {}) {
   const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
   Object.keys(params).forEach(key => {
     if (params[key] !== undefined && params[key] !== null) {
       url.searchParams.append(key, params[key]);
     }
   });
   return url.toString();
 }

 // Batch request helper
 async batchRequests(requests, batchSize = 3) {
   const results = [];
   for (let i = 0; i < requests.length; i += batchSize) {
     const batch = requests.slice(i, i + batchSize);
     const batchResults = await Promise.all(
       batch.map(request => this.errorHandler(() => axiosInstance(request)))
     );
     results.push(...batchResults);
   }
   return results;
 }

 // Common headers for requests
 getHeaders(additionalHeaders = {}) {
   return {
     'Content-Type': 'application/json',
     ...additionalHeaders
   };
 }

 // Validation helper
 validateAccountId(accountId) {
   if (!accountId || typeof accountId !== 'string') {
     throw new Error('Invalid account ID');
   }
 }
}

export default BaseApi;