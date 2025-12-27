import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Divider,
  useClipboard,
  useToast,
  Tooltip,
  SimpleGrid,
  Link
} from '@chakra-ui/react';
import {
  Shield,
  Copy,
  Lock,
  Calendar,
  TrendingUp,
  Target,
  User,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

/**
 * StrategyDetailModal - Phase 2.3: Full verification and performance info
 * Shows when clicking a strategy card in marketplace or creator profile
 */
const StrategyDetailModal = ({
  isOpen,
  onClose,
  strategy,
  onSubscribe,
  isSubscribed = false,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const toast = useToast();

  // Extract trust metrics from strategy
  const {
    name,
    description,
    username,
    live_total_trades = 0,
    live_winning_trades = 0,
    live_total_pnl = 0,
    live_win_rate = 0,
    combined_hash = null,
    is_locked = false,
    locked_at = null,
    isMonetized = false
  } = strategy || {};

  const { onCopy, hasCopied } = useClipboard(combined_hash || '');

  const handleCopyHash = () => {
    if (combined_hash) {
      onCopy();
      toast({
        title: "Hash Copied",
        description: "Verification hash copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const truncateHash = (hash) => {
    if (!hash) return null;
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not locked';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewCreator = () => {
    onClose();
    navigate(`/creator/${username}`);
  };

  if (!strategy) return null;

  const hasPerformanceData = is_locked && live_total_trades > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
      <ModalContent
        bg="#121212"
        border="1px solid #333"
        borderRadius="xl"
        mx={4}
      >
        <ModalHeader pb={2}>
          <VStack align="start" spacing={1}>
            <HStack spacing={2}>
              <Text fontSize="xl" fontWeight="bold" color="white">
                {name}
              </Text>
              {is_locked && (
                <Tooltip label="Strategy code is locked and verified">
                  <Box color="green.400">
                    <Lock size={16} />
                  </Box>
                </Tooltip>
              )}
            </HStack>
            <HStack spacing={2}>
              <Text fontSize="sm" color="whiteAlpha.700">
                by
              </Text>
              <Link
                color="#00C6E0"
                fontSize="sm"
                fontWeight="medium"
                onClick={handleViewCreator}
                cursor="pointer"
                _hover={{ textDecoration: 'underline' }}
              >
                @{username}
              </Link>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton color="whiteAlpha.600" />

        <ModalBody pb={6}>
          <VStack spacing={5} align="stretch">
            {/* Description */}
            {description && (
              <Text color="whiteAlpha.800" fontSize="sm" lineHeight="1.6">
                {description}
              </Text>
            )}

            {/* Verified Performance Section */}
            {hasPerformanceData ? (
              <Box
                bg="rgba(16, 185, 129, 0.08)"
                border="1px solid rgba(16, 185, 129, 0.3)"
                borderRadius="lg"
                p={4}
              >
                <HStack spacing={2} mb={3}>
                  <Shield size={18} color="#10B981" />
                  <Text fontSize="sm" fontWeight="bold" color="#10B981">
                    Verified Live Performance
                  </Text>
                </HStack>

                <SimpleGrid columns={2} spacing={4} mb={4}>
                  <VStack spacing={0} align="start">
                    <Text fontSize="xs" color="whiteAlpha.600">Total Trades</Text>
                    <Text fontSize="lg" fontWeight="bold" color="white">
                      {live_total_trades}
                    </Text>
                  </VStack>
                  <VStack spacing={0} align="start">
                    <Text fontSize="xs" color="whiteAlpha.600">Winning Trades</Text>
                    <Text fontSize="lg" fontWeight="bold" color="white">
                      {live_winning_trades}
                    </Text>
                  </VStack>
                  <VStack spacing={0} align="start">
                    <Text fontSize="xs" color="whiteAlpha.600">Win Rate</Text>
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      color={live_win_rate >= 50 ? "#10B981" : "#EF4444"}
                    >
                      {live_win_rate.toFixed(1)}%
                    </Text>
                  </VStack>
                  <VStack spacing={0} align="start">
                    <Text fontSize="xs" color="whiteAlpha.600">Total PnL</Text>
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      color={live_total_pnl >= 0 ? "#10B981" : "#EF4444"}
                    >
                      {live_total_pnl >= 0 ? '+' : ''}{live_total_pnl.toFixed(2)}%
                    </Text>
                  </VStack>
                </SimpleGrid>

                {/* Verification Hash */}
                <Divider borderColor="whiteAlpha.200" mb={3} />
                <HStack justify="space-between" align="center">
                  <VStack spacing={0} align="start">
                    <Text fontSize="xs" color="whiteAlpha.600">Verification Hash</Text>
                    <Text fontSize="sm" color="whiteAlpha.800" fontFamily="mono">
                      {truncateHash(combined_hash)}
                    </Text>
                  </VStack>
                  <Tooltip label={hasCopied ? "Copied!" : "Copy full hash"}>
                    <Button
                      size="sm"
                      variant="ghost"
                      color="whiteAlpha.600"
                      _hover={{ color: "#10B981", bg: "rgba(16, 185, 129, 0.1)" }}
                      onClick={handleCopyHash}
                      leftIcon={<Copy size={14} />}
                    >
                      {hasCopied ? "Copied" : "Copy"}
                    </Button>
                  </Tooltip>
                </HStack>

                {/* Locked Date */}
                <HStack mt={3} spacing={2}>
                  <Calendar size={14} color="rgba(255,255,255,0.5)" />
                  <Text fontSize="xs" color="whiteAlpha.500">
                    Locked on {formatDate(locked_at)}
                  </Text>
                </HStack>
              </Box>
            ) : (
              <Box
                bg="rgba(255, 255, 255, 0.05)"
                border="1px solid rgba(255, 255, 255, 0.1)"
                borderRadius="lg"
                p={4}
              >
                <HStack spacing={2}>
                  <TrendingUp size={18} color="rgba(255,255,255,0.5)" />
                  <Text fontSize="sm" color="whiteAlpha.600">
                    {is_locked
                      ? "No live trades recorded yet"
                      : "Performance tracking begins after publishing"}
                  </Text>
                </HStack>
              </Box>
            )}

            {/* Creator Link */}
            <Box
              bg="rgba(0, 198, 224, 0.05)"
              border="1px solid rgba(0, 198, 224, 0.2)"
              borderRadius="lg"
              p={4}
              cursor="pointer"
              onClick={handleViewCreator}
              _hover={{ bg: "rgba(0, 198, 224, 0.1)" }}
              transition="all 0.2s"
            >
              <HStack justify="space-between">
                <HStack spacing={3}>
                  <User size={20} color="#00C6E0" />
                  <VStack spacing={0} align="start">
                    <Text fontSize="sm" fontWeight="medium" color="white">
                      View Creator Profile
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.600">
                      See all strategies and track record
                    </Text>
                  </VStack>
                </HStack>
                <ExternalLink size={16} color="#00C6E0" />
              </HStack>
            </Box>

            {/* Action Button */}
            <Button
              w="full"
              size="lg"
              bg={isSubscribed ? "transparent" : "#00C6E0"}
              color={isSubscribed ? "#00C6E0" : "white"}
              border={isSubscribed ? "1px solid #00C6E0" : "none"}
              _hover={{
                bg: isSubscribed ? "rgba(0, 198, 224, 0.1)" : "#00A3B8"
              }}
              onClick={onSubscribe}
              isLoading={isLoading}
              leftIcon={isSubscribed ? <CheckCircle2 size={18} /> : null}
            >
              {isSubscribed
                ? "Subscribed"
                : isMonetized
                  ? "View Pricing"
                  : "Subscribe Free"}
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default StrategyDetailModal;
