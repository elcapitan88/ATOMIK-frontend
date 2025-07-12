import axios from 'axios';
import logger from '@/utils/logger';

// Determine API URL from environment variables with fallback
const API_URL = process.env.REACT_APP_API_URL || 
    (process.env.NODE_ENV === 'production' 
        ? 'https://api.atomiktrading.io'
        : 'https://atomik-dev-development.up.railway.app');

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// Function to get cookies
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Request interceptor
axiosInstance.interceptors.request.use(
    function (config) {
        // Add CSRF token if available
        const csrfToken = getCookie('csrftoken');
        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
        }

        // Add auth token if available
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        logger.debug('API Request:', {
            url: config.url,
            method: config.method,
            hasToken: !!token
        });

        return config;
    },
    function (error) {
        logger.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        logger.debug('API Response:', {
            url: response.config.url,
            status: response.status
        });
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Skip token refresh for checkout-related paths
                if (originalRequest.url.includes('subscriptions/create') || 
                    originalRequest.url.includes('checkout')) {
                  // For checkout flows, just fail gracefully
                  localStorage.removeItem('access_token');
                  if (!originalRequest.url.includes('guest-checkout')) {
                    window.location.href = '/auth';
                  }
                  return Promise.reject(error);
                }
                
                // For all other paths, attempt token refresh
                logger.info('Attempting token refresh');
                
                // Check if you have a refresh-token endpoint
                // If not, use this fallback approach
                localStorage.removeItem('access_token');
                window.location.href = '/auth';
                return Promise.reject(error);
                
                // If you do have a refresh-token endpoint, uncomment this:
                /*
                const refreshResponse = await axios.post(
                  '/api/v1/auth/refresh-token',
                  {},
                  {
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                  }
                );
                
                if (refreshResponse.data.access_token) {
                  logger.info('Token refresh successful');
                  localStorage.setItem('access_token', refreshResponse.data.access_token);
                  axiosInstance.defaults.headers.common['Authorization'] = 
                    `Bearer ${refreshResponse.data.access_token}`;
                  return axiosInstance(originalRequest);
                }
                */
              } catch (refreshError) {
                logger.error('Token refresh failed:', refreshError);
                // Clear auth state and redirect to login
                localStorage.removeItem('access_token');
                window.location.href = '/auth';
                return Promise.reject(refreshError);
              }
        }

        // Handle other errors
        if (error.response) {
            logger.error('API Error:', {
                url: error.config.url,
                status: error.response.status,
                data: error.response.data
            });

            // Handle specific error cases
            switch (error.response.status) {
                case 403:
                    if (error.response.data?.detail?.includes('subscription')) {
                        window.location.href = '/pricing';
                    }
                    break;
                case 500:
                    logger.error('Server Error:', error.response.data);
                    break;
                default:
                    break;
            }
        } else if (error.request) {
            logger.error('No response received:', error.request);
        } else {
            logger.error('Request setup error:', error.message);
        }

        return Promise.reject(error);
    }
);

// Export configured instance
export default axiosInstance;