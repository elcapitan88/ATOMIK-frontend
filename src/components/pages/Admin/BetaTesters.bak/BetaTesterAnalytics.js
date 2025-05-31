// frontend/src/components/pages/Admin/BetaTesters/BetaTesterAnalytics.js
import React, { useState } from 'react';
import {
  Box,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  VStack,
  HStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Flex,
  Icon,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import {
  TrendingUp,
  Activity,
  Users,
  Eye,
  MessageSquare,
  TestTube,
  Calendar,
  Target,
  ThumbsUp,
  Clock,
  Zap,
  BarChart3
} from 'lucide-react';
import { BETA_FEATURES } from '../../../../utils/betaUtils';

// Mock analytics data - In real app, this would come from API
const mockAnalyticsData = {
  overview: {
    totalBetaTesters: 45,
    activeBetaTesters: 32,
    totalFeatures: 8,
    averageEngagement: 72,
    growthRate: 15.3,
    feedbackReceived: 127
  },
  featureUsage: [
    {
      featureName: 'advanced-analytics',
      displayName: 'Advanced Analytics Dashboard',
      usageCount: 28,
      uniqueUsers: 22,
      avgSessionTime: '14m 32s',
      feedbackScore: 4.2,
      adoptionRate: 71
    },
    {
      featureName: 'new-dashboard',
      displayName: 'Enhanced Dashboard Layout',
      usageCount: 35,
      uniqueUsers: 25,
      avgSessionTime: '18m 45s',
      feedbackScore: 4.5,
      adoptionRate: 78
    },
    {
      featureName: 'experimental-trading',
      displayName: 'Experimental Trading Tools',
      usageCount: 18,
      uniqueUsers: 15,
      avgSessionTime: '22m 10s',
      feedbackScore: 3.8,
      adoptionRate: 45
    },
    {
      featureName: 'ai-insights',
      displayName: 'AI-Powered Trading Insights',
      usageCount: 42,
      uniqueUsers: 31,
      avgSessionTime: '12m 20s',
      feedbackScore: 4.7,
      adoptionRate: 89
    },
    {
      featureName: 'advanced-charts',
      displayName: 'Advanced Chart Components',
      usageCount: 25,
      uniqueUsers: 19,
      avgSessionTime: '16m 55s',
      feedbackScore: 4.1,
      adoptionRate: 58
    }
  ],
  recentFeedback: [
    {
      id: 1,
      username: 'johndoe',
      feature: 'AI Insights',
      rating: 5,
      comment: 'Amazing feature! The predictions are quite accurate.',
      submittedAt: '2025-04-13T10:30:00Z'
    },
    {
      id: 2,
      username: 'janesmith',
      feature: 'New Dashboard',
      rating: 4,
      comment: 'Love the new layout, much more intuitive.',
      submittedAt: '2025-04-13T09:15:00Z'
    },
    {
      id: 3,
      username: 'testuser',
      feature: 'Advanced Analytics',
      rating: 4,
      comment: 'Great charts but could use more customization options.',
      submittedAt: '2025-04-12T16:45:00Z'
    },
    {
      id: 4,
      username: 'sarahw',
      feature: 'Experimental Trading',
      rating: 3,
      comment: 'Interesting concept but needs some bug fixes.',
      submittedAt: '2025-04-12T14:20:00Z'
    }
  ],
  engagementTrends: [
    { period: 'Week 1', users: 12, sessions: 45, features: 3 },
    { period: 'Week 2', users: 18, sessions: 67, features: 4 },
    { period: 'Week 3', users: 25, sessions: 89, features: 5 },
    { period: 'Week 4', users: 32, sessions: 112, features: 6 },
    { period: 'Current', users: 32, sessions: 95, features: 8 }
  ]
};

// Format relative time
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
};

// Get rating color
const getRatingColor = (rating) => {
  if (rating >= 4.5) return 'green';
  if (rating >= 3.5) return 'yellow';
  if (rating >= 2.5) return 'orange';
  return 'red';
};

const BetaTesterAnalytics = ({ betaTesters = [] }) => {
  const [timeRange, setTimeRange] = useState('30d');
  
  const { overview, featureUsage, recentFeedback, engagementTrends } = mockAnalyticsData;

  return (
    <VStack spacing={6} align="stretch">
      {/* Analytics Header */}
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="md" color="white" mb={2}>
            <HStack>
              <BarChart3 size={20} color="#9932CC" />
              <Text>Beta Testing Analytics</Text>
            </HStack>
          </Heading>
          <Text color="whiteAlpha.600">Performance metrics and user feedback</Text>
        </Box>
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          maxW="150px"
          bg="whiteAlpha.100"
          size="sm"
        >
          <option value="7d" style={{ backgroundColor: "#1A202C" }}>Last 7 days</option>
          <option value="30d" style={{ backgroundColor: "#1A202C" }}>Last 30 days</option>
          <option value="90d" style={{ backgroundColor: "#1A202C" }}>Last 90 days</option>
        </Select>
      </Flex>

      {/* Overview Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.600">
                <HStack>
                  <Users size={16} />
                  <Text>Total Beta Testers</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="white">{overview.totalBetaTesters}</StatNumber>
              <StatHelpText color="whiteAlpha.500">
                <StatArrow type="increase" />
                {overview.growthRate}% growth
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.600">
                <HStack>
                  <Activity size={16} />
                  <Text>Active Users</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="white">{overview.activeBetaTesters}</StatNumber>
              <StatHelpText color="whiteAlpha.500">
                {Math.round((overview.activeBetaTesters / overview.totalBetaTesters) * 100)}% engagement
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.600">
                <HStack>
                  <TestTube size={16} />
                  <Text>Beta Features</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="white">{overview.totalFeatures}</StatNumber>
              <StatHelpText color="whiteAlpha.500">
                Available for testing
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
          <CardBody>
            <Stat>
              <StatLabel color="whiteAlpha.600">
                <HStack>
                  <MessageSquare size={16} />
                  <Text>Feedback</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="white">{overview.feedbackReceived}</StatNumber>
              <StatHelpText color="whiteAlpha.500">
                Total submissions
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Feature Usage Analytics */}
      <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
        <CardHeader>
          <Heading size="sm" color="white">
            <HStack>
              <Eye size={18} />
              <Text>Feature Usage & Adoption</Text>
            </HStack>
          </Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            {featureUsage.map((feature, index) => (
              <Box key={feature.featureName}>
                <Flex justify="space-between" align="center" mb={2}>
                  <VStack align="start" spacing={1}>
                    <Text color="white" fontWeight="medium">{feature.displayName}</Text>
                    <HStack spacing={4}>
                      <Text fontSize="sm" color="whiteAlpha.600">
                        {feature.uniqueUsers} users • {feature.usageCount} sessions
                      </Text>
                      <Text fontSize="sm" color="whiteAlpha.600">
                        Avg: {feature.avgSessionTime}
                      </Text>
                      <Badge colorScheme={getRatingColor(feature.feedbackScore)}>
                        ★ {feature.feedbackScore}
                      </Badge>
                    </HStack>
                  </VStack>
                  <VStack align="end" spacing={1}>
                    <Text color="white" fontSize="lg" fontWeight="bold">
                      {feature.adoptionRate}%
                    </Text>
                    <Text fontSize="sm" color="whiteAlpha.600">adoption</Text>
                  </VStack>
                </Flex>
                <Progress 
                  value={feature.adoptionRate} 
                  colorScheme="purple" 
                  size="sm" 
                  bg="whiteAlpha.200"
                />
                {index < featureUsage.length - 1 && <Divider mt={4} borderColor="whiteAlpha.200" />}
              </Box>
            ))}
          </VStack>
        </CardBody>
      </Card>

      {/* Recent Feedback */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
          <CardHeader>
            <Heading size="sm" color="white">
              <HStack>
                <MessageSquare size={18} />
                <Text>Recent Feedback</Text>
              </HStack>
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {recentFeedback.map((feedback, index) => (
                <Box key={feedback.id}>
                  <Flex justify="space-between" align="start" mb={2}>
                    <VStack align="start" spacing={1}>
                      <HStack>
                        <Text color="white" fontWeight="medium">{feedback.username}</Text>
                        <Badge colorScheme="purple" variant="subtle">{feedback.feature}</Badge>
                      </HStack>
                      <HStack>
                        {[...Array(5)].map((_, i) => (
                          <Icon
                            key={i}
                            as={ThumbsUp}
                            boxSize={3}
                            color={i < feedback.rating ? "yellow.400" : "whiteAlpha.300"}
                          />
                        ))}
                      </HStack>
                    </VStack>
                    <Text fontSize="xs" color="whiteAlpha.500">
                      {formatRelativeTime(feedback.submittedAt)}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="whiteAlpha.700" fontStyle="italic">
                    "{feedback.comment}"
                  </Text>
                  {index < recentFeedback.length - 1 && <Divider mt={3} borderColor="whiteAlpha.200" />}
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>

        {/* Engagement Trends */}
        <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
          <CardHeader>
            <Heading size="sm" color="white">
              <HStack>
                <TrendingUp size={18} />
                <Text>Engagement Trends</Text>
              </HStack>
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {engagementTrends.map((trend, index) => (
                <Box key={trend.period}>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text color="white" fontWeight="medium">{trend.period}</Text>
                    <HStack spacing={3}>
                      <Badge colorScheme="blue">{trend.users} users</Badge>
                      <Badge colorScheme="green">{trend.sessions} sessions</Badge>
                      <Badge colorScheme="purple">{trend.features} features</Badge>
                    </HStack>
                  </Flex>
                  <Progress 
                    value={(trend.users / 40) * 100} 
                    colorScheme="blue" 
                    size="sm" 
                    bg="whiteAlpha.200"
                  />
                  {index < engagementTrends.length - 1 && <Divider mt={3} borderColor="whiteAlpha.200" />}
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Insights and Recommendations */}
      <Alert status="info" bg="rgba(0, 198, 224, 0.1)" border="1px solid rgba(0, 198, 224, 0.3)">
        <AlertIcon color="#00C6E0" />
        <Box>
          <AlertTitle color="#00C6E0">Key Insights</AlertTitle>
          <AlertDescription color="whiteAlpha.800">
            <VStack align="start" spacing={2} mt={2}>
              <Text>• AI Insights has the highest adoption rate (89%) and user satisfaction (4.7/5)</Text>
              <Text>• Experimental Trading needs attention with only 45% adoption rate</Text>
              <Text>• Overall engagement is strong at 72% with 15.3% growth this period</Text>
              <Text>• Consider graduating AI Insights from beta to production</Text>
            </VStack>
          </AlertDescription>
        </Box>
      </Alert>

      {/* Empty State */}
      {betaTesters.length === 0 && (
        <Card bg="rgba(0, 0, 0, 0.2)" borderColor="whiteAlpha.200">
          <CardBody py={12}>
            <VStack spacing={4}>
              <TestTube size={48} color="#666" />
              <Text color="whiteAlpha.600" textAlign="center">
                No beta testing data available yet.
                <br />
                Add some beta testers to start collecting analytics!
              </Text>
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default BetaTesterAnalytics;