import React, { useState } from 'react';
import {
  Button,
  useToast
} from '@chakra-ui/react';
import { ExternalLink } from 'lucide-react';
import axiosInstance from '@/services/axiosConfig';

const StripePortalButton = ({ size = "md", variant = "solid" }) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const openStripePortal = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/api/v1/subscriptions/create-portal-session');
      const portalUrl = response.data.url;
      
      // Open in new tab
      window.open(portalUrl, '_blank', 'noopener,noreferrer');
      
      toast({
        title: "Billing portal opened",
        description: "Manage your subscription in the new tab",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Portal session error:', error);
      toast({
        title: "Error opening billing portal",
        description: error.response?.data?.detail || error.message || "Please try again later",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size={size}
      bg="#00C6E0"
      color="white"
      variant={variant}
      width="full"
      _hover={{ 
        bg: "#00A3B8",
        transform: "translateY(-1px)",
        boxShadow: "0 4px 12px -4px rgba(0, 198, 224, 0.4)"
      }}
      _active={{
        transform: "translateY(0)",
      }}
      leftIcon={<ExternalLink size={18} />}
      isLoading={isLoading}
      loadingText="Opening portal..."
      onClick={openStripePortal}
      transition="all 0.2s"
    >
      Open Billing Portal
    </Button>
  );
};

export default StripePortalButton;