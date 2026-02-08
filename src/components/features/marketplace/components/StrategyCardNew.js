import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Tooltip,
  Button,
  useToast,
  useClipboard,
} from '@chakra-ui/react';
import { Users, Lock, CheckCircle2, TrendingUp, TrendingDown, Hash, Copy, Check } from 'lucide-react';
import { webhookApi } from '@/services/api/Webhooks/webhookApi';
import { engineStrategiesApi } from '@/services/api/strategies/engineStrategiesApi';
import StarRating from '../StarRating';
import StrategyPurchaseModal from './StrategyPurchaseModal';

const StrategyCard = ({ strategy, onSubscriptionChange, isMobile = false, isGuest = false }) => {
  const {
    token,
    source_id,
    name,
    description,
    username,
    strategyType,
    rating = 0,
    subscriberCount = 0,
    isPublic,
    isSubscribed = false,
    isMonetized = false,
    usageIntent = 'personal',
    marketplacePurchaseUrl,
    pricingEndpoint,
    live_total_trades = 0,
    live_winning_trades = 0,
    live_total_pnl = 0,
    live_win_rate = 0,
    combined_hash = null,
    is_locked = false,
    locked_at = null
  } = strategy;

  const isBreakNEnter = token === 'OGgxOp0wOd60YGb4kc4CEh8oSz2ZCscKVVZtfwbCbHg';
  const isStrategyMonetized = isMonetized || usageIntent === 'monetize' || isBreakNEnter;
  const hasPerformanceData = live_total_trades > 0;
  const shortHash = combined_hash ? combined_hash.substring(0, 8) : null;
  const { hasCopied, onCopy } = useClipboard(combined_hash || '');

  const [currentRating, setCurrentRating] = useState(rating);
  const [isLoading, setIsLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(isSubscribed);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [pricing, setPricing] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  const handleCopyHash = (e) => {
    e.stopPropagation();
    onCopy();
    toast({ title: 'Hash Copied', description: 'Verification hash copied to clipboard', status: 'success', duration: 2000, isClosable: true });
  };

  return (
    <Box bg="rgba(255, 255, 255, 0.1)" backdropFilter="blur(10px)" borderWidth="1px" borderColor={subscribed ? "rgba(0, 198, 224, 0.6)" : "whiteAlpha.200"} borderRadius="lg" overflow="hidden" transition="all 0.2s" _hover={{ transform: isMobile ? 'none' : 'translateY(-2px)', borderColor: "rgba(0, 198, 224, 0.6)", boxShadow: isMobile ? "none" : "0 4px 12px rgba(0, 198, 224, 0.15)" }} w={isMobile ? "320px" : "280px"} maxW={isMobile ? "calc(100% - 16px)" : "280px"} h={isMobile ? "auto" : "auto"} minH={isMobile ? "160px" : "280px"}>
      <VStack p={isMobile ? 3 : 4} spacing={isMobile ? 2 : 2} align="stretch" h="full">
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={0} flex={1}>
            <HStack align="center" spacing={2}>
              <Text fontSize="md" fontWeight="bold" color="white" noOfLines={1}>{name}</Text>
              {is_locked && <Tooltip label="Verified & Locked" hasArrow><Box as="span" color="rgba(0, 198, 224, 0.9)"><Icon as={Lock} boxSize={3} /></Box></Tooltip>}
            </HStack>
            <Text fontSize="sm" color="whiteAlpha.700">by {username}</Text>
          </VStack>
          {isStrategyMonetized ? (
            <Box bg="rgba(255, 193, 7, 0.15)" backdropFilter="blur(10px)" border="1px solid rgba(255, 193, 7, 0.4)" borderRadius="full" px={3} py={0.5}><Text fontSize="0.65rem" fontWeight="bold" color="rgba(255, 193, 7, 1)" textTransform="uppercase" letterSpacing="0.5px">Premium</Text></Box>
          ) : (
            <Box bg="rgba(16, 185, 129, 0.15)" backdropFilter="blur(10px)" border="1px solid rgba(16, 185, 129, 0.4)" borderRadius="full" px={3} py={0.5}><Text fontSize="0.65rem" fontWeight="bold" color="rgba(16, 185, 129, 1)" textTransform="uppercase" letterSpacing="0.5px">Free</Text></Box>
          )}
        </HStack>
        <Text fontSize={isMobile ? "xs" : "sm"} color="whiteAlpha.800" noOfLines={isMobile ? 2 : 2}>{description}</Text>
        {hasPerformanceData && (
          <HStack spacing={3} color="whiteAlpha.800" fontSize="xs">
            <HStack spacing={1}><Icon as={live_total_pnl >= 0 ? TrendingUp : TrendingDown} boxSize={3} color={live_total_pnl >= 0 ? "green.400" : "red.400"} /><Text>{live_total_trades} trades</Text></HStack>
            <Text color={live_win_rate >= 50 ? "green.400" : "orange.400"}>{live_win_rate.toFixed(0)}% win</Text>
            <Text color={live_total_pnl >= 0 ? "green.400" : "red.400"} fontWeight="medium">{live_total_pnl >= 0 ? '+' : ''}{live_total_pnl.toFixed(0)}</Text>
          </HStack>
        )}
        {shortHash && (
          <Tooltip label={+combined_hash} hasArrow>
            <HStack spacing={1} color="whiteAlpha.600" fontSize="xs" cursor="pointer" onClick={handleCopyHash} _hover={{ color: "whiteAlpha.900" }} transition="color 0.2s">
              <Icon as={Hash} boxSize={3} /><Text fontFamily="mono">{shortHash}</Text><Icon as={hasCopied ? Check : Copy} boxSize={3} color={hasCopied ? "green.400" : "inherit"} />
            </HStack>
          </Tooltip>
        )}
        <HStack justify="space-between" align="center">
          <StarRating rating={currentRating} sourceId={source_id || token} onRatingChange={(r) => setCurrentRating(r)} isInteractive={subscribed} />
          <HStack spacing={1} color="whiteAlpha.800"><Icon as={Users} boxSize={3.5} /><Text fontSize="sm">{subscriberCount.toLocaleString()}</Text></HStack>
        </HStack>
        <Button onClick={() => console.log('subscribe')} isLoading={isLoading} variant="outline" size={isMobile ? "md" : "sm"} w="full" minH="44px" colorScheme={subscribed ? "blue" : "gray"} borderColor={subscribed ? "rgba(0, 198, 224, 0.6)" : "whiteAlpha.200"} color={subscribed ? "rgba(0, 198, 224, 0.9)" : "white"} _hover={{ bg: subscribed ? "rgba(0, 198, 224, 0.1)" : "whiteAlpha.100", borderColor: "rgba(0, 198, 224, 0.6)" }} leftIcon={subscribed ? <CheckCircle2 size={isMobile ? 18 : 16} /> : null} fontSize={isMobile ? "sm" : "xs"}>{subscribed ? "Subscribed" : isStrategyMonetized ? "View Pricing" : "Subscribe Free"}</Button>
      </VStack>
    </Box>
  );
};

export default StrategyCard;
