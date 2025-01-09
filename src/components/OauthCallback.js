import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Text, Spinner } from '@chakra-ui/react';
import { useOAuth } from '@/hooks/useOAuth';

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleCallback } = useOAuth();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (!code) {
          console.error('No code provided in OAuth callback');
          navigate('/dashboard');
          return;
        }

        await handleCallback('tradovate', code);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error during OAuth callback:', error);
        navigate('/dashboard');
      }
    };

    processCallback();
  }, [location, navigate, handleCallback]);

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bg="background">
      <Box textAlign="center">
        <Spinner size="xl" mb={4} color="blue.500" />
        <Text fontSize="xl" color="white">Completing authentication...</Text>
      </Box>
    </Box>
  );
};

export default OAuthCallback;