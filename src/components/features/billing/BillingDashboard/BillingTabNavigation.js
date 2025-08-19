import React from 'react';
import {
  Tabs,
  TabList,
  Tab,
  Box,
  HStack,
  Text,
  Badge
} from '@chakra-ui/react';
import { CreditCard, Zap } from 'lucide-react';

const BillingTabNavigation = ({ 
  activeTab, 
  onTabChange, 
  strategySubscriptionCount = 0 
}) => {
  return (
    <Box mb={6}>
      <Tabs 
        index={activeTab === 'atomik' ? 0 : 1} 
        onChange={(index) => onTabChange(index === 0 ? 'atomik' : 'strategies')}
        variant="enclosed"
        colorScheme="cyan"
      >
        <TabList 
          bg="#1a1a1a" 
          borderColor="#333"
          borderRadius="md"
          p={1}
        >
          <Tab
            color="whiteAlpha.700"
            _selected={{
              color: "white",
              bg: "#00C6E0",
              borderColor: "#00C6E0"
            }}
            _hover={{
              color: "white",
              bg: activeTab === 'atomik' ? "#00C6E0" : "rgba(0, 198, 224, 0.1)"
            }}
            flex={1}
            justifyContent="center"
          >
            <HStack spacing={2}>
              <CreditCard size={16} />
              <Text fontSize="sm" fontWeight="medium">
                Atomik Membership
              </Text>
            </HStack>
          </Tab>
          
          <Tab
            color="whiteAlpha.700"
            _selected={{
              color: "white",
              bg: "#00C6E0",
              borderColor: "#00C6E0"
            }}
            _hover={{
              color: "white",
              bg: activeTab === 'strategies' ? "#00C6E0" : "rgba(0, 198, 224, 0.1)"
            }}
            flex={1}
            justifyContent="center"
          >
            <HStack spacing={2}>
              <Zap size={16} />
              <Text fontSize="sm" fontWeight="medium">
                Strategy Subscriptions
              </Text>
              {strategySubscriptionCount > 0 && (
                <Badge
                  bg="rgba(0, 198, 224, 0.2)"
                  color="#00C6E0"
                  fontSize="xs"
                  borderRadius="full"
                  px={2}
                >
                  {strategySubscriptionCount}
                </Badge>
              )}
            </HStack>
          </Tab>
        </TabList>
      </Tabs>
    </Box>
  );
};

export default BillingTabNavigation;