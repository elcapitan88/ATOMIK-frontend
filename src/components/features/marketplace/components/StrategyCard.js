import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Flex,
  Avatar,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { TrendingUp, Star, Users, Clock } from 'lucide-react';

const StrategyCard = ({ strategy }) => {
  return (
    <Box
      bg="rgba(255, 255, 255, 0.1)"
      backdropFilter="blur(10px)"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="xl"
      overflow="hidden"
      transition="all 0.2s"
      _hover={{
        transform: 'translateY(-2px)',
        borderColor: "rgba(0, 198, 224, 0.6)",
        boxShadow: "0 4px 12px rgba(0, 198, 224, 0.15)"
      }}
      minW="300px"
      maxW="300px"
      cursor="pointer"
    >
      {/* Performance Banner */}
      <Box 
        bg={Number(strategy.winRate) >= 60 ? "green.500" : "blue.500"} 
        px={4} 
        py={1}
      >
        <HStack spacing={2} justify="center">
          <TrendingUp size={14} />
          <Text fontSize="sm" fontWeight="medium">
            {strategy.winRate}% Win Rate
          </Text>
        </HStack>
      </Box>

      {/* Main Content */}
      <VStack p={4} align="stretch" spacing={4}>
        <VStack align="stretch" spacing={1}>
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="bold">
              {strategy.name}
            </Text>
            <Badge 
              colorScheme={strategy.risk === 'Low' ? 'green' : strategy.risk === 'Medium' ? 'yellow' : 'red'}
              variant="subtle"
            >
              {strategy.risk} Risk
            </Badge>
          </HStack>
          <Text fontSize="sm" color="whiteAlpha.700" noOfLines={2}>
            {strategy.description}
          </Text>
        </VStack>

        {/* Stats */}
        <HStack spacing={4} justify="space-between">
          <HStack spacing={1}>
            <Star size={14} color="#FFD700" />
            <Text fontSize="sm">{strategy.rating}</Text>
          </HStack>
          <HStack spacing={1}>
            <Users size={14} />
            <Text fontSize="sm">{strategy.users} Users</Text>
          </HStack>
          <HStack spacing={1}>
            <Clock size={14} />
            <Text fontSize="sm">{strategy.timeframe}</Text>
          </HStack>
        </HStack>

        {/* Author */}
        <HStack spacing={2}>
          <Avatar size="sm" name={strategy.author} src={strategy.authorAvatar} />
          <VStack spacing={0} align="start">
            <Text fontSize="sm" fontWeight="medium">
              {strategy.author}
            </Text>
            <Text fontSize="xs" color="whiteAlpha.600">
              {strategy.authorTitle}
            </Text>
          </VStack>
          <Box flex={1} />
          <Text fontSize="lg" fontWeight="bold" color="green.400">
            ${strategy.price}
          </Text>
        </HStack>

        {/* Action Button */}
        <Button
          w="full"
          bg="transparent"
          color="white"
          fontWeight="medium"
          borderWidth={1}
          borderColor="rgba(0, 198, 224, 1)"
          _hover={{
            bg: 'whiteAlpha.100'
          }}
        >
          View Details
        </Button>
      </VStack>
    </Box>
  );
};

export default StrategyCard;