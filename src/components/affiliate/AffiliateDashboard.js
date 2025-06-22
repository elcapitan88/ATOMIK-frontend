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
  CardHeader,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure
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
  RefreshCw,
  Settings,
  FileText,
  Wallet,
  History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAffiliate } from '@/hooks/useAffiliate';
import affiliateService from '@/services/affiliateService';

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

// Payout Method Configuration Component
const PayoutMethodModal = ({ isOpen, onClose, currentMethod, currentDetails, onUpdateMethod }) => {
  const [payoutMethod, setPayoutMethod] = useState(currentMethod || '');
  const [paypalEmail, setPaypalEmail] = useState(currentDetails?.email || '');
  const [wiseEmail, setWiseEmail] = useState(currentDetails?.email || '');
  const [wiseRecipientType, setWiseRecipientType] = useState(currentDetails?.recipient_type || 'individual');
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!payoutMethod) {
      newErrors.method = 'Please select a payout method';
    } else if (payoutMethod === 'paypal') {
      if (!paypalEmail) {
        newErrors.paypal = 'PayPal email is required';
      } else if (!/\S+@\S+\.\S+/.test(paypalEmail)) {
        newErrors.paypal = 'Please enter a valid email address';
      }
    } else if (payoutMethod === 'wise') {
      if (!wiseEmail) {
        newErrors.wise = 'Wise email is required';
      } else if (!/\S+@\S+\.\S+/.test(wiseEmail)) {
        newErrors.wise = 'Please enter a valid email address';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsUpdating(true);
    try {
      const details = payoutMethod === 'paypal' 
        ? { email: paypalEmail }
        : { email: wiseEmail, recipient_type: wiseRecipientType };
      
      await onUpdateMethod(payoutMethod, details);
      onClose();
    } catch (error) {
      console.error('Error updating payout method:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "md" }}>
      <ModalOverlay />
      <ModalContent bg="#1a1a1a" border="1px solid #333" mx={{ base: 4, md: 0 }}>
        <ModalHeader color="white">Configure Payout Method</ModalHeader>
        <ModalCloseButton color="whiteAlpha.700" />
        
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            <FormControl isInvalid={errors.method}>
              <FormLabel color="whiteAlpha.700" fontSize="sm">Payout Method</FormLabel>
              <Select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                bg="#2a2a2a"
                borderColor="#333"
                color="white"
                _hover={{ borderColor: "#00C6E0" }}
                _focus={{ borderColor: "#00C6E0", boxShadow: "none" }}
              >
                <option value="">Select a method</option>
                <option value="paypal">PayPal</option>
                <option value="wise">Wise (formerly TransferWise)</option>
              </Select>
              <FormErrorMessage>{errors.method}</FormErrorMessage>
            </FormControl>

            {payoutMethod === 'paypal' && (
              <FormControl isInvalid={errors.paypal}>
                <FormLabel color="whiteAlpha.700" fontSize="sm">PayPal Email</FormLabel>
                <Input
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="your@paypal.email"
                  bg="#2a2a2a"
                  borderColor="#333"
                  color="white"
                  _hover={{ borderColor: "#00C6E0" }}
                  _focus={{ borderColor: "#00C6E0", boxShadow: "none" }}
                />
                <FormErrorMessage>{errors.paypal}</FormErrorMessage>
              </FormControl>
            )}

            {payoutMethod === 'wise' && (
              <>
                <FormControl isInvalid={errors.wise}>
                  <FormLabel color="whiteAlpha.700" fontSize="sm">Wise Email</FormLabel>
                  <Input
                    type="email"
                    value={wiseEmail}
                    onChange={(e) => setWiseEmail(e.target.value)}
                    placeholder="your@wise.email"
                    bg="#2a2a2a"
                    borderColor="#333"
                    color="white"
                    _hover={{ borderColor: "#00C6E0" }}
                    _focus={{ borderColor: "#00C6E0", boxShadow: "none" }}
                  />
                  <FormErrorMessage>{errors.wise}</FormErrorMessage>
                </FormControl>
                
                <FormControl>
                  <FormLabel color="whiteAlpha.700" fontSize="sm">Recipient Type</FormLabel>
                  <Select
                    value={wiseRecipientType}
                    onChange={(e) => setWiseRecipientType(e.target.value)}
                    bg="#2a2a2a"
                    borderColor="#333"
                    color="white"
                    _hover={{ borderColor: "#00C6E0" }}
                    _focus={{ borderColor: "#00C6E0", boxShadow: "none" }}
                  >
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                  </Select>
                </FormControl>
              </>
            )}

            <HStack spacing={3} pt={4}>
              <Button
                flex={1}
                bg="#00C6E0"
                color="white"
                onClick={handleSubmit}
                isLoading={isUpdating}
                _hover={{ bg: "#00A3B8" }}
              >
                Save Method
              </Button>
              <Button
                flex={1}
                variant="outline"
                borderColor="#333"
                color="whiteAlpha.700"
                onClick={onClose}
                _hover={{ bg: "#2a2a2a" }}
              >
                Cancel
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Payout History Table Component
const PayoutHistoryTable = ({ payouts = [], isLoading = false, formatCurrency, formatDate }) => {
  if (isLoading) {
    return (
      <Center py={8}>
        <VStack>
          <Spinner size="lg" color="#00C6E0" />
          <Text color="whiteAlpha.600" fontSize="sm">Loading payout history...</Text>
        </VStack>
      </Center>
    );
  }

  if (!payouts || payouts.length === 0) {
    return (
      <Center py={8}>
        <VStack spacing={3}>
          <Box color="whiteAlpha.400">
            <Wallet size={48} />
          </Box>
          <Text color="whiteAlpha.600" fontSize="sm">
            No payouts yet
          </Text>
          <Text color="whiteAlpha.500" fontSize="xs" textAlign="center">
            Payouts are processed monthly by the 7th
          </Text>
        </VStack>
      </Center>
    );
  }

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': 'yellow',
      'processing': 'blue',
      'completed': 'green',
      'failed': 'red'
    };
    return colorMap[status] || 'gray';
  };

  return (
    <TableContainer>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th color="whiteAlpha.700" fontSize="xs" borderColor="#333">Period</Th>
            <Th color="whiteAlpha.700" fontSize="xs" borderColor="#333" display={{ base: "none", md: "table-cell" }}>Method</Th>
            <Th color="whiteAlpha.700" fontSize="xs" borderColor="#333">Amount</Th>
            <Th color="whiteAlpha.700" fontSize="xs" borderColor="#333">Status</Th>
            <Th color="whiteAlpha.700" fontSize="xs" borderColor="#333" display={{ base: "none", sm: "table-cell" }}>Date</Th>
          </Tr>
        </Thead>
        <Tbody>
          {payouts.map((payout, index) => (
            <Tr key={payout.id || index}>
              <Td borderColor="#333" py={3} fontSize={{ base: "xs", md: "sm" }}>
                <VStack align="start" spacing={1}>
                  <Text color="white" fontSize="sm" fontWeight="medium">
                    {new Date(payout.period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="xs" display={{ base: "block", md: "none" }}>
                    {payout.payout_method?.charAt(0).toUpperCase() + payout.payout_method?.slice(1)}
                  </Text>
                </VStack>
              </Td>
              <Td borderColor="#333" py={3} display={{ base: "none", md: "table-cell" }}>
                <Text color="whiteAlpha.700" fontSize="sm">
                  {payout.payout_method?.charAt(0).toUpperCase() + payout.payout_method?.slice(1)}
                </Text>
              </Td>
              <Td borderColor="#333" py={3}>
                <Text color="#00C6E0" fontSize="sm" fontWeight="medium">
                  {formatCurrency(payout.payout_amount)}
                </Text>
              </Td>
              <Td borderColor="#333" py={3}>
                <Badge
                  colorScheme={getStatusColor(payout.status)}
                  variant="subtle"
                  fontSize="xs"
                >
                  {payout.status?.charAt(0).toUpperCase() + payout.status?.slice(1)}
                </Badge>
              </Td>
              <Td borderColor="#333" py={3} display={{ base: "none", sm: "table-cell" }}>
                <Text color="whiteAlpha.600" fontSize="xs">
                  {payout.payout_date ? formatDate(payout.payout_date) : 'Pending'}
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
            {programInfo?.tracking_period || '15 days'}
          </Text>
        </HStack>
        
        <HStack justify="space-between">
          <Text color="whiteAlpha.700" fontSize="sm">Payment Schedule</Text>
          <Text color="white" fontSize="sm" fontWeight="medium">
            {programInfo?.payment_schedule || 'Monthly (by 7th)'}
          </Text>
        </HStack>
        
        {programInfo?.terms_url && (
          <>
            <Divider borderColor="#333" />
            <Link
              href={programInfo.terms_url}
              isExternal
              color="#00C6E0"
              fontSize="sm"
              _hover={{ textDecoration: "underline" }}
            >
              <HStack>
                <FileText size={14} />
                <Text>Terms & Conditions</Text>
                <ExternalLink size={12} />
              </HStack>
            </Link>
          </>
        )}
      </VStack>
    </CardBody>
  </MotionCard>
);

// Main Dashboard Component
const AffiliateDashboard = () => {
  const [copyingLink, setCopyingLink] = useState(false);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(false);
  const { isOpen: isPayoutModalOpen, onOpen: onPayoutModalOpen, onClose: onPayoutModalClose } = useDisclosure();
  const toast = useToast();
  
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

  const fetchPayoutHistory = async () => {
    setIsLoadingPayouts(true);
    try {
      const response = await affiliateService.getPayoutHistory({ page: 1, limit: 12 });
      setPayoutHistory(response.payouts || []);
    } catch (error) {
      console.error('Error fetching payout history:', error);
      toast({
        title: "Error loading payout history",
        description: error.response?.data?.detail || error.message || "Please try again later",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingPayouts(false);
    }
  };

  const handleUpdatePayoutMethod = async (method, details) => {
    try {
      await affiliateService.updatePayoutMethod(method, details);
      
      toast({
        title: "Payout method updated",
        description: `Your payout method has been set to ${method.charAt(0).toUpperCase() + method.slice(1)}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Refetch dashboard to update payout info
      refetchDashboard();
    } catch (error) {
      console.error('Error updating payout method:', error);
      toast({
        title: "Error updating payout method",
        description: error.response?.data?.detail || error.message || "Please try again later",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
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
  const payoutInfo = dashboard?.payout_info;

  return (
    <Box>
      {/* Stats Grid - Mobile First */}
      <SimpleGrid 
        columns={{ base: 2, md: 4 }} 
        spacing={{ base: 3, md: 6 }} 
        mb={{ base: 6, md: 8 }}
      >
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
          subtitle="By the 7th"
        />
      </SimpleGrid>

      {/* Referral Link - Mobile Optimized */}
      <Box mb={{ base: 6, md: 8 }}>
        <ReferralLinkCard
          referralLink={affiliateData?.referral_link}
          onCopy={handleCopyLink}
          isCopying={copyingLink}
        />
      </Box>

      {/* Tabbed Interface - Mobile First */}
      <Tabs 
        variant="soft-rounded" 
        colorScheme="cyan"
        isLazy
        index={0}
        onChange={(index) => {
          if (index === 1) {
            fetchPayoutHistory();
          }
        }}
      >
        <TabList 
          mb={6} 
          gap={{ base: 2, md: 4 }}
          overflowX="auto"
          sx={{
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none'
          }}
        >
          <Tab 
            color="whiteAlpha.700" 
            _selected={{ 
              color: "#00C6E0", 
              bg: "rgba(0, 198, 224, 0.1)",
              borderColor: "#00C6E0"
            }}
            fontSize={{ base: "sm", md: "md" }}
            px={{ base: 4, md: 6 }}
            py={{ base: 2, md: 3 }}
            minW="fit-content"
            whiteSpace="nowrap"
          >
            <HStack spacing={2}>
              <TrendingUp size={16} />
              <Text>Recent Referrals</Text>
            </HStack>
          </Tab>
          
          <Tab 
            color="whiteAlpha.700" 
            _selected={{ 
              color: "#00C6E0", 
              bg: "rgba(0, 198, 224, 0.1)",
              borderColor: "#00C6E0"
            }}
            fontSize={{ base: "sm", md: "md" }}
            px={{ base: 4, md: 6 }}
            py={{ base: 2, md: 3 }}
            minW="fit-content"
            whiteSpace="nowrap"
          >
            <HStack spacing={2}>
              <History size={16} />
              <Text>Payout History</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Recent Referrals Tab */}
          <TabPanel p={0}>
            <VStack spacing={{ base: 4, md: 6 }} align="stretch">
              {/* Recent Referrals Table */}
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                bg="#1a1a1a"
                border="1px solid #333"
                borderRadius="lg"
              >
                <CardHeader pb={{ base: 2, md: 4 }}>
                  <HStack justify="space-between">
                    <HStack>
                      <Box
                        bg="rgba(0, 198, 224, 0.2)"
                        p={2}
                        borderRadius="md"
                      >
                        <TrendingUp size={18} color="#00C6E0" />
                      </Box>
                      <Text color="#00C6E0" fontSize={{ base: "sm", md: "md" }} fontWeight="semibold">
                        RECENT REFERRALS
                      </Text>
                    </HStack>
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

              {/* Program Info - Mobile Layout */}
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 4, md: 6 }}>
                <ProgramInfo programInfo={programInfo} />
                
                {/* Payout Settings Card */}
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
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
                          <Settings size={18} color="#00C6E0" />
                        </Box>
                        <Text color="#00C6E0" fontSize="sm" fontWeight="semibold">
                          PAYOUT SETTINGS
                        </Text>
                      </HStack>
                    </HStack>
                  </CardHeader>
                  
                  <CardBody pt={0}>
                    <VStack align="stretch" spacing={4}>
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.700" fontSize="sm">Current Method</Text>
                        <Text color="white" fontSize="sm" fontWeight="medium">
                          {payoutInfo?.payout_method || 'Not configured'}
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.700" fontSize="sm">Next Payout</Text>
                        <Text color="white" fontSize="sm" fontWeight="medium">
                          {payoutInfo?.next_payout_date}
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text color="whiteAlpha.700" fontSize="sm">Minimum</Text>
                        <Text color="white" fontSize="sm" fontWeight="medium">
                          {formatCurrency(payoutInfo?.minimum_payout)}
                        </Text>
                      </HStack>
                      
                      <Button
                        size="sm"
                        bg="#00C6E0"
                        color="white"
                        leftIcon={<Wallet size={14} />}
                        onClick={onPayoutModalOpen}
                        _hover={{ bg: "#00A3B8" }}
                        w="full"
                      >
                        Configure Payout Method
                      </Button>
                    </VStack>
                  </CardBody>
                </MotionCard>
              </SimpleGrid>
            </VStack>
          </TabPanel>

          {/* Payout History Tab */}
          <TabPanel p={0}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
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
                      <History size={18} color="#00C6E0" />
                    </Box>
                    <Text color="#00C6E0" fontSize="sm" fontWeight="semibold">
                      PAYOUT HISTORY
                    </Text>
                  </HStack>
                </HStack>
              </CardHeader>
              
              <CardBody pt={0}>
                <PayoutHistoryTable
                  payouts={payoutHistory}
                  isLoading={isLoadingPayouts}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              </CardBody>
            </MotionCard>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Payout Method Configuration Modal */}
      <PayoutMethodModal
        isOpen={isPayoutModalOpen}
        onClose={onPayoutModalClose}
        currentMethod={payoutInfo?.payout_method}
        currentDetails={payoutInfo?.payout_details}
        onUpdateMethod={handleUpdatePayoutMethod}
      />
    </Box>
  );
};

export default AffiliateDashboard;