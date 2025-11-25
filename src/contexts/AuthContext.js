import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/services/axiosConfig';
import unifiedStrategiesApi from '@/services/api/strategies/unifiedStrategiesApi';
import logger from '@/utils/logger';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRegistrationPending, setHasRegistrationPending] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Refs
  const authInitialized = useRef(false);
  const loginInProgress = useRef(false);
  
  // Hooks
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Initialize auth state
  useEffect(() => {
    const checkRegistration = () => {
      try {
        const pendingData = localStorage.getItem('pendingRegistration');
        const hasPending = !!pendingData;
        
        // Check if registration data is expired (older than 1 hour)
        if (hasPending) {
          try {
            const data = JSON.parse(pendingData);
            const timestamp = data.timestamp || Date.now();
            const isExpired = Date.now() - timestamp > 3600000; // 1 hour
            
            if (isExpired) {
              logger.info('Found expired registration data, clearing');
              localStorage.removeItem('pendingRegistration');
              return false;
            }
          } catch (parseError) {
            logger.error('Error parsing registration data:', parseError);
            localStorage.removeItem('pendingRegistration');
            return false;
          }
        }
        
        setHasRegistrationPending(hasPending);
        return hasPending;
      } catch (error) {
        logger.error('Error checking registration:', error);
        setHasRegistrationPending(false);
        return false;
      }
    };

    const initializeAuth = async () => {
      if (authInitialized.current) return;
      
      try {
        const token = localStorage.getItem('access_token');
        
        // Check for auth redirect in progress to prevent flashing to login page
        const isAuthRedirectInProgress = sessionStorage.getItem('auth_redirect_in_progress');
        
        if (!token && !isAuthRedirectInProgress) {
          setIsLoading(false);
          checkRegistration();
          return;
        }
        
        // If we have a token, verify it
        if (token) {
          logger.info("Initializing auth with token");
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          try {
            const response = await axiosInstance.get('/api/v1/auth/verify');
            
            if (response.data?.valid && response.data?.user) {
              const userData = response.data.user;
              
              // Normalize user data fields
              if (userData.full_name && !userData.fullName) {
                userData.fullName = userData.full_name;
              }
              if (userData.profile_picture && !userData.profilePicture) {
                userData.profilePicture = userData.profile_picture;
              }
              
              setUser(userData);
              setIsAuthenticated(true);
              logger.info("Auth initialized with user:", userData.email, userData);
            } else {
              // Token invalid, clean up
              handleLogout(false);
            }
          } catch (verifyError) {
            logger.error('Token verification failed:', verifyError);
            handleLogout(false);
          }
        }
      } catch (error) {
        logger.error('Auth initialization failed:', error);
        handleLogout(false);
      } finally {
        setIsLoading(false);
        authInitialized.current = true;
        checkRegistration();
        
        // Clean up the redirect flag when auth initialization is done
        sessionStorage.removeItem('auth_redirect_in_progress');
      }
    };

    initializeAuth();
  }, [navigate]);

  // Login handler
  const handleLogin = async (credentials) => {
    if (isAuthenticating || loginInProgress.current) {
      return { success: false, error: 'Authentication already in progress' };
    }
    
    setIsAuthenticating(true);
    loginInProgress.current = true;
    
    try {
      logger.info(`Attempting login for: ${credentials.email}`);
      
      const response = await axiosInstance.post('/api/v1/auth/login', 
        new URLSearchParams({
          username: credentials.email,
          password: credentials.password
        })
      );
      
      const { access_token, user } = response.data;
      
      // Set auth data
      localStorage.setItem('access_token', access_token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Clear any stale strategy caches from previous sessions
      unifiedStrategiesApi.clearCache();
      queryClient.removeQueries({ queryKey: ['strategies'] });
      queryClient.removeQueries({ queryKey: ['unified-strategies'] });

      // Normalize user data fields
      const userData = { ...user };
      if (userData.full_name && !userData.fullName) {
        userData.fullName = userData.full_name;
      }
      if (userData.profile_picture && !userData.profilePicture) {
        userData.profilePicture = userData.profile_picture;
      }
      
      setUser(userData);
      setIsAuthenticated(true);
      
      logger.info(`Login successful for: ${credentials.email}`);
      return { success: true, user: userData };
      
    } catch (error) {
      logger.error(`Login failed for ${credentials.email}:`, error);
      
      if (error.response?.status === 403) {
        // Handle subscription-specific errors
        const errorDetail = error.response.data?.detail;
        if (errorDetail && errorDetail.includes('subscription')) {
          navigate('/pricing');
          return {
            success: false,
            error: 'Your subscription is inactive. Please renew to continue.'
          };
        }
      }
      
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed'
      };
    } finally {
      setIsAuthenticating(false);
      loginInProgress.current = false;
    }
  };

  // Registration handler
  const handleRegistration = async (userData) => {
    try {
      setIsLoading(true);
      
      // Basic validation
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }
      
      // Store registration data in localStorage
      localStorage.setItem('pendingRegistration', JSON.stringify({
        email: userData.email,
        password: userData.password,
        username: userData.username || '',
        timestamp: Date.now()
      }));
      
      setHasRegistrationPending(true);
      
      logger.info(`Stored registration data for: ${userData.email}`);
      
      // Simply redirect to pricing page without making API call yet
      navigate('/pricing');
      return { success: true };
      
    } catch (error) {
      localStorage.removeItem('pendingRegistration');
      setHasRegistrationPending(false);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Registration failed';
      
      toast({
        title: "Registration Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
      });
      
      logger.error(`Registration error: ${errorMessage}`);
      return { success: false, error: errorMessage };
      
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const handleLogout = useCallback((shouldNavigate = true) => {
    localStorage.removeItem('access_token');
    delete axiosInstance.defaults.headers.common['Authorization'];

    setUser(null);
    setIsAuthenticated(false);

    // Clear strategy caches to prevent stale data on next login
    unifiedStrategiesApi.clearCache();
    queryClient.removeQueries({ queryKey: ['strategies'] });
    queryClient.removeQueries({ queryKey: ['unified-strategies'] });

    // Clear any pending registration if explicitly logging out
    if (shouldNavigate) {
      localStorage.removeItem('pendingRegistration');
      setHasRegistrationPending(false);
      navigate('/auth');
    }

    logger.info('User logged out - caches cleared');
  }, [navigate, queryClient]);

  // Check pending registration
  const checkPendingRegistration = useCallback(() => {
    try {
      const data = localStorage.getItem('pendingRegistration');
      if (!data) return null;

      const parsed = JSON.parse(data);
      const timeSinceRegistration = Date.now() - (parsed.timestamp || 0);
      
      // Clear if older than 1 hour
      if (timeSinceRegistration > 3600000) {
        localStorage.removeItem('pendingRegistration');
        setHasRegistrationPending(false);
        return null;
      }

      return parsed;
    } catch (error) {
      logger.error('Error checking pending registration:', error);
      return null;
    }
  }, []);

  // Set authenticated state directly (used by PaymentSuccess component)
  const setAuthenticatedState = useCallback((userData, token) => {
    console.log("Setting authenticated state:", userData, !!token);
    if (!userData || !token) {
      logger.error('Cannot set authenticated state: missing user data or token');
      return false;
    }
    
    try {
      // Normalize user data fields
      const normalizedUserData = { ...userData };
      if (normalizedUserData.full_name && !normalizedUserData.fullName) {
        normalizedUserData.fullName = normalizedUserData.full_name;
      }
      if (normalizedUserData.profile_picture && !normalizedUserData.profilePicture) {
        normalizedUserData.profilePicture = normalizedUserData.profile_picture;
      }
      
      // Update auth state
      setUser(normalizedUserData);
      setIsAuthenticated(true);
      
      // Ensure token is set in axios headers
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set a timestamp for the authentication
      localStorage.setItem('auth_timestamp', Date.now().toString());
      
      logger.info(`User authenticated directly: ${normalizedUserData.email || normalizedUserData.username}`);
      return true;
    } catch (error) {
      logger.error('Error setting authenticated state:', error);
      return false;
    }
  }, []);
  
  // Add this helper function to AuthContext.js:
  const refreshAuthState = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return false;
      
      // Set authorization header
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token and get user data
      const response = await axiosInstance.get('/api/v1/auth/verify');
      
      if (response.data?.valid && response.data?.user) {
        const userData = response.data.user;
        
        // Normalize user data fields
        if (userData.full_name && !userData.fullName) {
          userData.fullName = userData.full_name;
        }
        if (userData.profile_picture && !userData.profilePicture) {
          userData.profilePicture = userData.profile_picture;
        }
        
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error refreshing auth state:', error);
      return false;
    }
  }, []);

  // Update user profile
  const updateUserProfile = useCallback((updates) => {
    if (!user) return false;
    
    try {
      setUser(prevUser => ({
        ...prevUser,
        ...updates
      }));
      
      logger.info('User profile updated');
      return true;
    } catch (error) {
      logger.error('Error updating user profile:', error);
      return false;
    }
  }, [user]);

  // Register for a starter plan directly
  const registerStarter = async (userData) => {
    try {
      setIsLoading(true);
      
      // Basic validation
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }
      
      logger.info(`Registering starter plan directly for: ${userData.email}`);
      
      // Make direct API call to register with starter plan
      const response = await axiosInstance.post('/api/v1/auth/register-starter', {
        email: userData.email,
        password: userData.password,
        username: userData.username || undefined
      });
      
      // Process successful registration
      if (response.data && response.data.access_token) {
        // Store token
        localStorage.setItem('access_token', response.data.access_token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        
        // Set user data
        const userData = response.data.user || {};
        setUser(userData);
        setIsAuthenticated(true);
        
        logger.info(`Starter plan registration successful for: ${userData.email}`);
        
        // Navigate to dashboard
        navigate('/dashboard');
        return { success: true };
      } else {
        throw new Error('Registration succeeded but no access token received');
      }
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Registration failed';
      
      toast({
        title: "Registration Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
      });
      
      logger.error(`Starter plan registration error: ${errorMessage}`);
      return { success: false, error: errorMessage };
      
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    isLoading,
    isAuthenticated,
    isAuthenticating,
    hasRegistrationPending,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegistration,
    registerStarter,
    checkPendingRegistration,
    updateUserProfile,
    setAuthenticatedState,
    refreshAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};