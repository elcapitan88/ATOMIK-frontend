// services/api/auth/authApi.js
import axiosInstance from '../../config/axiosConfig';

class AuthApi {
  constructor() {
    this.baseUrl = '/api/auth';
  }

  /**
   * Handle API errors consistently
   */
  async errorHandler(apiCall) {
    try {
      const response = await apiCall();
      return response.data;
    } catch (error) {
      console.error('Auth API Error:', error);
      throw error;
    }
  }

  /**
   * Log in a user
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{access: string, refresh: string}>}
   */
  async login(email, password) {
    return this.errorHandler(() => 
      axiosInstance.post(`${this.baseUrl}/login/`, {
        email,
        password
      })
    );
  }

  /**
   * Register a new user
   * @param {string} username 
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{access: string, refresh: string}>}
   */
  async register(username, email, password) {
    return this.errorHandler(() => 
      axiosInstance.post(`${this.baseUrl}/register/`, {
        username,
        email,
        password
      })
    );
  }

  /**
   * Log out the current user
   * @returns {Promise<void>}
   */
  async logout() {
    return this.errorHandler(() => 
      axiosInstance.post(`${this.baseUrl}/logout/`)
    );
  }

  /**
   * Verify the current token
   * @returns {Promise<{valid: boolean}>}
   */
  async verifyToken() {
    return this.errorHandler(() => 
      axiosInstance.get(`${this.baseUrl}/verify/`)
    );
  }

  /**
   * Refresh the access token using the refresh token
   * @param {string} refreshToken 
   * @returns {Promise<{access: string}>}
   */
  async refreshToken(refreshToken) {
    return this.errorHandler(() => 
      axiosInstance.post(`${this.baseUrl}/refresh/`, {
        refresh: refreshToken
      })
    );
  }

  /**
   * Store authentication tokens
   * @param {Object} tokens 
   * @param {string} tokens.access
   * @param {string} tokens.refresh
   */
  storeTokens(tokens) {
    localStorage.setItem('access_token', tokens.access);
    if (tokens.refresh) {
      localStorage.setItem('refresh_token', tokens.refresh);
    }
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
  }

  /**
   * Clear stored authentication tokens
   */
  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete axiosInstance.defaults.headers.common['Authorization'];
  }

  /**
   * Get the stored access token
   * @returns {string|null}
   */
  getAccessToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Get the stored refresh token
   * @returns {string|null}
   */
  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  /**
   * Initialize auth state from storage
   */
  initializeAuth() {
    const token = this.getAccessToken();
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  /**
   * Get the current user's profile
   * @returns {Promise<Object>}
   */
  async getCurrentUser() {
    return this.errorHandler(() => 
      axiosInstance.get(`${this.baseUrl}/profile/`)
    );
  }
}

// Create and export singleton instance
const authApi = new AuthApi();

// Initialize auth state when importing
authApi.initializeAuth();

export default authApi;