import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  IconButton,
  HStack,
  Button,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { X, Download, Copy, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import ParticleBackground from '../../pages/Homepage/ParticleBackground';
import PnLShareCard from './PnLShareCard';

const FORMAT_DIMS = {
  square: { w: 1080, h: 1080 },
  landscape: { w: 1200, h: 675 },
  story: { w: 1080, h: 1920 },
};

const SWIPE_DISMISS_THRESHOLD = 120;

/**
 * PnLFullScreenView — immersive fullscreen overlay with live particle background.
 *
 * Renders the PnL card with a transparent background so the animated
 * particle constellation shows through, matching the homepage/auth vibe.
 *
 * Mobile enhancements:
 * - Swipe down to dismiss
 * - Safe area inset padding for notched devices
 * - Native share button via Web Share API
 */
const PnLFullScreenView = ({ isOpen, onClose, cardData, format = 'square', privacyMode = false, username = '' }) => {
  const toast = useToast();
  const exportCardRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [isExporting, setIsExporting] = useState(false);

  // Swipe-to-dismiss state
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartRef = useRef(null);

  // Calculate optimal scale to fit card in viewport
  useEffect(() => {
    if (!isOpen) return;

    const calcScale = () => {
      const dims = FORMAT_DIMS[format];
      const vw = window.innerWidth * 0.9;
      const vh = window.innerHeight * 0.7;
      const sx = vw / dims.w;
      const sy = vh / dims.h;
      setScale(Math.min(sx, sy, 1));
    };

    calcScale();
    window.addEventListener('resize', calcScale);
    return () => window.removeEventListener('resize', calcScale);
  }, [isOpen, format]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Swipe-to-dismiss handlers
  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStartRef.current === null) return;
    const dy = e.touches[0].clientY - touchStartRef.current;
    // Only allow downward dragging
    if (dy > 0) {
      setDragY(dy);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragY > SWIPE_DISMISS_THRESHOLD) {
      onClose();
    }
    setDragY(0);
    setIsDragging(false);
    touchStartRef.current = null;
  }, [dragY, onClose]);

  // Capture the hidden export card (with static background) for download
  const captureCard = useCallback(async () => {
    if (!exportCardRef.current) return null;
    return html2canvas(exportCardRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      width: exportCardRef.current.offsetWidth,
      height: exportCardRef.current.offsetHeight,
    });
  }, []);

  const handleDownload = useCallback(async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCard();
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `atomik-pnl-${format}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast({ title: 'Card downloaded!', status: 'success', duration: 2000 });
    } catch (err) {
      toast({ title: 'Export failed', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setIsExporting(false);
    }
  }, [captureCard, format, toast]);

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
            });
          } catch {
            toast({ title: 'Clipboard not supported', description: 'Downloading instead...', status: 'info', duration: 3000 });
            handleDownload();
          }
          setIsExporting(false);
        },
        'image/png'
      );
    } catch (err) {
      toast({ title: 'Copy failed', description: err.message, status: 'error', duration: 4000 });
      setIsExporting(false);
    }
  }, [captureCard, toast, handleDownload]);

  const handleNativeShare = useCallback(async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCard();
      if (!canvas) return;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], `atomik-pnl-${format}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Atomik P&L',
          text: 'Check out my trading performance on Atomik Trading!',
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast({ title: 'Share failed', description: err.message, status: 'error', duration: 4000 });
      }
    } finally {
      setIsExporting(false);
    }
  }, [captureCard, format, toast, handleDownload]);

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare;

  if (!isOpen || !cardData) return null;

  // Swipe visual feedback: translate + fade
  const swipeOpacity = isDragging ? Math.max(1 - dragY / 300, 0.3) : 1;
  const swipeTranslate = isDragging ? dragY : 0;

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={9999}
      bg="black"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Live particle background */}
      <ParticleBackground />

      {/* Subtle radial gradient overlay for depth */}
      <Box
        position="absolute"
        inset={0}
        background="radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)"
        pointerEvents="none"
      />

      {/* Close button — respects safe area */}
      <Tooltip label="Close (Esc)" placement="left" hasArrow>
        <IconButton
          icon={<X size={20} />}
          position="absolute"
          top={`calc(24px + env(safe-area-inset-top, 0px))`}
          right={6}
          zIndex={2}
          variant="ghost"
          color="whiteAlpha.700"
          _hover={{ color: 'white', bg: 'whiteAlpha.200' }}
          onClick={onClose}
          aria-label="Close fullscreen view"
          size="lg"
          borderRadius="full"
        />
      </Tooltip>

      {/* Swipe hint indicator */}
      <Box
        position="absolute"
        top={`calc(12px + env(safe-area-inset-top, 0px))`}
        left="50%"
        transform="translateX(-50%)"
        w="36px"
        h="4px"
        borderRadius="full"
        bg="whiteAlpha.300"
        zIndex={2}
        display={{ base: 'block', md: 'none' }}
      />

      {/* Card — transparent background, particles show through */}
      <Box
        position="relative"
        zIndex={1}
        transform={`scale(${scale}) translateY(${swipeTranslate}px)`}
        transformOrigin="center center"
        transition={isDragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease'}
        opacity={swipeOpacity}
      >
        <PnLShareCard
          data={cardData}
          format={format}
          privacyMode={privacyMode}
          transparentBg
          username={username}
        />
      </Box>

      {/* Action buttons at bottom — respects safe area */}
      <HStack
        position="absolute"
        bottom={`calc(32px + env(safe-area-inset-bottom, 0px))`}
        zIndex={2}
        spacing={3}
        bg="rgba(0, 0, 0, 0.4)"
        backdropFilter="blur(12px)"
        borderRadius="full"
        px={6}
        py={3}
        border="1px solid rgba(255, 255, 255, 0.1)"
      >
        {hasNativeShare && (
          <Tooltip label="Share to apps" placement="top" hasArrow>
            <Button
              leftIcon={<Share2 size={16} />}
              bg="#00C6E0"
              color="black"
              _hover={{ bg: '#00b0c8' }}
              onClick={handleNativeShare}
              isLoading={isExporting}
              size="sm"
              borderRadius="full"
            >
              Share
            </Button>
          </Tooltip>
        )}
        <Tooltip label="Download PNG" placement="top" hasArrow>
          <Button
            leftIcon={<Download size={16} />}
            bg={hasNativeShare ? 'transparent' : '#00C6E0'}
            color={hasNativeShare ? 'white' : 'black'}
            variant={hasNativeShare ? 'outline' : 'solid'}
            borderColor="whiteAlpha.300"
            _hover={{ bg: hasNativeShare ? 'whiteAlpha.100' : '#00b0c8' }}
            onClick={handleDownload}
            isLoading={isExporting}
            size="sm"
            borderRadius="full"
          >
            {hasNativeShare ? 'Save' : 'Download'}
          </Button>
        </Tooltip>
        {!hasNativeShare && (
          <Tooltip label="Copy to clipboard" placement="top" hasArrow>
            <Button
              leftIcon={<Copy size={16} />}
              variant="outline"
              borderColor="whiteAlpha.300"
              color="white"
              _hover={{ bg: 'whiteAlpha.100' }}
              onClick={handleCopy}
              isLoading={isExporting}
              size="sm"
              borderRadius="full"
            >
              Copy
            </Button>
          </Tooltip>
        )}
      </HStack>

      {/* Hidden export card — uses static PNG background for html2canvas capture */}
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
          format={format}
          privacyMode={privacyMode}
          username={username}
        />
      </Box>
    </Box>
  );
};

export default PnLFullScreenView;
