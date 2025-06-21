// src/components/affiliate/BecomeAffiliateModal.js
import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  List,
  ListItem,
  ListIcon,
  Divider,
  Alert,
  AlertIcon,
  Badge,
  SimpleGrid
} from '@chakra-ui/react';
import {
  Check,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Star,
  Shield,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

// Feature highlight component
const FeatureCard = ({ icon: Icon, title, description, highlight = false }) => (
  <MotionBox
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    bg={highlight ? "rgba(0, 198, 224, 0.1)" : "#1a1a1a"}
    border="1px solid"
    borderColor={highlight ? "rgba(0, 198, 224, 0.3)" : "#333"}
    borderRadius="lg"
    p={4}
    position="relative"
    overflow="hidden"
  >
    {highlight && (
      <Badge
        position="absolute"
        top={2}
        right={2}
        colorScheme="cyan"
        variant="solid"
        fontSize="xs"
      >
        Best Value
      </Badge>
    )}
    
    <VStack align="start" spacing={3}>
      <HStack>
        <Box
          bg={highlight ? "rgba(0, 198, 224, 0.2)" : "rgba(255, 255, 255, 0.1)"}
          p={2}
          borderRadius="md"
        >
          <Icon size={18} color={highlight ? "#00C6E0" : "white"} />
        </Box>
        <Text 
          color={highlight ? "#00C6E0" : "white"} 
          fontSize="sm" 
          fontWeight="semibold"
        >
          {title}
        </Text>
      </HStack>
      <Text color="whiteAlpha.700" fontSize="xs" lineHeight="1.4">
        {description}
      </Text>
    </VStack>
  </MotionBox>
);

const BecomeAffiliateModal = ({ 
  isOpen, 
  onClose, 
  onJoin, 
  isJoining = false 
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered 
      size="xl"
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
      <ModalContent 
        bg="#121212" 
        border="1px solid #333" 
        borderRadius="xl" 
        mx={4}
        maxW="600px"
      >
        <ModalHeader color="white" pb={2}>
          <VStack align="start" spacing={2}>
            <HStack>
              <Box
                bg="rgba(0, 198, 224, 0.2)"
                p={2}
                borderRadius="md"
              >
                <DollarSign size={20} color="#00C6E0" />
              </Box>
              <Text fontSize="lg">Join Our Affiliate Program</Text>
            </HStack>
            <Text fontSize="sm" color="whiteAlpha.700" fontWeight="normal">
              Earn 20% lifetime recurring commissions by referring new users
            </Text>
          </VStack>
        </ModalHeader>
        
        <ModalCloseButton color="white" />
        
        <ModalBody py={6}>
          <VStack spacing={6} align="stretch">
            {/* Commission Highlight */}
            <MotionBox
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              bg="linear-gradient(135deg, rgba(0, 198, 224, 0.2) 0%, rgba(0, 198, 224, 0.1) 100%)"
              border="2px solid #00C6E0"
              borderRadius="lg"
              p={6}
              textAlign="center"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="-50%"
                right="-20%"
                width="200px"
                height="200px"
                bg="radial-gradient(circle, rgba(0, 198, 224, 0.3) 0%, transparent 70%)"
                borderRadius="full"
                filter="blur(40px)"
              />
              
              <VStack spacing={3} position="relative">
                <Box color="#00C6E0">
                  <Star size={32} fill="currentColor" />
                </Box>
                <Text color="#00C6E0" fontSize="2xl" fontWeight="bold">
                  20% Commission
                </Text>
                <Text color="white" fontSize="sm" fontWeight="medium">
                  Lifetime Recurring Revenue
                </Text>
                <Text color="whiteAlpha.700" fontSize="xs" textAlign="center">
                  Earn commissions for as long as your referrals remain subscribed
                </Text>
              </VStack>
            </MotionBox>

            {/* Key Features Grid */}
            <Box>
              <Text color="white" fontSize="sm" fontWeight="semibold" mb={4}>
                Program Highlights
              </Text>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FeatureCard
                  icon={DollarSign}
                  title="High Commissions"
                  description="20% on all subscription plans - one of the highest rates in the industry"
                  highlight={true}
                />
                
                <FeatureCard
                  icon={Calendar}
                  title="Monthly Payouts"
                  description="Automatic payments on the 1st of every month via Stripe"
                />
                
                <FeatureCard
                  icon={TrendingUp}
                  title="Lifetime Value"
                  description="Earn commissions for the entire lifetime of your referrals"
                />
                
                <FeatureCard
                  icon={Shield}
                  title="Reliable Tracking"
                  description="90-day cookie window ensures you get credit for your referrals"
                />
              </SimpleGrid>
            </Box>

            {/* How It Works */}
            <Box>
              <Text color="white" fontSize="sm" fontWeight="semibold" mb={4}>
                How It Works
              </Text>
              
              <VStack spacing={3} align="stretch">
                <HStack align="start" spacing={3}>
                  <Box
                    bg="rgba(0, 198, 224, 0.2)"
                    minW="24px"
                    h="24px"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mt={0.5}
                  >
                    <Text color="#00C6E0" fontSize="xs" fontWeight="bold">1</Text>
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text color="white" fontSize="sm" fontWeight="medium">
                      Get your unique referral link
                    </Text>
                    <Text color="whiteAlpha.600" fontSize="xs">
                      Share it on social media, blogs, or directly with potential users
                    </Text>
                  </VStack>
                </HStack>
                
                <HStack align="start" spacing={3}>
                  <Box
                    bg="rgba(0, 198, 224, 0.2)"
                    minW="24px"
                    h="24px"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mt={0.5}
                  >
                    <Text color="#00C6E0" fontSize="xs" fontWeight="bold">2</Text>
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text color="white" fontSize="sm" fontWeight="medium">
                      Users sign up through your link
                    </Text>
                    <Text color="whiteAlpha.600" fontSize="xs">
                      We track referrals for up to 90 days after their first visit
                    </Text>
                  </VStack>
                </HStack>
                
                <HStack align="start" spacing={3}>
                  <Box
                    bg="rgba(0, 198, 224, 0.2)"
                    minW="24px"
                    h="24px"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mt={0.5}
                  >
                    <Text color="#00C6E0" fontSize="xs" fontWeight="bold">3</Text>
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text color="white" fontSize="sm" fontWeight="medium">
                      Earn 20% commission for life
                    </Text>
                    <Text color="whiteAlpha.600" fontSize="xs">
                      Receive monthly payouts as long as your referrals stay subscribed
                    </Text>
                  </VStack>
                </HStack>
              </VStack>
            </Box>

            {/* Terms Notice */}
            <Alert status="info" bg="rgba(0, 198, 224, 0.1)" border="1px solid rgba(0, 198, 224, 0.3)">
              <AlertIcon color="#00C6E0" />
              <Box>
                <Text color="white" fontSize="xs">
                  By joining our affiliate program, you agree to our affiliate terms and conditions. 
                  Minimum payout threshold is $50.
                </Text>
              </Box>
            </Alert>
          </VStack>
        </ModalBody>

        <ModalFooter pt={6}>
          <HStack spacing={3} width="full" justify="flex-end">
            <Button
              variant="ghost"
              color="whiteAlpha.700"
              onClick={onClose}
              isDisabled={isJoining}
            >
              Maybe Later
            </Button>
            <Button
              bg="#00C6E0"
              color="white"
              _hover={{ bg: "#00A3B8" }}
              _active={{ bg: "#008A9E" }}
              leftIcon={<Zap size={16} />}
              onClick={onJoin}
              isLoading={isJoining}
              loadingText="Joining..."
              px={6}
            >
              Join Affiliate Program
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BecomeAffiliateModal;