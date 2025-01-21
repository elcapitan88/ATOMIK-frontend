// src/components/features/trading/OrderControl/OrderPreview.js
import React, { useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Divider,
  Badge,
  Tooltip,
  useDisclosure,
  Collapse,
  Button,
} from '@chakra-ui/react';
import { 
  Info, 
  ChevronDown, 
  ChevronUp,
  DollarSign,
  Percent,
  Scale
} from 'lucide-react';

const OrderPreview = ({ quantity, selectedAccounts }) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });

  // Simulated account data - replace with actual data from your API
  const accountsData = useMemo(() => ({
    '1': { balance: 10000, name: 'Main Trading' },
    '2': { balance: 5000, name: 'Secondary' },
    '3': { balance: 1000, name: 'Test Account' },
  }), []);

  const distributionData = useMemo(() => {
    if (!selectedAccounts.length) return [];

    return selectedAccounts.map(accountId => {
      const account = accountsData[accountId];
      if (!account) return null;

      const positionValue = quantity * 50; // Example contract value
      const positionRisk = (positionValue / account.balance) * 100;

      return {
        accountId,
        name: account.name,
        balance: account.balance,
        quantity,
        positionValue,
        riskPercentage: positionRisk
      };
    }).filter(Boolean);
  }, [selectedAccounts, quantity, accountsData]);

  const getRiskLevel = (percentage) => {
    if (percentage > 20) return { level: 'High', color: 'red' };
    if (percentage > 10) return { level: 'Medium', color: 'yellow' };
    return { level: 'Low', color: 'green' };
  };

  if (!selectedAccounts.length) return null;

  return (
    <Box width="full">
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" fontWeight="medium" color="whiteAlpha.900">
          Order Preview
        </Text>
        <Button
          variant="ghost"
          size="sm"
          rightIcon={isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          onClick={onToggle}
          _hover={{ bg: 'whiteAlpha.100' }}
          color="whiteAlpha.900"
        >
          {isOpen ? 'Hide' : 'Show'}
        </Button>
      </HStack>

      <Collapse in={isOpen}>
        <VStack
          spacing={3}
          align="stretch"
          bg="whiteAlpha.100"
          p={3}
          borderRadius="md"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
        >
          {/* Total Order Summary */}
          <HStack justify="space-between">
            <Text fontSize="sm" color="whiteAlpha.700">Total Quantity:</Text>
            <Text fontSize="sm" color="white">{quantity * selectedAccounts.length}</Text>
          </HStack>

          <Divider borderColor="whiteAlpha.200" />

          {/* Per Account Distribution */}
          {distributionData.map((data) => (
            <Box 
              key={data.accountId}
              p={2}
              bg="whiteAlpha.100"
              borderRadius="md"
            >
              <VStack align="stretch" spacing={1}>
                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="medium">{data.name}</Text>
                  <Badge colorScheme="blue">{data.quantity} contracts</Badge>
                </HStack>

                <HStack spacing={4} justify="space-between">
                  <HStack spacing={1}>
                    <DollarSign size={14} />
                    <Text fontSize="xs" color="whiteAlpha.700">
                      ${data.positionValue.toLocaleString()}
                    </Text>
                  </HStack>

                  <HStack spacing={1}>
                    <Percent size={14} />
                    <Text fontSize="xs" color="whiteAlpha.700">
                      {data.riskPercentage.toFixed(1)}% of balance
                    </Text>
                  </HStack>

                  <Tooltip
                    label={`Risk Level: ${getRiskLevel(data.riskPercentage).level}`}
                    hasArrow
                  >
                    <HStack spacing={1}>
                      <Scale size={14} />
                      <Badge 
                        colorScheme={getRiskLevel(data.riskPercentage).color}
                        variant="subtle"
                      >
                        {getRiskLevel(data.riskPercentage).level}
                      </Badge>
                    </HStack>
                  </Tooltip>
                </HStack>
              </VStack>
            </Box>
          ))}

          {/* Warning for high risk */}
          {distributionData.some(data => getRiskLevel(data.riskPercentage).level === 'High') && (
            <HStack 
              spacing={2} 
              bg="red.900" 
              p={2} 
              borderRadius="md"
              borderLeft="4px"
              borderColor="red.500"
            >
              <Info size={14} color="#F56565" />
              <Text fontSize="xs" color="white">
                High risk detected. Consider reducing position size.
              </Text>
            </HStack>
          )}
        </VStack>
      </Collapse>
    </Box>
  );
};

export default OrderPreview;