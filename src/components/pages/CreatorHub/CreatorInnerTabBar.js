import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { BarChart3, Layers, DollarSign } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'strategies', label: 'Strategies', icon: Layers },
  { id: 'earnings', label: 'Earnings & Payouts', icon: DollarSign }
];

const CreatorInnerTabBar = ({ activeTab, onTabChange }) => {
  return (
    <Flex
      gap="2px"
      mb={6}
      position="relative"
      borderBottom="1px solid rgba(255,255,255,0.06)"
      overflowX="auto"
      css={{
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none'
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <Box
            key={tab.id}
            as="button"
            position="relative"
            px={4}
            py={3}
            bg="transparent"
            border="none"
            cursor="pointer"
            display="flex"
            alignItems="center"
            gap={2}
            transition="color 0.2s"
            color={isActive ? 'white' : 'whiteAlpha.500'}
            _hover={{ color: isActive ? 'white' : 'whiteAlpha.700' }}
            whiteSpace="nowrap"
            onClick={() => onTabChange(tab.id)}
            flexShrink={0}
          >
            <Icon size={16} />
            <Text fontSize="14px" fontWeight={isActive ? '600' : '500'}>
              {tab.label}
            </Text>
            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="creator-tab-indicator"
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: '#00C6E0',
                  borderRadius: '2px 2px 0 0'
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </Box>
        );
      })}
    </Flex>
  );
};

export default CreatorInnerTabBar;
