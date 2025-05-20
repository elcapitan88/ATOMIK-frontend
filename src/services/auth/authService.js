// src/services/auth/authService.js

class AuthService {
    async login(email, password) {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    username: email, // FastAPI OAuth2 expects 'username'
                    password: password,
                }),
                credentials: 'include'
            });
  
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed');
            }
  
            const data = await response.json();
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
            }
  
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
  
    async register(username, email, password) {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password
                }),
                credentials: 'include'
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Registration failed');
            }
    
            // Just return the registration response, don't auto-login
            return await response.json();
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }
  
    logout() {
        localStorage.removeItem('access_token');
        // Additional cleanup if needed
    }
  
    isAuthenticated() {
        return !!localStorage.getItem('access_token');
    }
  
    getToken() {
        return localStorage.getItem('access_token');
    }
  
    async checkAuth() {
        try {
            const token = this.getToken();
            if (!token) {
                return false;
            }
  
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
  
            if (!response.ok) {
                this.logout();
                return false;
            }
  
            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            this.logout();
            return false;
        }
    }
  
    async refreshToken() {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
  
            if (!response.ok) {
                throw new Error('Token refresh failed');
            }
  
            const data = await response.json();
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                return true;
            }
  
            return false;
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            return false;
        }
    }
  
    async requestPasswordReset(email) {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
                credentials: 'include'
            });
  
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Password reset request failed');
            }
  
            return await response.json();
        } catch (error) {
            console.error('Password reset request error:', error);
            throw error;
        }
    }
  
    async resetPassword(token, newPassword) {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    new_password: newPassword
                }),
                credentials: 'include'
            });
  
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Password reset failed');
            }
  
            return await response.json();
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    }
  
    // Setup request interceptor
    setupInterceptors(navigate) {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                if (response.status === 401) {
                    // Try to refresh token
                    const refreshSuccess = await this.refreshToken();
                    if (refreshSuccess) {
                        // Retry original request with new token
                        const [url, config] = args;
                        const newConfig = {
                            ...config,
                            headers: {
                                ...config.headers,
                                'Authorization': `Bearer ${this.getToken()}`
                            }
                        };
                        return originalFetch(url, newConfig);
                    } else {
                        // Redirect to login if refresh failed
                        this.logout();
                        navigate('/auth');
                    }
                }
                
                return response;
            } catch (error) {
                console.error('Request error:', error);
                throw error;
            }
        };
    }
  }
  
  const authService = new AuthService();
  export default authService;