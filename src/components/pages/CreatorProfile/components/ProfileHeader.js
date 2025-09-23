import React from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Tooltip,
  Avatar,
  SimpleGrid,
  IconButton,
  Link
} from '@chakra-ui/react';
import { CheckCircle, User, Users, Target, Calendar, TrendingUp, Bell, Youtube, Instagram, MessageCircle, ExternalLink } from 'lucide-react';
import { ProfilePicture } from '@/components/common/ProfilePicture';

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

const ProfileHeader = ({
  profile,
  isOwnProfile,
  isFollowing,
  onFollow,
  isFollowLoading,
  isLoggedIn = true,
  followerCount = 0,
  strategyCount = 0,
  totalSubscribers = 0,
  memberSince
}) => {

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
      const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));

      if (diffYears >= 1) {
        return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
      } else if (diffMonths >= 1) {
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
      } else {
        return 'Less than a month ago';
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  const StatItem = ({ icon: Icon, label, value, color = "#00C6E0" }) => (
    <VStack spacing={1} align="center" textAlign="center" minW="80px">
      <Icon size={16} color={color} />
      <Text fontSize="lg" fontWeight="bold" color="white">
        {value}
      </Text>
      <Text fontSize="xs" color="whiteAlpha.700" fontWeight="medium">
        {label}
      </Text>
    </VStack>
  );

  const stats = [
    {
      icon: Users,
      label: "Followers",
      value: formatNumber(followerCount),
      color: "#00C6E0"
    },
    {
      icon: Target,
      label: "Strategies",
      value: formatNumber(strategyCount),
      color: "#00C6E0"
    },
    {
      icon: TrendingUp,
      label: "Subscribers",
      value: formatNumber(totalSubscribers),
      color: "#00C6E0"
    },
    {
      icon: Calendar,
      label: "Member Since",
      value: formatDate(memberSince),
      color: "#00C6E0"
    }
  ];

  return (
    <VStack spacing={6} align="stretch">
      <Flex
        direction={{ base: "column", lg: "row" }}
        align={{ base: "center", lg: "flex-start" }}
        gap={8}
      >
        {/* Avatar */}
        <Box flexShrink={0}>
          <Avatar
            src={profile?.profile_picture}
            name={profile?.username}
            size="2xl"
            border="3px solid #333"
            bg="#1a1a1a"
            color="white"
          />
        </Box>

        {/* Profile Info */}
        <VStack align={{ base: "center", lg: "flex-start" }} spacing={4} flex={1}>
        {/* Name and Verification */}
        <VStack spacing={2} align={{ base: "center", lg: "flex-start" }}>
          <HStack spacing={3} align="center">
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color="white"
              textAlign={{ base: "center", lg: "left" }}
            >
              @{profile?.username}
            </Text>

            {/* Verification Badge */}
            {profile?.is_verified && (
              <Tooltip label="Verified Creator" placement="top">
                <Box color="#00C6E0">
                  <CheckCircle size={24} />
                </Box>
              </Tooltip>
            )}

          </HStack>

          {/* Trading Experience */}
          {profile?.trading_experience && (
            <HStack spacing={2}>
              <User size={16} color="rgba(255, 255, 255, 0.6)" />
              <Text
                fontSize="sm"
                color="whiteAlpha.700"
                textTransform="capitalize"
              >
                {profile.trading_experience} Trader
              </Text>
            </HStack>
          )}
        </VStack>

        {/* Bio */}
        {profile?.bio && (
          <Text
            color="whiteAlpha.800"
            fontSize="md"
            maxW="600px"
            textAlign={{ base: "center", lg: "left" }}
            lineHeight="1.6"
          >
            {profile.bio}
          </Text>
        )}

        {/* Social Media Icons */}
        {profile?.social_media && Object.keys(profile.social_media).length > 0 && (
          <HStack spacing={2} flexWrap="wrap">
            {profile.social_media.x_handle && (
              <Tooltip label={`X: ${profile.social_media.x_handle}`} placement="top">
                <Link
                  href={`https://x.com/${profile.social_media.x_handle.replace('@', '')}`}
                  isExternal
                  _hover={{ transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <Box
                    as="button"
                    p={2}
                    bg="#1a1a1a"
                    borderRadius="lg"
                    border="1px solid #333"
                    _hover={{ borderColor: "#1DA1F2", bg: "rgba(29, 161, 242, 0.1)" }}
                    transition="all 0.2s"
                  >
                    <XIcon size={18} color="#1DA1F2" />
                  </Box>
                </Link>
              </Tooltip>
            )}

            {profile.social_media.youtube_handle && (
              <Tooltip label={`YouTube: ${profile.social_media.youtube_handle}`} placement="top">
                <Link
                  href={`https://youtube.com/@${profile.social_media.youtube_handle.replace('@', '')}`}
                  isExternal
                  _hover={{ transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <Box
                    as="button"
                    p={2}
                    bg="#1a1a1a"
                    borderRadius="lg"
                    border="1px solid #333"
                    _hover={{ borderColor: "#FF0000", bg: "rgba(255, 0, 0, 0.1)" }}
                    transition="all 0.2s"
                  >
                    <Youtube size={18} color="#FF0000" />
                  </Box>
                </Link>
              </Tooltip>
            )}

            {profile.social_media.tiktok_handle && (
              <Tooltip label={`TikTok: ${profile.social_media.tiktok_handle}`} placement="top">
                <Link
                  href={`https://tiktok.com/@${profile.social_media.tiktok_handle.replace('@', '')}`}
                  isExternal
                  _hover={{ transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <Box
                    as="button"
                    p={2}
                    bg="#1a1a1a"
                    borderRadius="lg"
                    border="1px solid #333"
                    _hover={{ borderColor: "#FF0050", bg: "rgba(255, 0, 80, 0.1)" }}
                    transition="all 0.2s"
                  >
                    <TikTokIcon size={18} color="#FF0050" />
                  </Box>
                </Link>
              </Tooltip>
            )}

            {profile.social_media.instagram_handle && (
              <Tooltip label={`Instagram: ${profile.social_media.instagram_handle}`} placement="top">
                <Link
                  href={`https://instagram.com/${profile.social_media.instagram_handle.replace('@', '')}`}
                  isExternal
                  _hover={{ transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <Box
                    as="button"
                    p={2}
                    bg="#1a1a1a"
                    borderRadius="lg"
                    border="1px solid #333"
                    _hover={{ borderColor: "#E4405F", bg: "rgba(228, 64, 95, 0.1)" }}
                    transition="all 0.2s"
                  >
                    <Box
                      bgGradient="linear(to-r, #833AB4, #FD1D1D, #F77737)"
                      borderRadius="md"
                      p="2px"
                    >
                      <Box bg="#1a1a1a" borderRadius="md" p="6px" display="flex">
                        <Instagram size={14} color="white" />
                      </Box>
                    </Box>
                  </Box>
                </Link>
              </Tooltip>
            )}

            {profile.social_media.discord_handle && (
              <Tooltip label={`Discord: ${profile.social_media.discord_handle}`} placement="top">
                <Box
                  as="button"
                  p={2}
                  bg="#1a1a1a"
                  borderRadius="lg"
                  border="1px solid #333"
                  _hover={{ borderColor: "#5865F2", bg: "rgba(88, 101, 242, 0.1)" }}
                  transition="all 0.2s"
                  cursor="pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(profile.social_media.discord_handle);
                    // You could add a toast notification here
                  }}
                >
                  <MessageCircle size={18} color="#5865F2" />
                </Box>
              </Tooltip>
            )}
          </HStack>
        )}

        {/* Action Buttons */}
        <HStack spacing={4} pt={2}>
          {isLoggedIn && !isOwnProfile && (
            <>
              <Button
                size="lg"
                bg={isFollowing ? "transparent" : "#00C6E0"}
                color={isFollowing ? "#00C6E0" : "white"}
                border={isFollowing ? "1px solid #00C6E0" : "none"}
                px={8}
                _hover={{
                  bg: isFollowing ? "rgba(0, 198, 224, 0.1)" : "#00A3B8",
                  borderColor: isFollowing ? "#00A3B8" : undefined
                }}
                _active={{
                  bg: isFollowing ? "rgba(0, 198, 224, 0.2)" : "#008C9E"
                }}
                onClick={onFollow}
                isLoading={isFollowLoading}
                loadingText={isFollowing ? "Unfollowing..." : "Following..."}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>

              {isFollowing && (
                <Tooltip label="Get notifications for new strategies" placement="top">
                  <IconButton
                    aria-label="Enable notifications"
                    icon={<Bell size={20} />}
                    size="lg"
                    variant="outline"
                    color="white"
                    borderColor="#333"
                    _hover={{
                      borderColor: "#00C6E0",
                      color: "#00C6E0",
                      bg: "rgba(0, 198, 224, 0.1)"
                    }}
                    onClick={() => {
                      // TODO: Implement notification subscription
                      console.log('Notification subscription for creator:', profile?.username);
                    }}
                  />
                </Tooltip>
              )}
            </>
          )}

          {!isLoggedIn && !isOwnProfile && (
            <Button
              size="lg"
              bg="#00C6E0"
              color="white"
              px={8}
              _hover={{ bg: "#00A3B8" }}
              onClick={() => window.open('/auth', '_self')}
            >
              Sign In to Follow
            </Button>
          )}
        </HStack>
        </VStack>
      </Flex>

      {/* Stats Section */}
      <Box
        borderTop="1px solid #333"
        pt={6}
        mt={2}
      >
        <SimpleGrid
          columns={{ base: 2, md: 4 }}
          spacing={8}
          justifyItems="center"
        >
          {stats.map((stat) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </SimpleGrid>
      </Box>
    </VStack>
  );
};

export default ProfileHeader;