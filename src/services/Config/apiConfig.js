// services/config/apiConfig.js
import axios from 'axios';

// Function to get cookies (needed for CSRF token)
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL ||
        (process.env.NODE_ENV === 'production'
            ? 'https://api.atomiktrading.io'
            : 'http://localhost:8000'),
    withCredentials: true,
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
    function (config) {
        // Get the CSRF token from the cookie
        const csrfToken = getCookie('csrftoken');
        
        // If token exists, add it to the headers
        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
        }

        // Get the JWT token from localStorage
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh the token
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post('/api/auth/refresh/', {
                    refresh: refreshToken
                });

                if (response.data.access) {
                    localStorage.setItem('access_token', response.data.access);
                    
                    // Update instance defaults
                    axiosInstance.defaults.headers.common['Authorization'] = 
                        `Bearer ${response.data.access}`;
                    
                    // Retry the original request
                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                // Handle refresh failure
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/auth';
                return Promise.reject(refreshError);
            }
        }

        // Handle other errors
        if (error.response?.status === 403) {
            console.error('Permission denied');
        }

        if (error.response?.status === 500) {
            console.error('Server error');
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;