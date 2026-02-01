import React, { useState } from 'react';
import { Box, useDisclosure } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import CreatorDashboardHeader from './CreatorDashboardHeader';
import CreatorInnerTabBar from './CreatorInnerTabBar';
import CreatorProfileDrawer from './CreatorProfileDrawer';
import CreatorOverviewTab from './tabs/CreatorOverviewTab';
import CreatorStrategiesTab from './tabs/CreatorStrategiesTab';
import CreatorEarningsTab from './tabs/CreatorEarningsTab';

const MotionBox = motion(Box);

const tabContentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
};

/**
 * CreatorDashboardView
 * The main creator dashboard rendered inside Settings > Creator tab
 * after the user has completed onboarding.
 *
 * Props:
 *   creatorProfile - the creator's profile data
 */
const CreatorDashboardView = ({ creatorProfile }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { isOpen: isDrawerOpen, onOpen: onOpenDrawer, onClose: onCloseDrawer } = useDisclosure();

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <CreatorOverviewTab creatorProfile={creatorProfile} />;
      case 'strategies':
        return <CreatorStrategiesTab />;
      case 'earnings':
        return <CreatorEarningsTab />;
      default:
        return <CreatorOverviewTab creatorProfile={creatorProfile} />;
    }
  };

  return (
    <Box>
      <CreatorDashboardHeader
        creatorProfile={creatorProfile}
        onEditProfile={onOpenDrawer}
      />

      <CreatorInnerTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <AnimatePresence mode="wait">
        <MotionBox
          key={activeTab}
          variants={tabContentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {renderTab()}
        </MotionBox>
      </AnimatePresence>

      <CreatorProfileDrawer
        isOpen={isDrawerOpen}
        onClose={onCloseDrawer}
        creatorProfile={creatorProfile}
      />
    </Box>
  );
};

export default CreatorDashboardView;
