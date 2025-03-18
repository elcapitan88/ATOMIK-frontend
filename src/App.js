import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Spinner } from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';

// Import components
import Homepage from './components/pages/Homepage/Homepage';
import PaymentSuccess from './components/pages/PaymentSuccess';
import Dashboard from './components/pages/Dashboard';
import AuthPage from './components/pages/AuthPage';
import ResetPassword from './components/pages/ResetPassword';
import SettingsPage from './components/pages/SettingsPage';
import MarketplacePage from './components/pages/MarketplacePage';
import PricingPage from './components/pages/PricingPage';

// Layout wrapper for authenticated routes
const DashboardLayout = ({ children }) => (
  <Box minH="100vh" bg="background">
    {children}
  </Box>
);

// Loading spinner component
const LoadingSpinner = () => (
  <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
    <Spinner size="xl" color="blue.500" />
  </Box>
);

// Route guard for authenticated routes
const WithAuth = React.memo(({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // REPLACE the auth check with this:
  // Add this line to check for an in-progress redirect
  const isAuthRedirectInProgress = sessionStorage.getItem('auth_redirect_in_progress');
  const hasToken = localStorage.getItem('access_token');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Critical change: check for token and redirect flag before bouncing to auth
  if (!isAuthenticated && !isAuthRedirectInProgress && !hasToken) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
});

// Route guard for non-authenticated routes
const WithoutAuth = React.memo(({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
});

// Special route for payment success page
const PaymentSuccessRoute = React.memo(({ children }) => {
  const { isLoading } = useAuth();
  const isAuthRedirectInProgress = sessionStorage.getItem('auth_redirect_in_progress');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Updated: Check for EITHER pending registration OR auth redirect in progress
  const hasPendingRegistration = localStorage.getItem('pendingRegistration');
  if (!hasPendingRegistration && !isAuthRedirectInProgress) {
    return <Navigate to="/auth" replace />;
  }

  return children;
});

// Pricing route guard
const PricingRoute = React.memo(({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Check if coming from auth page
  const searchParams = new URLSearchParams(location.search);
  const isFromAuth = searchParams.get('source') === 'auth';
  const isRegister = searchParams.get('register') === 'true';
  
  // Check for pending registration
  const hasPendingRegistration = localStorage.getItem('pendingRegistration');
  
  // Allow access if user meets any of the conditions
  if (!isAuthenticated && !hasPendingRegistration && !isFromAuth && !isRegister) {
    return <Navigate to="/auth" replace />;
  }

  return children;
});


function App() {
  const { isAuthenticated, setAuthenticatedState } = useAuth();
  
  // Add the new useEffect right here, before the return statement
  useEffect(() => {
    // Check for stored credentials on app load
    const token = localStorage.getItem('access_token');
    const storedUserData = localStorage.getItem('user_data');
    
    if (token && storedUserData && !isAuthenticated) {
      try {
        // Parse user data
        const userData = JSON.parse(storedUserData);
        
        // Set auth state directly via context
        setAuthenticatedState(userData, token);
        
        // Clean up stored user data
        localStorage.removeItem('user_data');
        
        console.log('Restored authentication state from localStorage');
      } catch (error) {
        console.error('Failed to restore auth state:', error);
      }
    }
  }, [isAuthenticated, setAuthenticatedState]);
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Homepage />} />
        
        {/* Pricing Route */}
        <Route
          path="/pricing"
          element={
            <PricingRoute>
              <PricingPage />
            </PricingRoute>
          }
        />
        
        {/* Auth Routes */}
        <Route
          path="/auth"
          element={
            <WithoutAuth>
              <AuthPage />
            </WithoutAuth>
          }
        />
        
        <Route
          path="/auth/reset-password"
          element={
            <WithoutAuth>
              <ResetPassword />
            </WithoutAuth>
          }
        />

        {/* Payment Success Route */}
        <Route 
          path="/payment/success" 
          element={
            <PaymentSuccessRoute>
              <PaymentSuccess />
            </PaymentSuccessRoute>
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <WithAuth>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </WithAuth>
          }
        />

        <Route
          path="/marketplace"
          element={
            <WithAuth>
              <DashboardLayout>
                <MarketplacePage />
              </DashboardLayout>
            </WithAuth>
          }
        />

        <Route
          path="/settings"
          element={
            <WithAuth>
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            </WithAuth>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;