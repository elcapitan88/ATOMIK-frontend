import React from 'react';
import {
  HStack,
  Text,
  IconButton,
  Tooltip,
  Box
} from '@chakra-ui/react';
import { Youtube, Instagram, MessageCircle, ExternalLink } from 'lucide-react';

// Custom X (formerly Twitter) icon component
const XIcon = ({ size = 20, ...props }) => (
  <Box
    as="svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    color="currentColor"
    fill="currentColor"
    {...props}
  >
    <path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
    />
  </Box>
);

// Custom TikTok icon component
const TikTokIcon = ({ size = 20, ...props }) => (
  <Box
    as="svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    color="currentColor"
    fill="currentColor"
    {...props}
  >
    <path
      d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64c0 3.33 2.76 5.7 5.69 5.7c3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"
    />
  </Box>
);

const SocialLinks = ({ socialMedia }) => {
  const socialPlatforms = [
    {
      key: 'x_handle',
      icon: XIcon,
      label: 'X (Twitter)',
      baseUrl: 'https://x.com/',
      color: '#1DA1F2'
    },
    {
      key: 'tiktok_handle',
      icon: TikTokIcon,
      label: 'TikTok',
      baseUrl: 'https://tiktok.com/@',
      color: '#ff0050'
    },
    {
      key: 'instagram_handle',
      icon: Instagram,
      label: 'Instagram',
      baseUrl: 'https://instagram.com/',
      color: '#E4405F'
    },
    {
      key: 'youtube_handle',
      icon: Youtube,
      label: 'YouTube',
      baseUrl: 'https://youtube.com/c/',
      color: '#FF0000'
    },
    {
      key: 'discord_handle',
      icon: MessageCircle,
      label: 'Discord',
      baseUrl: 'https://discord.com/users/',
      color: '#5865F2'
    }
  ];

  // Filter to only show platforms that have handles
  const availablePlatforms = socialPlatforms.filter(
    platform => socialMedia[platform.key] && socialMedia[platform.key].trim()
  );

  if (availablePlatforms.length === 0) {
    return null;
  }

  const formatHandle = (handle, platform) => {
    if (!handle) return '';

    // Remove @ symbol if present
    let cleanHandle = handle.replace(/^@/, '');

    // For YouTube, handle both channel names and URLs
    if (platform.key === 'youtube_handle') {
      if (cleanHandle.includes('youtube.com')) {
        return cleanHandle; // Return as-is if it's already a URL
      }
    }

    return cleanHandle;
  };

  const openSocialLink = (platform, handle) => {
    const cleanHandle = formatHandle(handle, platform);
    let url;

    if (platform.key === 'youtube_handle' && cleanHandle.includes('youtube.com')) {
      url = cleanHandle;
    } else {
      url = `${platform.baseUrl}${cleanHandle}`;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box>
      <Text fontSize="lg" fontWeight="semibold" color="white" mb={4}>
        Connect with me
      </Text>

      <HStack spacing={4} wrap="wrap">
        {availablePlatforms.map((platform) => {
          const handle = socialMedia[platform.key];
          const IconComponent = platform.icon;

          return (
            <Tooltip
              key={platform.key}
              label={`Follow on ${platform.label}`}
              placement="top"
            >
              <IconButton
                aria-label={`Visit ${platform.label} profile`}
                icon={<IconComponent size={20} />}
                variant="ghost"
                size="lg"
                color="whiteAlpha.700"
                _hover={{
                  color: platform.color,
                  bg: "rgba(255, 255, 255, 0.1)",
                  transform: "translateY(-2px)"
                }}
                _active={{
                  transform: "translateY(0)"
                }}
                transition="all 0.2s"
                onClick={() => openSocialLink(platform, handle)}
              />
            </Tooltip>
          );
        })}
      </HStack>

      <Text fontSize="xs" color="whiteAlpha.500" mt={3}>
        Follow for trading insights, market updates, and strategy discussions
      </Text>
    </Box>
  );
};

export default SocialLinks;