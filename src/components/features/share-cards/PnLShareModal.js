import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Spinner,
  useToast,
  Switch,
  Flex,
  Box,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import {
  Download,
  Share2,
  Copy,
  Image,
  Monitor,
  Smartphone,
  Eye,
  EyeOff,
  Maximize2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import PnLShareCard from './PnLShareCard';
import PnLFullScreenView from './PnLFullScreenView';
import useShareCard from '@/hooks/useShareCard';
import { useAuth } from '@/contexts/AuthContext';

const PERIODS = [
  { label: 'Today', value: 1 },
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
];

const FORMATS = [
  { label: 'Square', value: 'square', icon: Image, desc: 'Instagram (1080x1080)' },
  { label: 'Landscape', value: 'landscape', icon: Monitor, desc: 'Twitter / Discord (1200x675)' },
  { label: 'Story', value: 'story', icon: Smartphone, desc: 'IG Stories (1080x1920)' },
];

// Preview scale factors to fit inside the modal
const PREVIEW_SCALES = {
  square: 0.38,
  landscape: 0.45,
  story: 0.25,
};

// Approximate preview heights so the modal doesn't jump around
const PREVIEW_HEIGHTS = {
  square: '420px',
  landscape: '315px',
  story: '490px',
};

const PnLShareModal = ({ isOpen, onClose }) => {
  const toast = useToast();
  const { user } = useAuth();
  const username = user?.username || user?.email?.split('@')[0] || '';
  const cardRef = useRef(null);
  const exportCardRef = useRef(null);
  const { cardData, isLoading, error, fetchCardData } = useShareCard();

  const [selectedFormat, setSelectedFormat] = useState('square');
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  // Fetch data when modal opens or period changes
  useEffect(() => {
    if (isOpen) {
      fetchCardData(selectedPeriod);
    }
  }, [isOpen, selectedPeriod, fetchCardData]);

  // Capture the hidden full-size card (not the scaled preview)
  const captureCard = useCallback(async () => {
    if (!exportCardRef.current) return null;

    const canvas = await html2canvas(exportCardRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      width: exportCardRef.current.offsetWidth,
      height: exportCardRef.current.offsetHeight,
    });

    return canvas;
  }, []);

  // Download as PNG
  const handleDownload = useCallback(async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCard();
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = `atomik-pnl-${selectedFormat}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: 'Card downloaded!',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Export failed',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  }, [captureCard, selectedFormat, toast]);

  // Copy image to clipboard
  const handleCopy = useCallback(async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCard();
      if (!canvas) return;

      canvas.toBlob(
        async (blob) => {
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            toast({
              title: 'Copied to clipboard!',
              description: 'Paste directly into Discord, Telegram, etc.',
              status: 'success',
              duration: 2500,
              isClosable: true,
            });
          } catch {
            // Clipboard API not supported - fallback to download
            toast({
              title: 'Clipboard not supported',
              description: 'Downloading instead...',
              status: 'info',
              duration: 3000,
              isClosable: true,
            });
            handleDownload();
          }
          setIsExporting(false);
        },
        'image/png'
      );
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      setIsExporting(false);
    }
  }, [captureCard, toast, handleDownload]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(10px)" />
      <ModalContent
        bg="rgba(0, 0, 0, 0.75)"
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.5)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        borderRadius="xl"
        color="white"
        maxW="680px"
      >
        <ModalHeader borderBottom="1px solid rgba(255, 255, 255, 0.1)" pb={4}>
          <HStack spacing={3}>
            <Icon as={Share2} boxSize="20px" color="#00C6E0" />
            <Text fontSize="lg" fontWeight={600}>
              Share Your P&L
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="white" _hover={{ bg: 'whiteAlpha.200' }} />

        <ModalBody py={6}>
          <VStack spacing={5}>
            {/* Period Selector */}
            <HStack spacing={2} w="full" justify="center">
              {PERIODS.map((p) => (
                <Button
                  key={p.value}
                  size="sm"
                  variant={selectedPeriod === p.value ? 'solid' : 'outline'}
                  bg={selectedPeriod === p.value ? '#00C6E0' : 'transparent'}
                  color={selectedPeriod === p.value ? 'black' : 'white'}
                  borderColor="whiteAlpha.300"
                  _hover={{
                    bg: selectedPeriod === p.value ? '#00b0c8' : 'whiteAlpha.100',
                  }}
                  onClick={() => setSelectedPeriod(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </HStack>

            {/* Format Selector */}
            <HStack spacing={2} w="full" justify="center">
              {FORMATS.map((f) => (
                <Tooltip key={f.value} label={f.desc} placement="top" hasArrow>
                  <Button
                    size="sm"
                    variant={selectedFormat === f.value ? 'solid' : 'outline'}
                    bg={selectedFormat === f.value ? '#00C6E0' : 'transparent'}
                    color={selectedFormat === f.value ? 'black' : 'white'}
                    borderColor="whiteAlpha.300"
                    _hover={{
                      bg: selectedFormat === f.value ? '#00b0c8' : 'whiteAlpha.100',
                    }}
                    leftIcon={<f.icon size={14} />}
                    onClick={() => setSelectedFormat(f.value)}
                  >
                    {f.label}
                  </Button>
                </Tooltip>
              ))}
            </HStack>

            {/* Privacy Toggle */}
            <Flex w="full" justify="space-between" align="center" px={2}>
              <HStack spacing={2}>
                <Icon
                  as={privacyMode ? EyeOff : Eye}
                  boxSize="14px"
                  color="whiteAlpha.600"
                />
                <Text fontSize="sm" color="whiteAlpha.700">
                  Hide dollar amounts
                </Text>
              </HStack>
              <Switch
                isChecked={privacyMode}
                onChange={(e) => setPrivacyMode(e.target.checked)}
                colorScheme="cyan"
                size="sm"
              />
            </Flex>

            {/* Card Preview */}
            <Box
              w="full"
              overflow="hidden"
              bg="rgba(0,0,0,0.3)"
              borderRadius="lg"
              border="1px solid rgba(255,255,255,0.06)"
              display="flex"
              justifyContent="center"
              alignItems="flex-start"
              p={4}
              minH="300px"
              h={PREVIEW_HEIGHTS[selectedFormat]}
            >
              {isLoading ? (
                <Flex h="full" w="full" align="center" justify="center">
                  <VStack spacing={3}>
                    <Spinner size="lg" color="cyan.400" thickness="3px" />
                    <Text fontSize="sm" color="whiteAlpha.500">
                      Loading performance data...
                    </Text>
                  </VStack>
                </Flex>
              ) : error ? (
                <Flex h="full" w="full" align="center" justify="center">
                  <Text color="red.300" fontSize="sm">
                    Failed to load data. Please try again.
                  </Text>
                </Flex>
              ) : cardData ? (
                <Box
                  transform={`scale(${PREVIEW_SCALES[selectedFormat]})`}
                  transformOrigin="top center"
                >
                  <PnLShareCard
                    ref={cardRef}
                    data={cardData}
                    format={selectedFormat}
                    privacyMode={privacyMode}
                    username={username}
                  />
                </Box>
              ) : (
                <Flex h="full" w="full" align="center" justify="center">
                  <Text color="whiteAlpha.500" fontSize="sm">
                    No trade data for this period
                  </Text>
                </Flex>
              )}
            </Box>

            {/* Action Buttons */}
            <HStack spacing={3} w="full" justify="center" pt={1}>
              <Tooltip label="Immersive fullscreen with live particles" placement="top" hasArrow>
                <Button
                  leftIcon={<Maximize2 size={16} />}
                  variant="outline"
                  borderColor="cyan.700"
                  color="#00C6E0"
                  _hover={{ bg: 'rgba(0, 198, 224, 0.1)', borderColor: '#00C6E0' }}
                  onClick={() => setShowFullScreen(true)}
                  isDisabled={!cardData || isLoading}
                  size="md"
                >
                  View
                </Button>
              </Tooltip>
              <Button
                leftIcon={<Download size={16} />}
                bg="#00C6E0"
                color="black"
                _hover={{ bg: '#00b0c8' }}
                onClick={handleDownload}
                isLoading={isExporting}
                isDisabled={!cardData || isLoading}
                size="md"
              >
                Download
              </Button>
              <Button
                leftIcon={<Copy size={16} />}
                variant="outline"
                borderColor="whiteAlpha.300"
                color="white"
                _hover={{ bg: 'whiteAlpha.100' }}
                onClick={handleCopy}
                isLoading={isExporting}
                isDisabled={!cardData || isLoading}
                size="md"
              >
                Copy
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>

      {/* Hidden full-size card for export (not affected by preview scaling) */}
      {cardData && (
        <Box
          position="fixed"
          left="-9999px"
          top="-9999px"
          pointerEvents="none"
          aria-hidden="true"
        >
          <PnLShareCard
            ref={exportCardRef}
            data={cardData}
            format={selectedFormat}
            privacyMode={privacyMode}
            username={username}
          />
        </Box>
      )}

      {/* Fullscreen View with live particle background */}
      <PnLFullScreenView
        isOpen={showFullScreen}
        onClose={() => setShowFullScreen(false)}
        cardData={cardData}
        format={selectedFormat}
        privacyMode={privacyMode}
        username={username}
      />
    </Modal>
  );
};

export default PnLShareModal;
