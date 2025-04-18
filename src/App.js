import React, { Suspense, useEffect, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';

// Import components
import Homepage from './components/pages/Homepage/Homepage';

// Lazy load non-homepage routes
const PaymentSuccess = lazy(() => import('./components/pages/PaymentSuccess'));
const Dashboard = lazy(() => import('./components/pages/Dashboard'));
const AuthPage = lazy(() => import('./components/pages/AuthPage'));
const ResetPassword = lazy(() => import('./components/pages/ResetPassword'));
const SettingsPage = lazy(() => import('./components/pages/SettingsPage'));
const MarketplacePage = lazy(() => import('./components/pages/MarketplacePage'));
const PricingPage = lazy(() => import('./components/pages/PricingPage'));
//const StrategyBuilderPage = lazy(() => import('./components/pages/Builder/StrategyBuilderPage'));
const LandingPage = lazy(() => import('./components/pages/landing/LandingPage'));
//const AdminDashboard = lazy(() => import('./components/pages/Admin/AdminDashboard').then(module => ({ default: module.default })));
// const OverviewPage = lazy(() => import('./components/pages/Admin/Overview/OverviewPage').then(module => ({ default: module.default })));
// const UsersPage = lazy(() => import('./components/pages/Admin/Users/UsersPage').then(module => ({ default: module.default })));
// const WebhooksMonitorPage = lazy(() => import('./components/pages/Admin/Webhooks/WebhooksMonitorPage'));
// const AnalyticsPage = lazy(() => import('./components/pages/Admin/Analytics/AnalyticsPage'));
// const RolesPage = lazy(() => import('./components/pages/Admin/Roles/RolesPage'));
// const AdminSettingsPage = lazy(() => import('./components/pages/Admin/Settings/AdminSettingsPage'));

const RouteTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Push to dataLayer whenever route changes
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'pageview',
        page: {
          path: location.pathname,
          title: document.title || location.pathname.replace(/\//g, '') || 'Home'
        }
      });
    }
  }, [location]);
  
  return null; // This component doesn't render anything
};

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

// Modified PricingRoute - Make pricing page publicly accessible
const PricingRoute = React.memo(({ children }) => {
  // Simply return children without any conditional checks
  // This makes the pricing page accessible to everyone
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

        <Route path="/start" element={<LandingPage />} />
        
        {/* Pricing Route - Now publicly accessible */}
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
        {/* <Route
          path="/strategy-builder"
          element={
            <WithAuth>
              <DashboardLayout>
                <StrategyBuilderPage />
              </DashboardLayout>
            </WithAuth>
          }
        /> */}

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

        {/* Admin Dashboard Routes - Development Mode */}
        {/* <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="webhooks" element={<WebhooksMonitorPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route> */}

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;