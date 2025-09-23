import React from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Tooltip
} from '@chakra-ui/react';
import { CheckCircle, User } from 'lucide-react';
import { ProfilePicture } from '@/components/common/ProfilePicture';

const ProfileHeader = ({
  profile,
  isOwnProfile,
  isFollowing,
  onFollow,
  isFollowLoading
}) => {
  const getTierColor = (tier) => {
    switch (tier) {
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      default:
        return '#CD7F32';
    }
  };

  const getTierDisplayName = (tier) => {
    return tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Bronze';
  };

  return (
    <Flex
      direction={{ base: "column", lg: "row" }}
      align={{ base: "center", lg: "flex-start" }}
      gap={8}
    >
      {/* Avatar */}
      <Box flexShrink={0}>
        <ProfilePicture
          user={{ profile_picture: profile?.profile_picture, username: profile?.username }}
          size="2xl"
          showStatus={false}
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

            {/* Tier Badge */}
            <Badge
              bg={getTierColor(profile?.current_tier)}
              color="black"
              fontSize="xs"
              fontWeight="bold"
              px={2}
              py={1}
              borderRadius="full"
              textTransform="uppercase"
            >
              {getTierDisplayName(profile?.current_tier)} Creator
            </Badge>
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

        {/* Action Buttons */}
        <HStack spacing={4} pt={2}>
          {!isOwnProfile && (
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
          )}

          {isOwnProfile && (
            <Button
              size="lg"
              variant="outline"
              color="white"
              borderColor="#333"
              px={8}
              _hover={{
                borderColor: "#00C6E0",
                color: "#00C6E0"
              }}
              onClick={() => window.open('/settings?section=creator', '_self')}
            >
              Edit Profile
            </Button>
          )}
        </HStack>
      </VStack>
    </Flex>
  );
};

export default ProfileHeader;