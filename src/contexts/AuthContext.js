// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../services/axiosConfig';
import webSocketManager from '../services/websocket/webSocketManager';
import { useToast } from '@chakra-ui/react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const toast = useToast();

  // Function to fetch user data
  const fetchUserData = async () => {
    try {
      const response = await axiosInstance.get('/api/v1/auth/verify/');
      if (response.data.valid) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
      handleError(error);
    }
  };

  // Error handling utility
  const handleError = (error) => {
    const errorMessage = error.response?.data?.detail || 'An error occurred';
    toast({
      title: 'Error',
      description: errorMessage,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  };

  // Initialize authentication state
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Set up axios default authorization header
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        try {
          const response = await axiosInstance.get('/api/v1/auth/verify/');
          if (response.data.valid) {
            setIsAuthenticated(true);
            setUser(response.data.user);
            
            // Initialize WebSocket connections if needed
            if (webSocketManager.checkActiveAccounts) {
              await webSocketManager.checkActiveAccounts();
            }
          } else {
            handleAuthFailure();
          }
        } catch (error) {
          handleAuthFailure();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        handleAuthFailure();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    // Cleanup function
    return () => {
      if (webSocketManager.disconnectAll) {
        webSocketManager.disconnectAll().catch(error => {
          console.error('Error disconnecting WebSockets:', error);
        });
      }
    };
  }, []);

  // Handle authentication failure
  const handleAuthFailure = () => {
    localStorage.removeItem('access_token');
    delete axiosInstance.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
  };

  // Login function
  const login = async () => {
    setIsAuthenticated(true);
    await fetchUserData();

    // Initialize WebSocket connections after login
    if (webSocketManager.checkActiveAccounts) {
      try {
        await webSocketManager.checkActiveAccounts();
      } catch (error) {
        console.error('Error initializing WebSocket connections:', error);
      }
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Disconnect WebSockets
      if (webSocketManager.disconnectAll) {
        await webSocketManager.disconnectAll();
      }

      // Clear authentication state
      localStorage.removeItem('access_token');
      delete axiosInstance.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setUser(null);

      // Optional: Call logout endpoint
      try {
        await axiosInstance.post('/api/v1/auth/logout');
      } catch (error) {
        console.error('Error calling logout endpoint:', error);
      }

    } catch (error) {
      console.error('Logout error:', error);
      handleError(error);
    }
  };

  // Handle token refresh
  const refreshToken = async () => {
    try {
      const response = await axiosInstance.post('/api/v1/auth/refresh-token');
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      handleAuthFailure();
      return false;
    }
  };

  // Update user data
  const updateUserData = async () => {
    await fetchUserData();
  };

  // Context value
  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    refreshToken,
    updateUserData,
    // Add any additional methods or state that might be needed
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;