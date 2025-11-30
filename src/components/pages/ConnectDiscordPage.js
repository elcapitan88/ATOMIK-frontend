import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/services/axiosConfig';

const MotionBox = motion(Box);

// Custom Discord icon component
const DiscordIcon = ({ size = 48, ...props }) => (
  <Box
    as="svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    color="currentColor"
    fill="currentColor"
    {...props}
  >
    <path
      d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
    />
  </Box>
);

const ConnectDiscordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [status, setStatus] = useState('loading'); // loading, success, error, login_required
  const [errorMessage, setErrorMessage] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    const completeMagicLink = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Invalid link - no token provided');
        return;
      }

      // Wait for auth to finish loading
      if (authLoading) return;

      // If not authenticated, redirect to login with return URL
      if (!isAuthenticated) {
        setStatus('login_required');
        return;
      }

      // Complete the magic link
      try {
        const response = await axiosInstance.get(`/api/v1/discord/magic-link/complete?token=${token}`);

        // Check if we got redirected (302 response won't happen here, but we can handle success)
        if (response.status === 200) {
          setStatus('success');
          // Try to get the discord username from response if available
          if (response.data?.discord_username) {
            setDiscordUsername(response.data.discord_username);
          }
        }
      } catch (error) {
        console.error('Magic link error:', error);
        setStatus('error');
        setErrorMessage(error.response?.data?.detail || 'Failed to link Discord account');
      }
    };

    completeMagicLink();
  }, [token, isAuthenticated, authLoading]);

  const handleLogin = () => {
    // Store the return URL so we can come back after login
    sessionStorage.setItem('discord_link_return', `/connect-discord?token=${token}`);
    navigate('/auth');
  };

  const handleGoToSettings = () => {
    navigate('/settings?discord=success');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Box
      minH="100vh"
      bg="#0a0a0a"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <MotionBox
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <VStack spacing={6} textAlign="center">
              <Box color="#00C6E0">
                <DiscordIcon size={64} />
              </Box>
              <VStack spacing={2}>
                <Text color="white" fontSize="xl" fontWeight="bold">
                  Linking Discord Account
                </Text>
                <Spinner size="lg" color="#00C6E0" />
              </VStack>
            </VStack>
          </MotionBox>
        )}

        {status === 'login_required' && (
          <MotionBox
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            bg="#121212"
            border="1px solid #333"
            borderRadius="xl"
            p={8}
            maxW="400px"
            w="full"
          >
            <VStack spacing={6} textAlign="center">
              <Box color="#00C6E0">
                <DiscordIcon size={64} />
              </Box>
              <VStack spacing={2}>
                <Text color="white" fontSize="xl" fontWeight="bold">
                  Login Required
                </Text>
                <Text color="whiteAlpha.700" fontSize="sm">
                  Please log in to your Atomik account to complete the Discord link
                </Text>
              </VStack>
              <Button
                w="full"
                bg="#00C6E0"
                color="white"
                _hover={{ bg: "#00A3B8" }}
                onClick={handleLogin}
                size="lg"
              >
                Log In to Continue
              </Button>
            </VStack>
          </MotionBox>
        )}

        {status === 'success' && (
          <MotionBox
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
            bg="#121212"
            border="1px solid #00C6E0"
            borderRadius="xl"
            p={8}
            maxW="400px"
            w="full"
          >
            <VStack spacing={6} textAlign="center">
              <MotionBox
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
              >
                <Box
                  bg="rgba(0, 198, 224, 0.1)"
                  borderRadius="full"
                  p={4}
                >
                  <CheckCircle size={48} color="#00C6E0" />
                </Box>
              </MotionBox>
              <VStack spacing={2}>
                <Text color="white" fontSize="xl" fontWeight="bold">
                  Discord Connected!
                </Text>
                <Text color="whiteAlpha.700" fontSize="sm">
                  {discordUsername
                    ? `Your Discord account @${discordUsername} is now linked to Atomik`
                    : 'Your Discord account is now linked to Atomik'}
                </Text>
              </VStack>
              <VStack spacing={3} w="full">
                <Button
                  w="full"
                  bg="#00C6E0"
                  color="white"
                  _hover={{ bg: "#00A3B8" }}
                  onClick={handleGoToSettings}
                  size="lg"
                >
                  Go to Settings
                </Button>
                <Text color="whiteAlpha.500" fontSize="xs">
                  You can now use ARIA in Discord!
                </Text>
              </VStack>
            </VStack>
          </MotionBox>
        )}

        {status === 'error' && (
          <MotionBox
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            bg="#121212"
            border="1px solid #e53e3e"
            borderRadius="xl"
            p={8}
            maxW="400px"
            w="full"
          >
            <VStack spacing={6} textAlign="center">
              <Box
                bg="rgba(229, 62, 62, 0.1)"
                borderRadius="full"
                p={4}
              >
                <XCircle size={48} color="#e53e3e" />
              </Box>
              <VStack spacing={2}>
                <Text color="white" fontSize="xl" fontWeight="bold">
                  Link Failed
                </Text>
                <Text color="whiteAlpha.700" fontSize="sm">
                  {errorMessage}
                </Text>
              </VStack>
              <VStack spacing={3} w="full">
                <Button
                  w="full"
                  variant="outline"
                  borderColor="#00C6E0"
                  color="#00C6E0"
                  _hover={{ bg: "rgba(0, 198, 224, 0.1)" }}
                  onClick={handleGoHome}
                  size="lg"
                >
                  Go to Home
                </Button>
                <Text color="whiteAlpha.500" fontSize="xs">
                  Try requesting a new link from Discord
                </Text>
              </VStack>
            </VStack>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default ConnectDiscordPage;
