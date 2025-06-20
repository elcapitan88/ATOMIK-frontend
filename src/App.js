import React, { Suspense, useEffect, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Spinner } from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';
import { TradingLabProvider } from './contexts/TradingLabContext';
import { initializeContracts } from './utils/formatting/tickerUtils';

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
const StrategyBuilderPage = lazy(() => import('./components/pages/Builder/StrategyBuilderPage'));
const LandingPage = lazy(() => import('./components/pages/landing/LandingPage'));
const ComingSoon = lazy(() => import('./components/common/ComingSoon'));

// Trading Lab Entry Point
const TradingLabEntry = lazy(() => import('./components/trading-lab/TradingLabEntry'));

// Trading Lab PaymentSuccessLoading Component
const PaymentSuccessLoading = lazy(() => import('./components/trading-lab/onboarding/PaymentSuccessLoading'));

// Trading Lab Strategy Selection Component
const CuratedStrategies = lazy(() => import('./components/trading-lab/strategy-selection/CuratedStrategies'));

// Trading Lab Account Setup Component
const CoreAccountSetup = lazy(() => import('./components/trading-lab/account-connection/CoreAccountSetup'));

const AdminDashboard = lazy(() => import('./components/pages/Admin/AdminDashboard').then(module => ({ default: module.default })));
const OverviewPage = lazy(() => import('./components/pages/Admin/Overview/OverviewPage').then(module => ({ default: module.default })));
const UserManagement = lazy(() => import('./components/pages/Admin/UserManagement/UserManagement'));
const FeatureFlagsPage = lazy(() => import('./components/pages/Admin/FeatureFlags/FeatureFlagsPage'));
const WebhooksMonitorPage = lazy(() => import('./components/pages/Admin/Webhooks/WebhooksMonitorPage'));
const AnalyticsPage = lazy(() => import('./components/pages/Admin/Analytics/AnalyticsPage'));
const AdminSettingsPage = lazy(() => import('./components/pages/Admin/Settings/AdminSettingsPage'));

const RouteTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Debug logging for route changes
    console.log('[RouteTracker] Route changed to:', location.pathname);
    
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

  // Debug logging for trading-lab route
  if (location.pathname === '/trading-lab') {
    console.log('[WithAuth] Trading Lab access check:', {
      isAuthenticated,
      isLoading,
      hasToken: !!hasToken,
      isAuthRedirectInProgress: !!isAuthRedirectInProgress,
      pathname: location.pathname
    });
  }

  if (isLoading) {
    if (location.pathname === '/trading-lab') {
      console.log('[WithAuth] Still loading auth for trading-lab...');
    }
    return <LoadingSpinner />;
  }

  // Critical change: check for token and redirect flag before bouncing to auth
  if (!isAuthenticated && !isAuthRedirectInProgress && !hasToken) {
    if (location.pathname === '/trading-lab') {
      console.log('[WithAuth] Redirecting trading-lab to auth - not authenticated');
    }
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (location.pathname === '/trading-lab') {
    console.log('[WithAuth] Trading Lab access granted');
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

// Route guard for admin routes
const AdminRoute = React.memo(({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  
  // Loading state - show spinner while checking auth
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Not authenticated - redirect to auth page
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // In development, bypass admin check
  if (process.env.NODE_ENV === 'development') {
    return children;
  }
  
  // Check admin privileges - use same field as Menu.js
  const isAdmin = user && (
    user.app_role === 'admin' || 
    user.role === 'admin' || 
    user.role === 'superadmin' || 
    user.username === 'admin'
  );
  
  // Not admin - redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // User is authenticated and has admin privileges
  return children;
});

function App() {
  const { isAuthenticated, setAuthenticatedState } = useAuth();
  
  // Initialize futures contracts on app load
  useEffect(() => {
    initializeContracts().then(() => {
      console.log('[App] Futures contracts initialized');
    }).catch(error => {
      console.error('[App] Failed to initialize contracts:', error);
    });
  }, []);
  
  // Debug current location
  useEffect(() => {
    console.log('[App] Current location when App loads:', window.location.pathname);
    console.log('[App] isAuthenticated:', isAuthenticated);
  }, [isAuthenticated]);
  
  // Import debug utilities in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('./utils/debugFeatureFlags').catch(console.error);
    }
  }, []);
  
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
      <RouteTracker />
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
        
        {/* Docs Routes - Updated to use DocsHandler */}
        <Route path="/docs/*" element={null} />
        <Route path="/blog/*" element={null} />
  
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
  
        <Route
          path="/strategy-builder"
          element={
            <WithAuth>
              <DashboardLayout>
                <StrategyBuilderPage />
              </DashboardLayout>
            </WithAuth>
          }
        />

        {/* Trading Lab Route */}
        <Route
          path="/trading-lab"
          element={
            <WithAuth>
              <DashboardLayout>
                <TradingLabProvider>
                  <TradingLabEntry />
                </TradingLabProvider>
              </DashboardLayout>
            </WithAuth>
          }
        />

        {/* Trading Lab Payment Success Loading Route */}
        <Route
          path="/trading-lab/payment-success-loading"
          element={
            <WithAuth>
              <PaymentSuccessLoading />
            </WithAuth>
          }
        />

        {/* Trading Lab Account Connection Route - First step in account-first flow */}
        <Route
          path="/trading-lab/account-connection"
          element={
            <WithAuth>
              <DashboardLayout>
                <TradingLabProvider>
                  <CoreAccountSetup />
                </TradingLabProvider>
              </DashboardLayout>
            </WithAuth>
          }
        />

        {/* Trading Lab Strategy Selection Route - Second step in account-first flow */}
        <Route
          path="/trading-lab/strategy-selection"
          element={
            <WithAuth>
              <DashboardLayout>
                <TradingLabProvider>
                  <CuratedStrategies />
                </TradingLabProvider>
              </DashboardLayout>
            </WithAuth>
          }
        />
  
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <WithAuth>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </WithAuth>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="feature-flags" element={<FeatureFlagsPage />} />
          <Route path="webhooks" element={<WebhooksMonitorPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
  
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;