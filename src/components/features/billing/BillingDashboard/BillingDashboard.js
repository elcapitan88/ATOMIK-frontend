import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  TabPanels,
  TabPanel,
  Tabs
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

import BillingTabNavigation from './BillingTabNavigation';
import { AtomikMembershipTab } from './AtomikMembershipTab';
import { StrategySubscriptionsTab } from './StrategySubscriptionsTab';
import axiosInstance from '@/services/axiosConfig';

const MotionBox = motion(Box);

const BillingDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('atomik');
  const [strategySubscriptionCount, setStrategySubscriptionCount] = useState(0);

  // Fetch strategy subscription count for badge
  useEffect(() => {
    const fetchStrategyCount = async () => {
      try {
        const response = await axiosInstance.get('/api/v1/subscriptions/strategy-subscriptions');
        setStrategySubscriptionCount(response.data?.length || 0);
      } catch (error) {
        console.error('Error fetching strategy subscription count:', error);
        // Don't show error for count - it's just for the badge
      }
    };

    fetchStrategyCount();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <VStack spacing={0} align="stretch">
        {/* Tab Navigation */}
        <BillingTabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          strategySubscriptionCount={strategySubscriptionCount}
        />

        {/* Tab Content */}
        <Tabs 
          index={activeTab === 'atomik' ? 0 : 1} 
          variant="unstyled"
        >
          <TabPanels>
            {/* Atomik Membership Tab */}
            <TabPanel p={0}>
              <MotionBox
                key="atomik-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <AtomikMembershipTab user={user} />
              </MotionBox>
            </TabPanel>

            {/* Strategy Subscriptions Tab */}
            <TabPanel p={0}>
              <MotionBox
                key="strategies-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <StrategySubscriptionsTab />
              </MotionBox>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </MotionBox>
  );
};

export default BillingDashboard;