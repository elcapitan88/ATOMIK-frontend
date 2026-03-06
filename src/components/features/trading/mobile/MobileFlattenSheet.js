import React, { memo, useCallback, useMemo, useState } from 'react';
import { Box, Flex, Text, Button, useToast } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@/services/axiosConfig';
import AutomatedFlattenModal from '../AutomatedFlattenModal';

const MotionBox = motion.create(Box);

/**
 * MobileFlattenSheet — iOS-style action sheet for flatten/cancel operations.
 * Slides up from bottom with backdrop. Three actions:
 *   1. Flatten & Cancel All
 *   2. Flatten Positions Only
 *   3. Cancel Orders Only
 *
 * Smart behavior: only closes manual/discretionary positions first.
 * If automated (strategy-bound) positions remain, shows a modal to
 * let the user select which to close & deactivate.
 */
const MobileFlattenSheet = ({
  isOpen,
  onClose,
  positions = [],
  orders = [],
  strategyBoundAccountIds,
  getAccountStrategies,
}) => {
  const toast = useToast();
  const [activeAction, setActiveAction] = useState(null);
  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [autoModalData, setAutoModalData] = useState(null);

  // Helper: check if account is strategy-bound
  const isStrategyBound = useCallback(
    (accountId) => strategyBoundAccountIds?.has(String(accountId)),
    [strategyBoundAccountIds]
  );

  const openPositions = useMemo(
    () => positions.filter(
      (p) => p && !p.isClosed && p.side !== 'FLAT' && (p.quantity > 0 || Math.abs(p.netPos || 0) > 0)
    ),
    [positions]
  );

  const workingOrders = useMemo(
    () => orders.filter((o) => {
      if (!o || !o.orderId) return false;
      return o.ordStatus === 'Working' || o.status === 'Working' || o.ordStatus === 6;
    }),
    [orders]
  );

  // Split into manual vs automated
  const manualPositions = useMemo(
    () => openPositions.filter((p) => !isStrategyBound(p._accountId || p.accountId)),
    [openPositions, isStrategyBound]
  );
  const automatedPositions = useMemo(
    () => openPositions.filter((p) => isStrategyBound(p._accountId || p.accountId)),
    [openPositions, isStrategyBound]
  );
  const manualOrders = useMemo(
    () => workingOrders.filter((o) => !isStrategyBound(o._accountId || o.accountId)),
    [workingOrders, isStrategyBound]
  );
  const automatedOrders = useMemo(
    () => workingOrders.filter((o) => isStrategyBound(o._accountId || o.accountId)),
    [workingOrders, isStrategyBound]
  );

  const flattenManualPositions = useCallback(async () => {
    return Promise.all(
      manualPositions.map(async (pos) => {
        const accountId = pos._accountId || pos.accountId;
        if (!accountId) return { success: false };
        const closeSide = pos.side === 'LONG' ? 'SELL' : 'BUY';
        const qty = pos.quantity || Math.abs(pos.netPos || 0);
        try {
          await axiosInstance.post(
            `/api/v1/brokers/accounts/${accountId}/discretionary/orders`,
            { symbol: pos.symbol, side: closeSide, type: 'MARKET', quantity: qty, time_in_force: 'IOC', force_close: true }
          );
          return { success: true };
        } catch {
          return { success: false };
        }
      })
    );
  }, [manualPositions]);

  const cancelManualOrders = useCallback(async () => {
    return Promise.all(
      manualOrders.map(async (ord) => {
        const accountId = ord._accountId || ord.accountId;
        if (!accountId) return { success: false };
        try {
          await axiosInstance.delete(`/api/v1/brokers/accounts/${accountId}/orders/${ord.orderId}`);
          return { success: true };
        } catch {
          return { success: false };
        }
      })
    );
  }, [manualOrders]);

  const showResultsOrModal = useCallback((flatOk, flatFail, cancelOk, cancelFail, mode) => {
    if (automatedPositions.length > 0) {
      setAutoModalData({
        manualResults: { flatOk, flatFail, cancelOk, cancelFail },
        flattenMode: mode,
      });
      setAutoModalOpen(true);
    } else {
      const parts = [];
      if (flatOk > 0) parts.push(`${flatOk} position${flatOk !== 1 ? 's' : ''} closed`);
      if (cancelOk > 0) parts.push(`${cancelOk} order${cancelOk !== 1 ? 's' : ''} cancelled`);
      const failTotal = flatFail + cancelFail;
      const totalOps = flatOk + flatFail + cancelOk + cancelFail;
      if (totalOps === 0) {
        toast({ title: 'Nothing to do', status: 'info', duration: 2000 });
      } else if (failTotal === 0) {
        toast({ title: parts.join(', ') || 'Done', status: 'success', duration: 3000 });
      } else {
        toast({ title: `${parts.join(', ')}. ${failTotal} failed.`, status: 'warning', duration: 4000 });
      }
    }
    onClose();
  }, [automatedPositions, toast, onClose]);

  const handleAction = useCallback(
    async (action) => {
      setActiveAction(action);
      try {
        let flatOk = 0, flatFail = 0, cancelOk = 0, cancelFail = 0;

        if (action === 'flattenAndCancel') {
          const [posResults, ordResults] = await Promise.all([
            manualPositions.length > 0 ? flattenManualPositions() : [],
            manualOrders.length > 0 ? cancelManualOrders() : [],
          ]);
          flatOk = posResults.filter((r) => r.success).length;
          flatFail = posResults.filter((r) => !r.success).length;
          cancelOk = ordResults.filter((r) => r.success).length;
          cancelFail = ordResults.filter((r) => !r.success).length;
        } else if (action === 'flattenOnly') {
          const posResults = manualPositions.length > 0 ? await flattenManualPositions() : [];
          flatOk = posResults.filter((r) => r.success).length;
          flatFail = posResults.filter((r) => !r.success).length;
        } else if (action === 'cancelOnly') {
          const ordResults = manualOrders.length > 0 ? await cancelManualOrders() : [];
          cancelOk = ordResults.filter((r) => r.success).length;
          cancelFail = ordResults.filter((r) => !r.success).length;
        }

        showResultsOrModal(flatOk, flatFail, cancelOk, cancelFail, action);
      } catch (err) {
        toast({
          title: 'Operation failed',
          description: err.message,
          status: 'error',
          duration: 4000,
        });
        onClose();
      } finally {
        setActiveAction(null);
      }
    },
    [manualPositions, manualOrders, flattenManualPositions, cancelManualOrders, showResultsOrModal, toast, onClose]
  );

  const hasPositions = openPositions.length > 0;
  const hasOrders = workingOrders.length > 0;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <MotionBox
              position="fixed"
              inset={0}
              bg="blackAlpha.600"
              zIndex={1200}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Action Sheet */}
            <MotionBox
              position="fixed"
              left={3}
              right={3}
              bottom={3}
              zIndex={1201}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Action buttons group */}
              <Box
                bg="rgba(30, 30, 30, 0.95)"
                backdropFilter="blur(20px)"
                borderRadius="2xl"
                overflow="hidden"
                mb={2}
              >
                {/* Flatten & Cancel All */}
                <Button
                  w="100%"
                  h="56px"
                  variant="ghost"
                  color="red.400"
                  fontSize="md"
                  fontWeight="semibold"
                  borderRadius={0}
                  borderBottom="1px solid"
                  borderColor="whiteAlpha.100"
                  isLoading={activeAction === 'flattenAndCancel'}
                  isDisabled={(!hasPositions && !hasOrders) || (activeAction && activeAction !== 'flattenAndCancel')}
                  onClick={() => handleAction('flattenAndCancel')}
                  _hover={{ bg: 'whiteAlpha.100' }}
                  _active={{ bg: 'whiteAlpha.200' }}
                >
                  Flatten & Cancel All
                </Button>

                {/* Flatten Positions Only */}
                <Button
                  w="100%"
                  h="56px"
                  variant="ghost"
                  color="red.300"
                  fontSize="md"
                  fontWeight="normal"
                  borderRadius={0}
                  borderBottom="1px solid"
                  borderColor="whiteAlpha.100"
                  isLoading={activeAction === 'flattenOnly'}
                  isDisabled={!hasPositions || (activeAction && activeAction !== 'flattenOnly')}
                  onClick={() => handleAction('flattenOnly')}
                  _hover={{ bg: 'whiteAlpha.100' }}
                  _active={{ bg: 'whiteAlpha.200' }}
                >
                  <Flex direction="column" align="center">
                    <Text>Flatten Positions Only</Text>
                    <Text fontSize="xs" color="whiteAlpha.500" fontWeight="normal">
                      {openPositions.length} position{openPositions.length !== 1 ? 's' : ''}
                      {automatedPositions.length > 0 && ` (${automatedPositions.length} automated)`}
                    </Text>
                  </Flex>
                </Button>

                {/* Cancel Orders Only */}
                <Button
                  w="100%"
                  h="56px"
                  variant="ghost"
                  color="orange.300"
                  fontSize="md"
                  fontWeight="normal"
                  borderRadius={0}
                  isLoading={activeAction === 'cancelOnly'}
                  isDisabled={!hasOrders || (activeAction && activeAction !== 'cancelOnly')}
                  onClick={() => handleAction('cancelOnly')}
                  _hover={{ bg: 'whiteAlpha.100' }}
                  _active={{ bg: 'whiteAlpha.200' }}
                >
                  <Flex direction="column" align="center">
                    <Text>Cancel Orders Only</Text>
                    <Text fontSize="xs" color="whiteAlpha.500" fontWeight="normal">
                      {workingOrders.length} order{workingOrders.length !== 1 ? 's' : ''}
                    </Text>
                  </Flex>
                </Button>
              </Box>

              {/* Cancel (dismiss) — separate card, iOS pattern */}
              <Button
                w="100%"
                h="56px"
                bg="rgba(30, 30, 30, 0.95)"
                backdropFilter="blur(20px)"
                color="cyan.400"
                fontSize="md"
                fontWeight="semibold"
                borderRadius="2xl"
                onClick={onClose}
                _hover={{ bg: 'rgba(40, 40, 40, 0.95)' }}
                _active={{ bg: 'rgba(50, 50, 50, 0.95)' }}
              >
                Cancel
              </Button>
            </MotionBox>
          </>
        )}
      </AnimatePresence>

      {/* Automated positions modal */}
      <AutomatedFlattenModal
        isOpen={autoModalOpen}
        onClose={() => { setAutoModalOpen(false); setAutoModalData(null); }}
        automatedPositions={automatedPositions}
        automatedOrders={automatedOrders}
        getAccountStrategies={getAccountStrategies}
        manualResults={autoModalData?.manualResults}
        flattenMode={autoModalData?.flattenMode}
      />
    </>
  );
};

export default memo(MobileFlattenSheet);
