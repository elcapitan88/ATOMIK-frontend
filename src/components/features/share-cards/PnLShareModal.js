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
  Spinner,
  useToast,
  Switch,
  Flex,
  Box,
  Icon,
  Tooltip,
  useBreakpointValue,
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

const FORMAT_DIMS = {
  square: { w: 1080, h: 1080 },
  landscape: { w: 1200, h: 675 },
  story: { w: 1080, h: 1920 },
};

/** Detect if Web Share API supports file sharing */
const canNativeShare = () => {
  try {
    return !!navigator.share && !!navigator.canShare;
  } catch {
    return false;
  }
};

/** Calculate preview scale dynamically based on container width */
const calcPreviewScale = (format, containerWidth) => {
  if (!containerWidth) return 0.35;
  const dims = FORMAT_DIMS[format];
  // Leave 32px padding on each side
  const available = containerWidth - 32;
  return Math.min(available / dims.w, 0.45);
};

const PnLShareModal = ({ isOpen, onClose }) => {
  const toast = useToast();
  const { user } = useAuth();
  const username = user?.username || user?.email?.split('@')[0] || '';
  const cardRef = useRef(null);
  const exportCardRef = useRef(null);
  const previewContainerRef = useRef(null);
  const { cardData, isLoading, error, fetchCardData } = useShareCard();

  const isMobile = useBreakpointValue({ base: true, md: false });

  // Default to 'story' on mobile, 'square' on desktop
  const [selectedFormat, setSelectedFormat] = useState('square');
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.35);

  // Set default format based on device when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFormat(isMobile ? 'story' : 'square');
    }
  }, [isOpen, isMobile]);

  // Fetch data when modal opens or period changes
  useEffect(() => {
    if (isOpen) {
      fetchCardData(selectedPeriod);
    }
  }, [isOpen, selectedPeriod, fetchCardData]);

  // Dynamically calculate preview scale from container width
  useEffect(() => {
    if (!isOpen) return;

    const updateScale = () => {
      const el = previewContainerRef.current;
      if (el) {
        setPreviewScale(calcPreviewScale(selectedFormat, el.clientWidth));
      }
    };

    // Run after a frame so the DOM is measured
    const raf = requestAnimationFrame(updateScale);
    window.addEventListener('resize', updateScale);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateScale);
    };
  }, [isOpen, selectedFormat]);

  // Compute preview height from scale + format dimensions
  const previewHeight = FORMAT_DIMS[selectedFormat].h * previewScale + 32;

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

  // Native share (mobile) — uses Web Share API with file
  const handleNativeShare = useCallback(async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCard();
      if (!canvas) return;

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], `atomik-pnl-${selectedFormat}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Atomik P&L',
          text: 'Check out my trading performance on Atomik Trading!',
        });
        toast({ title: 'Shared!', status: 'success', duration: 2000 });
      } else {
        // Fallback to download if file sharing not supported
        handleDownload();
      }
    } catch (err) {
      // User cancelled share — not an error
      if (err.name !== 'AbortError') {
        toast({
          title: 'Share failed',
          description: err.message,
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } finally {
      setIsExporting(false);
    }
  }, [captureCard, selectedFormat, toast, handleDownload]);

  // Mobile layout — bottom-sheet style
  const modalProps = isMobile
    ? {
        motionPreset: 'slideInBottom',
        size: 'full',
      }
    : {
        size: '2xl',
      };

  const contentProps = isMobile
    ? {
        borderRadius: '2xl 2xl 0 0',
        borderBottomRadius: 0,
        position: 'fixed',
        bottom: 0,
        mb: 0,
        maxH: '92vh',
        maxW: '100vw',
      }
    : {
        borderRadius: 'xl',
        maxW: '680px',
      };

  return (
    <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside" {...modalProps}>
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(10px)" />
      <ModalContent
        bg="rgba(0, 0, 0, 0.75)"
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.5)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        color="white"
        {...contentProps}
      >
        {/* Drag indicator for mobile */}
        {isMobile && (
          <Flex justify="center" pt={2} pb={0}>
            <Box w="36px" h="4px" borderRadius="full" bg="whiteAlpha.400" />
          </Flex>
        )}

        <ModalHeader
          borderBottom="1px solid rgba(255, 255, 255, 0.1)"
          pb={isMobile ? 3 : 4}
          pt={isMobile ? 2 : 4}
          px={isMobile ? 4 : 6}
        >
          <HStack spacing={3}>
            <Icon as={Share2} boxSize="20px" color="#00C6E0" />
            <Text fontSize={isMobile ? 'md' : 'lg'} fontWeight={600}>
              Share Your P&L
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="white" _hover={{ bg: 'whiteAlpha.200' }} />

        <ModalBody
          py={isMobile ? 4 : 6}
          px={isMobile ? 3 : 6}
          pb={isMobile ? `calc(16px + env(safe-area-inset-bottom, 0px))` : 6}
        >
          <VStack spacing={isMobile ? 4 : 5}>
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
                  flex={isMobile ? 1 : undefined}
                  h={isMobile ? '40px' : undefined}
                >
                  {p.label}
                </Button>
              ))}
            </HStack>

            {/* Format Selector */}
            <HStack spacing={2} w="full" justify="center">
              {FORMATS.map((f) => {
                const btn = (
                  <Button
                    key={f.value}
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
                    flex={isMobile ? 1 : undefined}
                    h={isMobile ? '40px' : undefined}
                  >
                    {f.label}
                  </Button>
                );
                // Skip Tooltip on mobile (tooltips don't work well with touch)
                return isMobile ? (
                  <React.Fragment key={f.value}>{btn}</React.Fragment>
                ) : (
                  <Tooltip key={f.value} label={f.desc} placement="top" hasArrow>
                    {btn}
                  </Tooltip>
                );
              })}
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
              ref={previewContainerRef}
              w="full"
              overflow="hidden"
              bg="rgba(0,0,0,0.3)"
              borderRadius="lg"
              border="1px solid rgba(255,255,255,0.06)"
              display="flex"
              justifyContent="center"
              alignItems="flex-start"
              p={4}
              minH={isMobile ? '200px' : '300px'}
              h={`${previewHeight}px`}
              maxH={isMobile ? '50vh' : undefined}
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
                  transform={`scale(${previewScale})`}
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
            {isMobile ? (
              <VStack spacing={2} w="full" pt={1}>
                {/* Primary: Native Share on mobile (if supported) */}
                {canNativeShare() && (
                  <Button
                    leftIcon={<Share2 size={16} />}
                    bg="#00C6E0"
                    color="black"
                    _hover={{ bg: '#00b0c8' }}
                    _active={{ bg: '#0099aa' }}
                    onClick={handleNativeShare}
                    isLoading={isExporting}
                    isDisabled={!cardData || isLoading}
                    size="lg"
                    w="full"
                    borderRadius="xl"
                    h="48px"
                  >
                    Share
                  </Button>
                )}
                <HStack spacing={2} w="full">
                  <Button
                    leftIcon={<Download size={16} />}
                    bg={canNativeShare() ? 'transparent' : '#00C6E0'}
                    color={canNativeShare() ? 'white' : 'black'}
                    variant={canNativeShare() ? 'outline' : 'solid'}
                    borderColor="whiteAlpha.300"
                    _hover={{ bg: canNativeShare() ? 'whiteAlpha.100' : '#00b0c8' }}
                    onClick={handleDownload}
                    isLoading={isExporting}
                    isDisabled={!cardData || isLoading}
                    size="md"
                    flex={1}
                    borderRadius="xl"
                    h="44px"
                  >
                    Save
                  </Button>
                  <Button
                    leftIcon={<Maximize2 size={16} />}
                    variant="outline"
                    borderColor="cyan.700"
                    color="#00C6E0"
                    _hover={{ bg: 'rgba(0, 198, 224, 0.1)', borderColor: '#00C6E0' }}
                    onClick={() => setShowFullScreen(true)}
                    isDisabled={!cardData || isLoading}
                    size="md"
                    flex={1}
                    borderRadius="xl"
                    h="44px"
                  >
                    View
                  </Button>
                </HStack>
              </VStack>
            ) : (
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
            )}
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
