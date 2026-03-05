import React, { useState, useCallback, useRef, useMemo, memo } from 'react';
import { Box, Flex, HStack, Text, Badge, ButtonGroup, Button } from '@chakra-ui/react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Activity, FileText, Users, Wand2 } from 'lucide-react';

const MotionBox = motion.create(Box);

// Snap points as distance from BOTTOM of viewport
const PEEK_HEIGHT = 80;
const HALF_HEIGHT_RATIO = 0.45;
const FULL_HEIGHT_RATIO = 0.85;
const BOTTOM_NAV_HEIGHT = 64;
const ACTION_BAR_HEIGHT = 72;
const BOTTOM_OFFSET = BOTTOM_NAV_HEIGHT + ACTION_BAR_HEIGHT;

/**
 * MobileBottomSheet — draggable sheet with 3 snap points (peek / half / full).
 *
 * Renders tab bar + scrollable content for Positions, Orders, Accounts, Strategies.
 */
const MobileBottomSheet = ({
  positions = [],
  orders = [],
  accounts = [],
  positionsCount = 0,
  ordersCount = 0,
  accountsCount = 0,
  totalOpenPnL = 0,
  activeTab,
  onTabChange,
  children,
}) => {
  const containerRef = useRef(null);
  const [snapState, setSnapState] = useState('peek'); // 'peek' | 'half' | 'full'
  const y = useMotionValue(0);

  // Compute snap positions (negative = up from bottom)
  const getSnapPositions = useCallback(() => {
    const vh = window.innerHeight;
    return {
      peek: vh - BOTTOM_OFFSET - PEEK_HEIGHT,
      half: vh - BOTTOM_OFFSET - vh * HALF_HEIGHT_RATIO,
      full: vh - BOTTOM_OFFSET - vh * FULL_HEIGHT_RATIO,
    };
  }, []);

  const snapTo = useCallback(
    (target) => {
      const snaps = getSnapPositions();
      const targetY = snaps[target];
      setSnapState(target);
      animate(y, targetY, {
        type: 'spring',
        damping: 30,
        stiffness: 300,
      });
    },
    [y, getSnapPositions]
  );

  // Initialize to peek position
  const initialY = useMemo(() => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    return vh - BOTTOM_OFFSET - PEEK_HEIGHT;
  }, []);

  // Drag end handler — snap to nearest point or fling based on velocity
  const handleDragEnd = useCallback(
    (_, info) => {
      const velocity = info.velocity.y;
      const currentY = y.get();
      const snaps = getSnapPositions();

      // Fast fling — use velocity direction
      if (Math.abs(velocity) > 500) {
        if (velocity < 0) {
          // Swiping up
          if (snapState === 'peek') snapTo('half');
          else if (snapState === 'half') snapTo('full');
          else snapTo('full');
        } else {
          // Swiping down
          if (snapState === 'full') snapTo('half');
          else if (snapState === 'half') snapTo('peek');
          else snapTo('peek');
        }
        return;
      }

      // Slow drag — snap to nearest
      const distances = {
        peek: Math.abs(currentY - snaps.peek),
        half: Math.abs(currentY - snaps.half),
        full: Math.abs(currentY - snaps.full),
      };
      const nearest = Object.entries(distances).reduce((a, b) =>
        a[1] < b[1] ? a : b
      )[0];
      snapTo(nearest);
    },
    [y, snapState, snapTo, getSnapPositions]
  );

  // Drag handle tap cycles through snap points
  const handleHandleTap = useCallback(() => {
    if (snapState === 'peek') snapTo('half');
    else if (snapState === 'half') snapTo('full');
    else snapTo('peek');
  }, [snapState, snapTo]);

  // Opacity of content based on sheet position (fade in as it opens)
  const snaps = getSnapPositions();
  const contentOpacity = useTransform(
    y,
    [snaps.full, snaps.half, snaps.peek],
    [1, 1, 0]
  );

  const tabs = [
    { key: 'positions', label: 'Positions', icon: Activity, count: positionsCount },
    { key: 'orders', label: 'Orders', icon: FileText, count: ordersCount },
    { key: 'accounts', label: 'Accounts', icon: Users, count: accountsCount },
    { key: 'strategies', label: 'Strategies', icon: Wand2 },
  ];

  const pnlColor = totalOpenPnL >= 0 ? 'green.400' : 'red.400';
  const pnlPrefix = totalOpenPnL >= 0 ? '+' : '';

  return (
    <MotionBox
      ref={containerRef}
      position="fixed"
      left={0}
      right={0}
      bottom={0}
      h={`calc(${FULL_HEIGHT_RATIO * 100}vh + ${BOTTOM_OFFSET}px)`}
      bg="rgba(15, 15, 15, 0.95)"
      backdropFilter="blur(20px)"
      borderTopRadius="2xl"
      zIndex={999}
      style={{ y }}
      initial={{ y: initialY }}
      drag="y"
      dragConstraints={{
        top: snaps.full,
        bottom: snaps.peek,
      }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      boxShadow="0 -4px 30px rgba(0, 0, 0, 0.5)"
      pb={`${BOTTOM_OFFSET}px`}
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Drag Handle + Peek Summary */}
      <Box
        flexShrink={0}
        pt={2}
        pb={2}
        px={4}
        cursor="grab"
        _active={{ cursor: 'grabbing' }}
        onClick={handleHandleTap}
      >
        {/* Visual drag handle */}
        <Flex justify="center" mb={2}>
          <Box w="36px" h="4px" borderRadius="full" bg="whiteAlpha.400" />
        </Flex>

        {/* Peek summary — always visible */}
        <Flex align="center" justify="space-between">
          <HStack spacing={3}>
            <Text fontSize="xs" color="whiteAlpha.600">
              {positionsCount} position{positionsCount !== 1 ? 's' : ''}
            </Text>
            <Text fontSize="xs" fontWeight="bold" color={pnlColor}>
              {pnlPrefix}${Math.abs(totalOpenPnL).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </HStack>
          <Text fontSize="xs" color="whiteAlpha.500">
            {accountsCount} account{accountsCount !== 1 ? 's' : ''}
          </Text>
        </Flex>
      </Box>

      {/* Tab bar + content — fades in as sheet opens */}
      <MotionBox
        flex="1"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        style={{ opacity: contentOpacity }}
      >
        {/* Tab Bar */}
        <Box px={3} pb={2} flexShrink={0} borderBottom="1px solid" borderColor="whiteAlpha.100">
          <ButtonGroup size="xs" isAttached variant="ghost" spacing={0} w="100%">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                onClick={(e) => {
                  e.stopPropagation();
                  onTabChange(tab.key);
                }}
                flex="1"
                bg={activeTab === tab.key ? 'whiteAlpha.200' : 'transparent'}
                color={activeTab === tab.key ? 'white' : 'whiteAlpha.600'}
                _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
                _active={{ bg: 'whiteAlpha.200' }}
                leftIcon={<tab.icon size={13} />}
                fontWeight={activeTab === tab.key ? 'semibold' : 'normal'}
                borderRadius="md"
                px={2}
                fontSize="xs"
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <Badge
                    ml={1}
                    fontSize="8px"
                    colorScheme="cyan"
                    variant="solid"
                    borderRadius="full"
                    px={1.5}
                    minW="16px"
                    textAlign="center"
                  >
                    {tab.count}
                  </Badge>
                )}
              </Button>
            ))}
          </ButtonGroup>
        </Box>

        {/* Scrollable content area */}
        <Box
          flex="1"
          overflowY="auto"
          overflowX="hidden"
          px={3}
          py={2}
          onPointerDownCapture={(e) => {
            // Prevent sheet drag when scrolling content
            if (containerRef.current) {
              const contentEl = e.currentTarget;
              if (contentEl.scrollHeight > contentEl.clientHeight) {
                e.stopPropagation();
              }
            }
          }}
        >
          {children}
        </Box>
      </MotionBox>
    </MotionBox>
  );
};

export default memo(MobileBottomSheet);
