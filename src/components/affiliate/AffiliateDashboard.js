// src/components/affiliate/AffiliateDashboard.js
import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Divider,
  Tooltip,
  useColorModeValue,
  Flex,
  Link,
  Card,
  CardBody,
  CardHeader
} from '@chakra-ui/react';
import {
  Copy,
  ExternalLink,
  DollarSign,
  Users,
  MousePointer,
  TrendingUp,
  Calendar,
  CreditCard,
  Info,
  Eye,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAffiliate } from '@/hooks/useAffiliate';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color = "#00C6E0", isLoading = false, subtitle = null }) => (
  <MotionCard
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    bg="#1a1a1a"
    border="1px solid #333"
    borderRadius="lg"
    overflow="hidden"
    position="relative"
  >
    <CardBody p={6}>
      <HStack justify="space-between" align="start">
        <VStack align="start" spacing={2} flex={1}>
          <HStack>
            <Box
              bg={`${color}20`}
              p={2}
              borderRadius="md"
            >
              <Icon size={18} color={color} />
            </Box>
            <Text color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
              {label}
            </Text>
          </HStack>
          
          {isLoading ? (
            <Spinner size="sm" color={color} />
          ) : (
            <>
              <Text color="white" fontSize="2xl" fontWeight="bold">
                {value}
              </Text>
              {subtitle && (
                <Text color="whiteAlpha.600" fontSize="xs">
                  {subtitle}
                </Text>
              )}
            </>
          )}
        </VStack>
      </HStack>
    </CardBody>
  </MotionCard>
);

// Referral Link Component
const ReferralLinkCard = ({ referralLink, onCopy, isCopying = false }) => (
  <MotionCard
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.1 }}
    bg="linear-gradient(135deg, rgba(0, 198, 224, 0.1) 0%, rgba(0, 198, 224, 0.05) 100%)"
    border="1px solid rgba(0, 198, 224, 0.3)"
    borderRadius="lg"
    overflow="hidden"
  >
    <CardHeader pb={2}>
      <HStack>
        <Box
          bg="rgba(0, 198, 224, 0.2)"
          p={2}
          borderRadius="md"
        >
          <ExternalLink size={18} color="#00C6E0" />
        </Box>
        <Text color="#00C6E0" fontSize="sm" fontWeight="semibold">
          YOUR REFERRAL LINK
        </Text>
      </HStack>
    </CardHeader>
    
    <CardBody pt={0}>
      <VStack align="stretch" spacing={4}>
        <Text color="whiteAlpha.700" fontSize="sm">
          Share this link to earn 20% commission on every subscription from your referrals.
        </Text>
        
        <InputGroup>
          <Input
            value={referralLink || ''}
            isReadOnly
            bg="#1a1a1a"
            border="1px solid #00C6E0"
            color="white"
            fontSize="sm"
            pr={12}
            _focus={{
              boxShadow: "none",
              borderColor: "#00C6E0"
            }}
          />
          <InputRightElement width="4rem">
            <Tooltip label="Copy link">
              <IconButton
                aria-label="Copy referral link"
                icon={<Copy size={16} />}
                size="sm"
                variant="ghost"
                color="#00C6E0"
                _hover={{ bg: "rgba(0, 198, 224, 0.1)" }}
                onClick={() => onCopy(referralLink)}
                isLoading={isCopying}
              />
            </Tooltip>
          </InputRightElement>
        </InputGroup>
        
        <HStack spacing={4}>
          <Button
            size="sm"
            bg="#00C6E0"
            color="white"
            leftIcon={<Copy size={14} />}
            onClick={() => onCopy(referralLink)}
            isLoading={isCopying}
            _hover={{ bg: "#00A3B8" }}
          >
            Copy Link
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            borderColor="#00C6E0"
            color="#00C6E0"
            leftIcon={<ExternalLink size={14} />}
            onClick={() => window.open(referralLink, '_blank')}
          >
            Test Link
          </Button>
        </HStack>
      </VStack>
    </CardBody>
  </MotionCard>
);

// Recent Referrals Table Component
const RecentReferralsTable = ({ referrals = [], isLoading = false, formatCurrency, formatDate, getStatusColor, getStatusText }) => {
  if (isLoading) {
    return (
      <Center py={8}>
        <VStack>
          <Spinner size="lg" color="#00C6E0" />
          <Text color="whiteAlpha.600" fontSize="sm">Loading referrals...</Text>
        </VStack>
      </Center>
    );
  }

  if (!referrals || referrals.length === 0) {
    return (
      <Center py={8}>
        <VStack spacing={3}>
          <Box color="whiteAlpha.400">
            <Users size={48} />
          </Box>
          <Text color="whiteAlpha.600" fontSize="sm">
            No referrals yet
          </Text>
          <Text color="whiteAlpha.500" fontSize="xs" textAlign="center">
            Share your referral link to start earning commissions
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <TableContainer>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th color="whiteAlpha.700" fontSize="xs" borderColor="#333">Customer</Th>
            <Th color="whiteAlpha.700" fontSize="xs" borderColor="#333">Plan</Th>
            <Th color="whiteAlpha.700" fontSize="xs" borderColor="#333">Commission</Th>
            <Th color="whiteAlpha.700" fontSize="xs" borderColor="#333">Status</Th>
            <Th color="whiteAlpha.700" fontSize="xs" borderColor="#333">Date</Th>
          </Tr>
        </Thead>
        <Tbody>
          {referrals.map((referral, index) => (
            <Tr key={referral.id || index}>
              <Td borderColor="#333" py={3}>
                <VStack align="start" spacing={1}>
                  <Text color="white" fontSize="sm" fontWeight="medium">
                    {referral.customer_name || 'Anonymous'}
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="xs">
                    {referral.customer_email}
                  </Text>
                </VStack>
              </Td>
              <Td borderColor="#333" py={3}>
                <VStack align="start" spacing={1}>
                  <Text color="white" fontSize="sm">
                    {referral.subscription_tier?.charAt(0).toUpperCase() + referral.subscription_tier?.slice(1) || 'N/A'}
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="xs">
                    {referral.subscription_type || 'N/A'}
                  </Text>
                </VStack>
              </Td>
              <Td borderColor="#333" py={3}>
                <Text color="#00C6E0" fontSize="sm" fontWeight="medium">
                  {formatCurrency(referral.commission_amount)}
                </Text>
              </Td>
              <Td borderColor="#333" py={3}>
                <Badge
                  colorScheme={getStatusColor(referral.status)}
                  variant="subtle"
                  fontSize="xs"
                >
                  {getStatusText(referral.status)}
                </Badge>
              </Td>
              <Td borderColor="#333" py={3}>
                <Text color="whiteAlpha.600" fontSize="xs">
                  {formatDate(referral.referral_date)}
                </Text>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

// Program Info Component
const ProgramInfo = ({ programInfo }) => (
  <MotionCard
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.2 }}
    bg="#1a1a1a"
    border="1px solid #333"
    borderRadius="lg"
  >
    <CardHeader>
      <HStack>
        <Box
          bg="rgba(0, 198, 224, 0.2)"
          p={2}
          borderRadius="md"
        >
          <Info size={18} color="#00C6E0" />
        </Box>
        <Text color="#00C6E0" fontSize="sm" fontWeight="semibold">
          PROGRAM DETAILS
        </Text>
      </HStack>
    </CardHeader>
    
    <CardBody pt={0}>
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Text color="whiteAlpha.700" fontSize="sm">Commission Rate</Text>
          <Text color="white" fontSize="sm" fontWeight="medium">
            {programInfo?.commission_rate || '20%'}
          </Text>
        </HStack>
        
        <HStack justify="space-between">
          <Text color="whiteAlpha.700" fontSize="sm">Commission Type</Text>
          <Text color="white" fontSize="sm" fontWeight="medium">
            {programInfo?.commission_type || 'Lifetime recurring'}
          </Text>
        </HStack>
        
        <HStack justify="space-between">
          <Text color="whiteAlpha.700" fontSize="sm">Tracking Period</Text>
          <Text color="white" fontSize="sm" fontWeight="medium">
            {programInfo?.tracking_period || '90 days'}
          </Text>
        </HStack>
        
        <HStack justify="space-between">
          <Text color="whiteAlpha.700" fontSize="sm">Payment Schedule</Text>
          <Text color="white" fontSize="sm" fontWeight="medium">
            {programInfo?.payment_schedule || 'Monthly'}
          </Text>
        </HStack>
      </VStack>
    </CardBody>
  </MotionCard>
);

// Main Dashboard Component
const AffiliateDashboard = () => {
  const [copyingLink, setCopyingLink] = useState(false);
  const {
    dashboard,
    isLoading,
    dashboardError,
    copyReferralLink,
    formatCurrency,
    formatPercentage,
    formatDate,
    getStatusColor,
    getStatusText,
    refetchDashboard
  } = useAffiliate();

  const handleCopyLink = async (link) => {
    setCopyingLink(true);
    await copyReferralLink(link);
    setCopyingLink(false);
  };

  if (isLoading) {
    return (
      <Center py={12}>
        <VStack>
          <Spinner size="xl" color="#00C6E0" />
          <Text color="whiteAlpha.600">Loading affiliate dashboard...</Text>
        </VStack>
      </Center>
    );
  }

  if (dashboardError) {
    return (
      <Alert status="error" bg="#1a1a1a" border="1px solid" borderColor="red.500">
        <AlertIcon color="red.400" />
        <Box>
          <AlertTitle color="red.400">Error loading dashboard</AlertTitle>
          <AlertDescription color="whiteAlpha.700">
            {dashboardError.response?.data?.detail || dashboardError.message || 'Please try again later'}
          </AlertDescription>
        </Box>
        <Button
          ml="auto"
          size="sm"
          variant="outline"
          colorScheme="red"
          leftIcon={<RefreshCw size={14} />}
          onClick={() => refetchDashboard()}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  const affiliateData = dashboard?.affiliate;
  const stats = affiliateData?.stats;
  const recentReferrals = dashboard?.recent_referrals || [];
  const programInfo = dashboard?.program_info;

  return (
    <VStack spacing={8} align="stretch">
      {/* Stats Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <StatCard
          icon={DollarSign}
          label="Total Earned"
          value={formatCurrency(stats?.total_earned)}
          color="#00C6E0"
          subtitle="Lifetime commissions"
        />
        
        <StatCard
          icon={Users}
          label="Total Referrals"
          value={stats?.total_referrals || 0}
          color="#10B981"
          subtitle={`${stats?.confirmed_referrals || 0} confirmed`}
        />
        
        <StatCard
          icon={MousePointer}
          label="Total Clicks"
          value={stats?.total_clicks || 0}
          color="#8B5CF6"
          subtitle={`${formatPercentage(stats?.conversion_rate)}% conversion`}
        />
        
        <StatCard
          icon={CreditCard}
          label="Pending Payout"
          value={formatCurrency(stats?.pending_payout)}
          color="#F59E0B"
          subtitle="Next payout: 1st"
        />
      </SimpleGrid>

      {/* Referral Link */}
      <ReferralLinkCard
        referralLink={affiliateData?.referral_link}
        onCopy={handleCopyLink}
        isCopying={copyingLink}
      />

      {/* Recent Referrals and Program Info */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* Recent Referrals */}
        <Box gridColumn={{ base: 'span 1', lg: 'span 2' }}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            bg="#1a1a1a"
            border="1px solid #333"
            borderRadius="lg"
          >
            <CardHeader>
              <HStack justify="space-between">
                <HStack>
                  <Box
                    bg="rgba(0, 198, 224, 0.2)"
                    p={2}
                    borderRadius="md"
                  >
                    <TrendingUp size={18} color="#00C6E0" />
                  </Box>
                  <Text color="#00C6E0" fontSize="sm" fontWeight="semibold">
                    RECENT REFERRALS
                  </Text>
                </HStack>
                
                {recentReferrals.length > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    color="#00C6E0"
                    rightIcon={<Eye size={12} />}
                  >
                    View All
                  </Button>
                )}
              </HStack>
            </CardHeader>
            
            <CardBody pt={0}>
              <RecentReferralsTable
                referrals={recentReferrals}
                isLoading={false}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
              />
            </CardBody>
          </MotionCard>
        </Box>

        {/* Program Info */}
        <ProgramInfo programInfo={programInfo} />
      </SimpleGrid>

      {/* Payout Information */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        bg="rgba(0, 198, 224, 0.05)"
        border="1px solid rgba(0, 198, 224, 0.2)"
        borderRadius="lg"
      >
        <CardBody>
          <HStack spacing={4} align="start">
            <Box color="#00C6E0" mt={1}>
              <Calendar size={20} />
            </Box>
            <Box>
              <Text color="#00C6E0" fontSize="sm" fontWeight="semibold" mb={1}>
                Next Payout Information
              </Text>
              <Text color="whiteAlpha.700" fontSize="sm">
                Payouts are processed monthly on the 1st via Stripe. Minimum payout amount is $50. 
                Current pending: <Text as="span" color="white" fontWeight="medium">{formatCurrency(stats?.pending_payout)}</Text>
              </Text>
            </Box>
          </HStack>
        </CardBody>
      </MotionCard>
    </VStack>
  );
};

export default AffiliateDashboard;