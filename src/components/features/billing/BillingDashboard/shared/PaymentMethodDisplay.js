import React from 'react';
import {
  HStack,
  Text,
  Box,
  Skeleton
} from '@chakra-ui/react';
import { CreditCard } from 'lucide-react';

const PaymentMethodDisplay = ({ 
  paymentMethod, 
  isLoading = false,
  showIcon = true 
}) => {
  if (isLoading) {
    return (
      <HStack spacing={2}>
        {showIcon && <Skeleton w="16px" h="16px" />}
        <Skeleton height="16px" width="120px" />
      </HStack>
    );
  }

  if (!paymentMethod) {
    return (
      <HStack spacing={2} color="whiteAlpha.600">
        {showIcon && <CreditCard size={16} />}
        <Text fontSize="sm">No payment method</Text>
      </HStack>
    );
  }

  const { type, last4, brand } = paymentMethod;

  const getBrandColor = (brand) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '#1A1F71';
      case 'mastercard':
        return '#EB001B';
      case 'amex':
      case 'american_express':
        return '#006FCF';
      case 'discover':
        return '#FF6000';
      default:
        return '#00C6E0';
    }
  };

  const formatBrand = (brand) => {
    if (!brand) return 'Card';
    if (brand.toLowerCase() === 'amex') return 'Amex';
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  return (
    <HStack spacing={2}>
      {showIcon && (
        <Box color={getBrandColor(brand)}>
          <CreditCard size={16} />
        </Box>
      )}
      <Text color="white" fontSize="sm">
        {formatBrand(brand)} •••• {last4}
      </Text>
    </HStack>
  );
};

export default PaymentMethodDisplay;