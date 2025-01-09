import axios from 'axios';

// Function to get cookies
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
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

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Use POST instead of GET
                const response = await axios.post('/api/v1/auth/verify', {}, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });

                if (response.data.valid) {
                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;