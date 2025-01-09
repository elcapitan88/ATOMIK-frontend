// src/utils/errorHandler.js

export const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const serverError = error.response.data?.detail || error.response.data?.message;
    return new Error(serverError || 'Server error occurred');
  }
  
  if (error.request) {
    // The request was made but no response was received
    return new Error('No response received from server. Please check your connection.');
  }
  
  // Something happened in setting up the request that triggered an Error
  return new Error(error.message || 'An unexpected error occurred');
};

// Helper function to determine if an error is a network error
export const isNetworkError = (error) => {
  return !error.response && error.request;
};

// Helper function to determine if an error is an authentication error
export const isAuthError = (error) => {
  return error.response?.status === 401;
};

export default {
  handleApiError,
  isNetworkError,
  isAuthError
};