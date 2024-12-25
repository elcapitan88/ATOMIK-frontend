export const handleApiError = (error) => {
    if (error.response) {
      // Handle server errors
      return error.response.data.message || 'Server error occurred';
    } else if (error.request) {
      // Handle network errors
      return 'Network error occurred';
    } else {
      // Handle other errors
      return error.message || 'An unexpected error occurred';
    }
  };