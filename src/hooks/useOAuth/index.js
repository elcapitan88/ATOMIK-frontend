// hooks/useOAuth/index.js
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { brokerAuthService } from '@/services/api/auth/brokerAuth';


export const useOAuth = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const initiateBrokerAuth = useCallback(async (broker, environment) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      switch (broker) {
        case 'tradovate': {
          const { auth_url } = await brokerAuthService.initiateTradovateOAuth(environment);
          window.location.href = auth_url;
          break;
        }
        default:
          throw new Error(`Unsupported broker: ${broker}`);
      }
    } catch (err) {
      setError(err.message);
      toast({
        title: "Connection Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const handleCallback = useCallback(async (broker, code) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await brokerAuthService.handleOAuthCallback(code);
      toast({
        title: "Connection Successful",
        description: "Your trading account has been connected.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
      return response;
    } catch (err) {
      setError(err.message);
      toast({
        title: "Authentication Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      navigate('/connect');
    } finally {
      setIsProcessing(false);
    }
  }, [navigate, toast]);

  return {
    isProcessing,
    error,
    initiateBrokerAuth,
    handleCallback,
    clearError: () => setError(null)
  };
};