import React from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  SimpleGrid
} from '@chakra-ui/react';

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

const ProfileSkeleton = () => {
  return (
    <Flex direction="column" gap={6} maxW="1200px" mx="auto">
      {/* Header with back button */}
      <HStack justify="space-between" align="center">
        <Skeleton height="40px" width="40px" startColor="#333" endColor="#555" borderRadius="md" />
        <Skeleton height="40px" width="40px" startColor="#333" endColor="#555" borderRadius="md" />
      </HStack>

      {/* Profile Header */}
      <DarkCard p={8}>
        <Flex
          direction={{ base: "column", lg: "row" }}
          align={{ base: "center", lg: "flex-start" }}
          gap={8}
        >
          {/* Avatar */}
          <Box flexShrink={0}>
            <SkeletonCircle size="120px" startColor="#333" endColor="#555" />
          </Box>

          {/* Profile Info */}
          <VStack align={{ base: "center", lg: "flex-start" }} spacing={4} flex={1}>
            <VStack spacing={2} align={{ base: "center", lg: "flex-start" }}>
              <HStack spacing={3} align="center">
                <Skeleton height="32px" width="200px" startColor="#333" endColor="#555" />
                <Skeleton height="24px" width="24px" startColor="#333" endColor="#555" borderRadius="full" />
                <Skeleton height="20px" width="80px" startColor="#333" endColor="#555" borderRadius="full" />
              </HStack>

              <Skeleton height="16px" width="120px" startColor="#333" endColor="#555" />
            </VStack>

            {/* Bio */}
            <SkeletonText
              noOfLines={3}
              spacing="2"
              skeletonHeight="2"
              width="100%"
              maxW="600px"
              startColor="#333"
              endColor="#555"
            />

            {/* Action Buttons */}
            <HStack spacing={4} pt={2}>
              <Skeleton height="48px" width="120px" startColor="#333" endColor="#555" borderRadius="md" />
            </HStack>
          </VStack>
        </Flex>
      </DarkCard>

      {/* Stats Bar */}
      <DarkCard p={6}>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8} py={4}>
          {Array.from({ length: 4 }).map((_, index) => (
            <VStack spacing={3} align="center" textAlign="center" key={index}>
              <Skeleton height="24px" width="24px" startColor="#333" endColor="#555" />
              <VStack spacing={1}>
                <Skeleton height="32px" width="60px" startColor="#333" endColor="#555" />
                <Skeleton height="16px" width="80px" startColor="#333" endColor="#555" />
              </VStack>
            </VStack>
          ))}
        </SimpleGrid>
      </DarkCard>

      {/* Social Links */}
      <DarkCard p={6}>
        <VStack spacing={4} align="start">
          <Skeleton height="24px" width="150px" startColor="#333" endColor="#555" />
          <HStack spacing={4}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                key={index}
                height="40px"
                width="40px"
                startColor="#333"
                endColor="#555"
                borderRadius="md"
              />
            ))}
          </HStack>
          <Skeleton height="12px" width="300px" startColor="#333" endColor="#555" />
        </VStack>
      </DarkCard>

      {/* Strategies Section */}
      <DarkCard p={6}>
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between" align="center">
            <Skeleton height="28px" width="180px" startColor="#333" endColor="#555" />
            <Skeleton height="16px" width="120px" startColor="#333" endColor="#555" />
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Box
                key={index}
                bg="#1a1a1a"
                border="1px solid #333"
                borderRadius="lg"
                p={6}
                h="280px"
              >
                <VStack spacing={4} align="stretch" h="full">
                  <VStack spacing={2} align="start">
                    <Skeleton height="24px" width="80%" startColor="#333" endColor="#555" />
                    <SkeletonText
                      mt="2"
                      noOfLines={3}
                      spacing="2"
                      skeletonHeight="2"
                      startColor="#333"
                      endColor="#555"
                    />
                  </VStack>

                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Skeleton height="16px" width="100px" startColor="#333" endColor="#555" />
                      <Skeleton height="16px" width="80px" startColor="#333" endColor="#555" />
                    </HStack>

                    <HStack justify="space-between">
                      <Skeleton height="32px" width="100px" startColor="#333" endColor="#555" />
                      <Skeleton height="32px" width="80px" startColor="#333" endColor="#555" />
                    </HStack>
                  </VStack>

                  <Skeleton height="40px" width="full" startColor="#333" endColor="#555" />
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </DarkCard>
    </Flex>
  );
};

export default ProfileSkeleton;