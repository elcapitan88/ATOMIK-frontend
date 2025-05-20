// src/config/environment.js
class EnvironmentConfig {
    constructor() {
      this.validateEnvironmentVariables();
      
      this.config = {
        api: {
          baseUrl: process.env.REACT_APP_API_URL,
          webhookPath: '/api/v1/webhooks',
          version: '/api/v1'
        },
        frontend: {
          baseUrl: process.env.REACT_APP_FRONTEND_URL
        }
      };
    }
  
    validateEnvironmentVariables() {
      const required = [
        'REACT_APP_API_URL',
        'REACT_APP_FRONTEND_URL'
      ];
  
      required.forEach(key => {
        if (!process.env[key]) {
          throw new Error(`Missing required environment variable: ${key}`);
        }
      });
    }
  
    get apiBaseUrl() {
      return this.config.api.baseUrl;
    }
  
    getWebhookUrl(token) {
      if (!token) {
        console.error('Token is required to generate webhook URL');
        return '';
      }
      return `${this.config.api.baseUrl}${this.config.api.webhookPath}/${token}`;
    }
  
    getWebhookUrlWithSecret(token, secret) {
      if (!token || !secret) {
        console.error('Both token and secret are required');
        return '';
      }
      return `${this.getWebhookUrl(token)}?secret=${encodeURIComponent(secret)}`;
    }
  
    getApiUrl(path) {
      return `${this.config.api.baseUrl}${this.config.api.version}${path}`;
    }
  }
  
  export const envConfig = new EnvironmentConfig();

  export default EnvironmentConfig;