import React from 'react';
import { Box, Flex, Text, VStack, HStack, Button } from '@chakra-ui/react';
import { Edit2 } from 'lucide-react';

const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700'
};

const CreatorDashboardHeader = ({ creatorProfile, onEditProfile }) => {
  const displayName = creatorProfile?.username || creatorProfile?.display_name || 'Creator';
  const initial = displayName.charAt(0).toUpperCase();
  const tier = creatorProfile?.currentTier || creatorProfile?.current_tier || 'bronze';
  const tierColor = TIER_COLORS[tier] || TIER_COLORS.bronze;
  const isVerified = creatorProfile?.isVerified || creatorProfile?.is_verified;

  return (
    <Box
      bg="rgba(18, 18, 18, 0.7)"
      backdropFilter="blur(20px)"
      borderBottom="1px solid rgba(255,255,255,0.06)"
      px={{ base: 4, md: 6 }}
      py={5}
      borderRadius="lg"
      mb={6}
    >
      <Flex
        justify="space-between"
        align="center"
        flexWrap={{ base: 'wrap', md: 'nowrap' }}
        gap={4}
      >
        {/* Left: Avatar + Name */}
        <HStack spacing={4}>
          <Box
            w="52px"
            h="52px"
            bg="linear-gradient(135deg, #00C6E0, #0098B0)"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="22px"
            fontWeight="700"
            color="white"
            flexShrink={0}
          >
            {initial}
          </Box>
          <VStack align="start" spacing={1}>
            <Text
              color="white"
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="700"
              letterSpacing="-0.02em"
              lineHeight="1.2"
            >
              {displayName}
            </Text>
            <HStack spacing={2}>
              <Box
                bg={`${tierColor}22`}
                border={`1px solid ${tierColor}44`}
                px={2}
                py={0.5}
                borderRadius="full"
              >
                <Text
                  fontSize="10px"
                  fontWeight="700"
                  color={tierColor}
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                >
                  {tier}
                </Text>
              </Box>
              {isVerified && (
                <HStack spacing={1}>
                  <Text color="#10b981" fontSize="12px" fontWeight="600">Verified</Text>
                </HStack>
              )}
            </HStack>
          </VStack>
        </HStack>

        {/* Right: Edit button */}
        <Button
          variant="ghost"
          size="sm"
          color="whiteAlpha.600"
          borderColor="rgba(255,255,255,0.1)"
          border="1px solid"
          borderRadius="10px"
          _hover={{
            color: '#00C6E0',
            borderColor: 'rgba(0, 198, 224, 0.3)',
            bg: 'rgba(0, 198, 224, 0.06)'
          }}
          leftIcon={<Edit2 size={14} />}
          onClick={onEditProfile}
          fontSize="13px"
          fontWeight="500"
        >
          Edit Profile
        </Button>
      </Flex>
    </Box>
  );
};

export default CreatorDashboardHeader;
