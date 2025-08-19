import React from 'react';
import {
  VStack,
  SimpleGrid
} from '@chakra-ui/react';
import SubscriptionCard from './SubscriptionCard';

const SubscriptionsList = ({ subscriptions, onRefresh }) => {
  return (
    <VStack spacing={6} align="stretch">
      {/* Subscriptions Grid */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {subscriptions.map((subscription, index) => (
          <SubscriptionCard
            key={subscription.id}
            subscription={subscription}
            onRefresh={onRefresh}
            delay={index * 0.1}
          />
        ))}
      </SimpleGrid>
    </VStack>
  );
};

export default SubscriptionsList;