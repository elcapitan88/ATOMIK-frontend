import React, { Suspense } from 'react';
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

  if (isLoading) {
      return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Check for pending registration
  const hasPendingRegistration = localStorage.getItem('pendingRegistration');
  if (!hasPendingRegistration) {
    return <Navigate to="/auth" replace />;
  }

  return children;
});

// Pricing route guard
const PricingRoute = React.memo(({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Allow access if user is authenticated or has pending registration
  const hasPendingRegistration = localStorage.getItem('pendingRegistration');
  if (!isAuthenticated && !hasPendingRegistration) {
    return <Navigate to="/auth" replace />;
  }

  return children;
});

function App() {
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