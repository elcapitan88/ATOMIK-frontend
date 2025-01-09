// App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ChakraProvider, Box, Spinner } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { webSocketManagerInstance } from './services/websocket/webSocketManager';
import { useAuth } from './contexts/AuthContext';
import axiosInstance from './services/axiosConfig';
import theme from './styles/theme';

// Import components
import Dashboard from './components/pages/Dashboard';
import AuthPage from './components/pages/AuthPage';
import ResetPassword from './components/pages/ResetPassword';
import SettingsPage from './components/pages/SettingsPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // disable automatic refetch on window focus
      retry: 1, // retry failed queries once before displaying error
      staleTime: 30000, // consider data fresh for 30 seconds
      cacheTime: 5 * 60 * 1000, // cache for 5 minutes
      onError: (error) => {
        console.error('Query Error:', error);
      },
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation Error:', error);
      },
    },
  },
});

// Authentication guard component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
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
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
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
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
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
            
            <Route 
              path="/auth/reset-password" 
              element={
                <PublicRoute>
                  <ResetPassword />
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
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

export default App;