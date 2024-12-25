import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Text, Spinner } from '@chakra-ui/react';

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          const response = await axios.get(`/tradovate/oauth-callback/?code=${code}`);
          const { access_token, md_access_token } = response.data;

          // Store tokens securely (e.g., in HttpOnly cookies via your backend)
          // For now, we'll just log them
          console.log('Access Token:', access_token);
          console.log('MD Access Token:', md_access_token);

          // TODO: Update your app state to reflect successful authentication

          // Redirect to the main dashboard or appropriate page
          navigate('/dashboard');
        } catch (error) {
          console.error('Error during OAuth callback:', error);
          // Handle error (e.g., show an error message to the user)
          navigate('/error');
        }
      } else {
        console.error('No code provided in OAuth callback');
        navigate('/error');
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Box textAlign="center">
        <Spinner size="xl" mb={4} />
        <Text fontSize="xl">Completing authentication...</Text>
      </Box>
    </Box>
  );
};

export default OAuthCallback;