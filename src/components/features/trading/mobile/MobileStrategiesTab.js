import React, { memo, lazy, Suspense } from 'react';
import { Box, Flex, Spinner } from '@chakra-ui/react';

const StrategyGroups = lazy(() => import('../../strategies/ActivateStrategies'));

/**
 * MobileStrategiesTab — wraps StrategyGroups inside a scrollable container
 * for the bottom sheet. No layout changes needed — strategy cards are already vertical.
 */
const MobileStrategiesTab = ({ strategies, accounts, accountConfigs, strategyBoundAccountIds }) => {
  return (
    <Box>
      <Suspense
        fallback={
          <Flex justify="center" py={8}>
            <Spinner size="md" color="cyan.400" />
          </Flex>
        }
      >
        <StrategyGroups
          strategies={strategies}
          accounts={accounts}
          accountConfigs={accountConfigs}
          strategyBoundAccountIds={strategyBoundAccountIds}
        />
      </Suspense>
    </Box>
  );
};

export default memo(MobileStrategiesTab);
