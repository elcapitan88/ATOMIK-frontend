import React, { useState, useEffect } from 'react';
import { Box, Text, useToast } from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';
import { checkMaintenanceStatus } from '../../services/api/admin';

const MaintenanceBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const toast = useToast();

  // Function to check maintenance status
  const checkMaintenance = async () => {
    try {
      const status = await checkMaintenanceStatus();
      if (status.is_enabled && status.message) {
        setMaintenanceMessage(status.message);
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    } catch (error) {
      // Silently handle errors to avoid spam
      console.log('Maintenance status check failed:', error);
    }
  };

  useEffect(() => {
    // Initial check
    checkMaintenance();

    // Set up polling every 30 seconds
    const interval = setInterval(checkMaintenance, 30000);

    // Listen for maintenance mode events from axios interceptor
    const handleMaintenanceMode = (event) => {
      setMaintenanceMessage(event.detail.message || 'The application is currently under maintenance.');
      setIsVisible(true);
    };

    window.addEventListener('maintenanceMode', handleMaintenanceMode);

    return () => {
      clearInterval(interval);
      window.removeEventListener('maintenanceMode', handleMaintenanceMode);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Box 
      position="fixed" 
      top="0" 
      left="0" 
      right="0" 
      zIndex="9999"
      background="rgba(220, 38, 38, 0.1)"
      backdropFilter="blur(10px)"
      borderBottom="1px solid rgba(220, 38, 38, 0.18)"
      boxShadow="0 8px 32px 0 rgba(220, 38, 38, 0.37)"
      color="white"
      px={4}
      py={3}
    >
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        maxW="1200px"
        mx="auto"
      >
        <Box 
          as={AlertTriangle} 
          size={20} 
          color="red.300"
          mr={3}
          flexShrink={0}
        />
        <Box flex="1" textAlign="center">
          <Text 
            fontSize="sm" 
            fontWeight="semibold" 
            color="red.100"
            mb={1}
          >
            Maintenance Mode
          </Text>
          <Text 
            fontSize="sm" 
            color="red.50"
            opacity={0.9}
          >
            {maintenanceMessage || 'The application is currently under maintenance.'}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default MaintenanceBanner;