import React from 'react';
import {
  SimpleGrid,
  VStack,
  Text,
  Divider
} from '@chakra-ui/react';
import { Users, Target, Calendar, TrendingUp } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color = "#00C6E0" }) => (
  <VStack spacing={3} align="center" textAlign="center">
    <Icon size={24} color={color} />
    <VStack spacing={1}>
      <Text fontSize="2xl" fontWeight="bold" color="white">
        {value}
      </Text>
      <Text fontSize="sm" color="whiteAlpha.700" fontWeight="medium">
        {label}
      </Text>
    </VStack>
  </VStack>
);

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

const ProfileStats = ({
  followerCount = 0,
  strategyCount = 0,
  totalSubscribers = 0,
  memberSince
}) => {
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
    <SimpleGrid
      columns={{ base: 2, md: 4 }}
      spacing={8}
      py={4}
    >
      {stats.map((stat, index) => (
        <React.Fragment key={stat.label}>
          <StatCard {...stat} />
          {/* Add divider between stats on larger screens */}
          {index < stats.length - 1 && (
            <Divider
              orientation="vertical"
              borderColor="#333"
              height="80px"
              alignSelf="center"
              display={{ base: "none", md: index % 2 === 1 ? "none" : "block" }}
            />
          )}
        </React.Fragment>
      ))}
    </SimpleGrid>
  );
};

export default ProfileStats;