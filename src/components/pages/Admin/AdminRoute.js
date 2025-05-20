import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Spinner, Flex } from '@chakra-ui/react';

/**
 * Route wrapper that only allows users with admin privileges
 * Redirects non-admin users to the dashboard
 */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  
  // Loading state - show spinner while checking auth
  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="100vh" bg="background">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }
  
  // Not authenticated - redirect to auth page
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Check admin privileges
  const isAdmin = user && (
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
};

export default AdminRoute;