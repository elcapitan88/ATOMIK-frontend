import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import axiosInstance from '@/services/axiosConfig';
import logger from '@/utils/logger';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRegistrationPending, setHasRegistrationPending] = useState(false);
  const loginInProgress = useRef(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  React.useEffect(() => {
    const checkRegistration = () => {
      try {
        const pendingData = localStorage.getItem('pendingRegistration');
        setHasRegistrationPending(!!pendingData);
        return !!pendingData;
      } catch {
        setHasRegistrationPending(false);
        return false;
      }
    };

    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setIsLoading(false);
          checkRegistration();
          return;
        }

        const response = await axiosInstance.get('/api/v1/auth/verify');
        if (response.data.valid) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          handleLogout();
        }
      } catch (error) {
        logger.error('Auth initialization failed:', error);
        handleLogout();
      } finally {
        setIsLoading(false);
        checkRegistration();
      }
    };

    initializeAuth();
  }, []);

  const handleLogin = async (credentials) => {
    if (isAuthenticating) return { success: false };
    
    setIsAuthenticating(true);
    try {
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
      setUser(user);
      setIsAuthenticated(true);
  
      return { success: true, user };
    } catch (error) {
      if (error.response?.status === 403) {
        // Handle subscription-specific errors
        const errorDetail = error.response.data?.detail;
        if (errorDetail.includes('subscription')) {
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
    }
  };

  const handleRegistration = async (userData) => {
    try {
      setIsLoading(true);
      
      // Store registration data first
      localStorage.setItem('pendingRegistration', JSON.stringify({
        email: userData.email,
        password: userData.password,
        timestamp: Date.now()
      }));
      
      setHasRegistrationPending(true);

      const response = await axiosInstance.post('/api/v1/auth/register', userData);
      navigate('/pricing');
      return true;

    } catch (error) {
      localStorage.removeItem('pendingRegistration');
      setHasRegistrationPending(false);
      
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      toast({
        title: "Registration Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('pendingRegistration');
    delete axiosInstance.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    setHasRegistrationPending(false);
    navigate('/auth');
  }, [navigate]);

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
    } catch {
      return null;
    }
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    hasRegistrationPending,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegistration,
    checkPendingRegistration
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