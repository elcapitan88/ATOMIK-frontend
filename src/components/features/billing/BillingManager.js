// src/components/features/billing/BillingManager.js
import React from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { ExternalLink } from 'lucide-react';
import axios from '@/services/axiosConfig';

const BillingManager = () => {
  const toast = useToast();

  const handleManageBilling = async () => {
    try {
      const response = await axios.post('/api/v1/subscriptions/create-portal-session');
      window.location.href = response.data.url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to access billing portal",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Button
      leftIcon={<ExternalLink size={16} />}
      onClick={handleManageBilling}
      variant="ghost"
      size="sm"
    >
      Manage Billing
    </Button>
  );
};

export default BillingManager;