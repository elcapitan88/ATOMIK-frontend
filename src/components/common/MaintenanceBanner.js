import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  CloseButton,
  useToast
} from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';

const MaintenanceBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const toast = useToast();

  useEffect(() => {
    // Listen for maintenance mode events from axios interceptor
    const handleMaintenanceMode = (event) => {
      setMaintenanceMessage(event.detail.message);
      setIsVisible(true);
      
      // Also show a toast notification
      toast({
        title: "Maintenance Mode",
        description: event.detail.message,
        status: "warning",
        duration: 8000,
        isClosable: true,
        position: "top"
      });
    };

    window.addEventListener('maintenanceMode', handleMaintenanceMode);

    return () => {
      window.removeEventListener('maintenanceMode', handleMaintenanceMode);
    };
  }, [toast]);

  if (!isVisible) {
    return null;
  }

  return (
    <Box position="fixed" top="0" left="0" right="0" zIndex="9999">
      <Alert 
        status="warning" 
        variant="solid"
        bg="orange.500"
        color="white"
        borderRadius="0"
      >
        <AlertIcon as={AlertTriangle} />
        <Box flex="1">
          <AlertTitle fontSize="sm" mr={2}>
            Maintenance Mode
          </AlertTitle>
          <AlertDescription fontSize="sm">
            {maintenanceMessage}
          </AlertDescription>
        </Box>
        <CloseButton 
          position="absolute" 
          right="8px" 
          top="8px"
          onClick={() => setIsVisible(false)}
        />
      </Alert>
    </Box>
  );
};

export default MaintenanceBanner;