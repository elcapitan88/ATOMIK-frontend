import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Box, Flex, HStack, Text, Badge, ButtonGroup, Button, IconButton } from '@chakra-ui/react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Activity, FileText, Users, Wand2, XCircle, Share2 } from 'lucide-react';
import MobileFlattenSheet from './MobileFlattenSheet';

const MotionBox = motion.create(Box);

const PEEK_HEIGHT = 72;
const BOTTOM_NAV_HEIGHT = 64;
const ACTION_BAR_HEIGHT = 80;
const SHEET_BOTTOM = BOTTOM_NAV_HEIGHT + ACTION_BAR_HEIGHT; // 144px from viewport bottom

/**
 * MobileBottomSheet — draggable sheet with 3 snap points (peek / half / full).
 *
 * Positioned ABOVE the action bar and bottom nav. Uses translateY to slide up/down.
 * At peek: only the drag handle + summary line is visible (72px).
 * At half: ~40% of viewport.
 * At full: ~75% of viewport.
 */
const MobileBottomSheet = ({
  positionsCount = 0,
  ordersCount = 0,
  accountsCount = 0,
  totalOpenPnL = 0,
  activeTab,
  onTabChange,
  positions = [],
  orders = [],
  onSharePnL,
  children,
}) => {
  const containerRef = useRef(null);
  const [snapState, setSnapState] = useState('peek');
  const [sheetMaxH, setSheetMaxH] = useState(600);
  const [isFlattenOpen, setIsFlattenOpen] = useState(false);
  const y = useMotionValue(0);

  // Calculate snap positions relative to sheet top.
  // y=0 means sheet is fully expanded (top of sheet at its highest).
  // Positive y pushes it down (less visible).
  const getSnapValues = useCallback(() => {
    const vh = window.innerHeight;
    const maxSheetH = vh - SHEET_BOTTOM - 40; // leave 40px gap at top
    const halfH = vh * 0.40;
    return {
      full: 0,                          // sheet at max height
      half: maxSheetH - halfH,          // sheet shows ~40vh
      peek: maxSheetH - PEEK_HEIGHT,    // sheet shows only peek bar
      maxH: maxSheetH,
    };
  }, []);

  // Set initial max height
  useEffect(() => {
    const vals = getSnapValues();
    setSheetMaxH(vals.maxH);
    y.set(vals.peek); // start at peek
  }, [getSnapValues, y]);

  const snapTo = useCallback(
    (target) => {
      const vals = getSnapValues();
      setSnapState(target);
      animate(y, vals[target], {
        type: 'spring',
        damping: 30,
        stiffness: 300,
      });
    },
    [y, getSnapValues]
  );

  const handleDragEnd = useCallback(
    (_, info) => {
      const velocity = info.velocity.y;
      const currentY = y.get();
      const vals = getSnapValues();

      // Fast fling
      if (Math.abs(velocity) > 500) {
        if (velocity < 0) {
          // Swiping up
          if (snapState === 'peek') snapTo('half');
          else snapTo('full');
        } else {
          // Swiping down
          if (snapState === 'full') snapTo('half');
          else snapTo('peek');
        }
        return;
      }

      // Slow drag — snap to nearest
      const distances = {
        peek: Math.abs(currentY - vals.peek),
        half: Math.abs(currentY - vals.half),
        full: Math.abs(currentY - vals.full),
      };
      const nearest = Object.entries(distances).reduce((a, b) =>
        a[1] < b[1] ? a : b
      )[0];
      snapTo(nearest);
    },
    [y, snapState, snapTo, getSnapValues]
  );

  const handleHandleTap = useCallback(() => {
    if (snapState === 'peek') snapTo('half');
    else if (snapState === 'half') snapTo('full');
    else snapTo('peek');
  }, [snapState, snapTo]);

  // Fade tab content in as sheet opens (invisible at peek)
  const vals = getSnapValues();
  const contentOpacity = useTransform(
    y,
    [vals.full, vals.half, vals.peek],
    [1, 1, 0]
  );

  const hasItemsToFlatten = positionsCount > 0 || ordersCount > 0;

  const tabs = [
    { key: 'positions', label: 'Positions', icon: Activity, count: positionsCount },
    { key: 'orders', label: 'Orders', icon: FileText, count: ordersCount },
    { key: 'accounts', label: 'Accounts', icon: Users, count: accountsCount },
    { key: 'strategies', label: 'Strategies', icon: Wand2 },
  ];

  const pnlColor = totalOpenPnL >= 0 ? 'green.400' : 'red.400';
  const pnlPrefix = totalOpenPnL >= 0 ? '+' : '';

  return (
    <>
      <MotionBox
        ref={containerRef}
        position="fixed"
        left={0}
        right={0}
        bottom={`${SHEET_BOTTOM}px`}
        h={`${sheetMaxH}px`}
        bg="rgba(15, 15, 15, 0.95)"
        backdropFilter="blur(20px)"
        borderTopRadius="2xl"
        zIndex={997}
        style={{ y }}
        drag="y"
        dragConstraints={{
          top: vals.full,
          bottom: vals.peek,
        }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        boxShadow="0 -4px 30px rgba(0, 0, 0, 0.5)"
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

          {/* Peek summary */}
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

            <HStack spacing={2}>
              {/* Flatten/Cancel button — only when positions or orders exist */}
              {hasItemsToFlatten && (
                <IconButton
                  icon={<XCircle size={18} />}
                  size="xs"
                  variant="ghost"
                  color="red.400"
                  aria-label="Flatten & Cancel"
                  _hover={{ bg: 'rgba(239, 83, 80, 0.15)', color: 'red.300' }}
                  _active={{ bg: 'rgba(239, 83, 80, 0.25)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlattenOpen(true);
                  }}
                  borderRadius="md"
                  minW="32px"
                  h="32px"
                />
              )}

              {/* Share P&L button — visible when sheet is not at peek */}
              {onSharePnL && (
                <IconButton
                  icon={<Share2 size={16} />}
                  size="xs"
                  variant="ghost"
                  color="whiteAlpha.500"
                  aria-label="Share P&L"
                  _hover={{ bg: 'whiteAlpha.100', color: 'cyan.400' }}
                  _active={{ bg: 'whiteAlpha.200' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSharePnL();
                  }}
                  borderRadius="md"
                  minW="32px"
                  h="32px"
                />
              )}

              <Text fontSize="xs" color="whiteAlpha.500">
                {accountsCount} acct{accountsCount !== 1 ? 's' : ''}
              </Text>
            </HStack>
          </Flex>
        </Box>

        {/* Tab bar + content */}
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

          {/* Scrollable content */}
          <Box
            flex="1"
            overflowY="auto"
            overflowX="hidden"
            px={3}
            py={2}
            sx={{
              WebkitOverflowScrolling: 'touch',
            }}
            onPointerDownCapture={(e) => {
              const contentEl = e.currentTarget;
              if (contentEl.scrollHeight > contentEl.clientHeight) {
                e.stopPropagation();
              }
            }}
          >
            {children}
          </Box>
        </MotionBox>
      </MotionBox>

      {/* Flatten/Cancel Action Sheet */}
      <MobileFlattenSheet
        isOpen={isFlattenOpen}
        onClose={() => setIsFlattenOpen(false)}
        positions={positions}
        orders={orders}
      />
    </>
  );
};

export default memo(MobileBottomSheet);
