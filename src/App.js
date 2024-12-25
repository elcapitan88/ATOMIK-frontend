// App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ChakraProvider, Box, Spinner } from '@chakra-ui/react';
import { webSocketManagerInstance } from './services/websocket/webSocketManager';
import axiosInstance from './services/axiosConfig';
import theme from './styles/theme';

// Import components with relative paths for now
import Dashboard from './components/pages/Dashboard';
import AuthPage from './components/pages/AuthPage';
import SettingsPage from './components/pages/SettingsPage';

// Authentication guard component
const PrivateRoute = ({ children }) => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
          return;
        }

        // Verify token is still valid
        await axiosInstance.get('/api/auth/verify/');
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        // Try to refresh token
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const response = await axiosInstance.post('/api/auth/refresh/', {
              refresh: refreshToken
            });
            if (response.data.access) {
              localStorage.setItem('access_token', response.data.access);
              axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
              setIsAuthenticated(true);
            } else {
              handleAuthFailure();
            }
          } else {
            handleAuthFailure();
          }
        } catch (refreshError) {
          handleAuthFailure();
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    const handleAuthFailure = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setIsAuthenticated(false);
    };

    checkAuth();
  }, []);

  if (isCheckingAuth) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

// Public route guard
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  useEffect(() => {
    // Initialize WebSocket and API configuration
    const initializeServices = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Set up axios default authorization header
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Initialize WebSocket connections if needed
          if (webSocketManagerInstance?.checkActiveAccounts) {
            await webSocketManagerInstance.checkActiveAccounts();
          }
        } catch (error) {
          console.error('Error initializing services:', error);
        }
      }
    };

    initializeServices();

    // Cleanup function
    return () => {
      if (webSocketManagerInstance?.disconnectAll) {
        webSocketManagerInstance.disconnectAll().catch(error => {
          console.error('Error disconnecting WebSockets:', error);
        });
      }
    };
  }, []);

  // Handle token refresh and WebSocket reconnection
  useEffect(() => {
    const handleStorageChange = async (event) => {
      if (event.key === 'access_token') {
        if (event.newValue) {
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${event.newValue}`;
          if (webSocketManagerInstance?.reconnectAll) {
            try {
              await webSocketManagerInstance.reconnectAll();
            } catch (error) {
              console.error('Error reconnecting WebSockets:', error);
            }
          }
        } else {
          delete axiosInstance.defaults.headers.common['Authorization'];
          if (webSocketManagerInstance?.disconnectAll) {
            try {
              await webSocketManagerInstance.disconnectAll();
            } catch (error) {
              console.error('Error disconnecting WebSockets:', error);
            }
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Global error handling
  useEffect(() => {
    const handleError = (event) => {
      console.error('Global error:', event.error || event.reason);
      // Add your error reporting service here if needed
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/auth" 
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            } 
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            }
          />

          {/* Catch all route - redirect to dashboard */}
          <Route 
            path="*" 
            element={<Navigate to="/dashboard" replace />} 
          />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;