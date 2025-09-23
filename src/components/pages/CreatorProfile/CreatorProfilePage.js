import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';
import { useCreatorProfile } from './hooks/useCreatorProfile';
import ProfileHeader from './components/ProfileHeader';
import ProfileStats from './components/ProfileStats';
import SocialLinks from './components/SocialLinks';
import StrategyGrid from './components/StrategyGrid';
import ProfileSkeleton from './components/ProfileSkeleton';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const DarkCard = ({ children, ...props }) => (
  <Box
    bg="#121212"
    border="1px solid #333"
    borderRadius="md"
    overflow="hidden"
    {...props}
  >
    {children}
  </Box>
);

const CreatorProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const {
    profile,
    strategies,
    isLoading,
    error,
    isFollowing,
    followerCount,
    followCreator,
    unfollowCreator,
    isFollowLoading
  } = useCreatorProfile(username);

  const [strategiesPage, setStrategiesPage] = useState(1);
  const strategiesLimit = 12;

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/creator/${username}`;

    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Profile link copied!",
        description: "Share this link to let others discover this creator",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
    } catch (error) {
      toast({
        title: "Failed to copy link",
        description: "Please copy the URL manually",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowCreator();
        toast({
          title: "Unfollowed",
          description: `You are no longer following @${username}`,
          status: "info",
          duration: 2000,
          isClosable: true,
          position: "top-right"
        });
      } else {
        await followCreator();
        toast({
          title: "Following!",
          description: `You are now following @${username}`,
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "top-right"
        });
      }
    } catch (error) {
      toast({
        title: "Action failed",
        description: error.message || "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Flex minH="100vh" bg="#000000" color="white">
        <Box flexGrow={1} p={{ base: 4, md: 6 }}>
          <ProfileSkeleton />
        </Box>
      </Flex>
    );
  }

  // Error state
  if (error) {
    return (
      <Flex minH="100vh" bg="#000000" color="white" align="center" justify="center">
        <VStack spacing={6} maxW="md" textAlign="center">
          <Alert status="error" variant="subtle" bg="#1a1a1a" border="1px solid #e53e3e">
            <AlertIcon color="#e53e3e" />
            <Box>
              <Text fontWeight="bold" mb={1}>Creator Not Found</Text>
              <Text fontSize="sm" color="whiteAlpha.700">
                {error === 'Creator not found'
                  ? `@${username} doesn't exist or isn't a creator yet`
                  : 'Something went wrong loading this profile'
                }
              </Text>
            </Box>
          </Alert>

          <HStack spacing={4}>
            <IconButton
              aria-label="Go back"
              icon={<ArrowLeft size={20} />}
              variant="outline"
              color="white"
              borderColor="#333"
              _hover={{ borderColor: "#00C6E0", color: "#00C6E0" }}
              onClick={handleGoBack}
            />
            <Text color="whiteAlpha.600" fontSize="sm">or</Text>
            <Box
              as="button"
              color="#00C6E0"
              fontSize="sm"
              textDecoration="underline"
              _hover={{ color: "#00A3B8" }}
              onClick={() => navigate('/marketplace')}
            >
              Browse the marketplace
            </Box>
          </HStack>
        </VStack>
      </Flex>
    );
  }

  const isOwnProfile = user?.username === username;
  const isLoggedIn = !!user;

  return (
    <Flex minH="100vh" bg="#000000" color="white">
      <Box flexGrow={1} p={{ base: 4, md: 6 }}>
        <MotionFlex
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          direction="column"
          gap={6}
          maxW="1200px"
          mx="auto"
        >
          {/* Header with back button */}
          <HStack justify="space-between" align="center">
            <Tooltip label="Go back" placement="right">
              <IconButton
                aria-label="Go back"
                icon={<ArrowLeft size={20} />}
                variant="ghost"
                color="whiteAlpha.700"
                size="md"
                _hover={{
                  color: "#00C6E0",
                  bg: "rgba(0, 198, 224, 0.1)"
                }}
                onClick={handleGoBack}
              />
            </Tooltip>

            <Tooltip label="Share profile" placement="left">
              <IconButton
                aria-label="Share profile"
                icon={<ExternalLink size={20} />}
                variant="ghost"
                color="whiteAlpha.700"
                size="md"
                _hover={{
                  color: "#00C6E0",
                  bg: "rgba(0, 198, 224, 0.1)"
                }}
                onClick={handleShareProfile}
              />
            </Tooltip>
          </HStack>

          {/* Profile Header */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <DarkCard p={8}>
              <ProfileHeader
                profile={profile}
                isOwnProfile={isOwnProfile}
                isFollowing={isFollowing}
                onFollow={handleFollow}
                isFollowLoading={isFollowLoading}
                isLoggedIn={isLoggedIn}
              />
            </DarkCard>
          </MotionBox>

          {/* Stats Bar */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <DarkCard p={6}>
              <ProfileStats
                followerCount={followerCount}
                strategyCount={profile?.strategy_count || 0}
                totalSubscribers={profile?.total_subscribers || 0}
                memberSince={profile?.created_at}
              />
            </DarkCard>
          </MotionBox>

          {/* Social Links */}
          {profile?.social_media && Object.keys(profile.social_media).length > 0 && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <DarkCard p={6}>
                <SocialLinks socialMedia={profile.social_media} />
              </DarkCard>
            </MotionBox>
          )}

          {/* Strategies Section */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <DarkCard p={6}>
              <VStack spacing={6} align="stretch">
                <HStack justify="space-between" align="center">
                  <Text fontSize="xl" fontWeight="bold" color="white">
                    Trading Strategies
                  </Text>
                  <Text fontSize="sm" color="whiteAlpha.600">
                    {profile?.strategy_count || 0} strategies available
                  </Text>
                </HStack>

                <StrategyGrid
                  strategies={strategies}
                  isLoading={isLoading}
                  page={strategiesPage}
                  limit={strategiesLimit}
                  onPageChange={setStrategiesPage}
                />
              </VStack>
            </DarkCard>
          </MotionBox>
        </MotionFlex>
      </Box>
    </Flex>
  );
};

export default CreatorProfilePage;