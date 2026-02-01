import React, { useState, useEffect } from 'react';
import {
  Box, Flex, VStack, HStack, Text, Button, SimpleGrid,
  Spinner, FormLabel, useToast
} from '@chakra-ui/react';
import {
  Zap, User, CreditCard, DollarSign, Shield,
  CheckCircle, ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/services/axiosConfig';
import StripeConnectEmbed from '@/components/features/creators/StripeConnectEmbed';

const MotionBox = motion(Box);

// Reuse the same styled containers from SettingsPage
const DarkCard = ({ children, ...props }) => (
  <Box bg="#121212" border="1px solid #333" borderRadius="md" overflow="hidden" {...props}>
    {children}
  </Box>
);

const SectionContainer = ({ icon: Icon, title, children }) => (
  <DarkCard p={{ base: 4, md: 6 }} mb={{ base: 4, md: 8 }}>
    <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="semibold" color="white" mb={{ base: 4, md: 6 }}>
      <Flex align="center" gap={2}>
        <Icon size={20} color="#00C6E0" />
        <span>{title}</span>
      </Flex>
    </Text>
    {children}
  </DarkCard>
);

const FormInput = ({ label, helperText, value, onChange, ...props }) => (
  <Box>
    <FormLabel color="whiteAlpha.900" fontSize="sm" fontWeight="medium">{label}</FormLabel>
    <Box
      as="input"
      bg="#1a1a1a"
      border="1px solid #333"
      borderRadius="md"
      color="white"
      p={3}
      w="100%"
      fontSize="sm"
      value={value}
      onChange={onChange}
      _hover={{ borderColor: '#444' }}
      _focus={{ borderColor: '#00C6E0', outline: 'none' }}
      {...props}
    />
    {helperText && (
      <Text color="whiteAlpha.600" fontSize="xs" mt={1}>{helperText}</Text>
    )}
  </Box>
);

/**
 * CreatorOnboardingFlow
 * Extracted from SettingsPage.js CreatorSettingsFlow.
 * Preserves the exact same 3-step onboarding logic and API calls.
 *
 * Props:
 *   user - current user object
 *   onComplete - callback when onboarding finishes (transitions to dashboard)
 */
const CreatorOnboardingFlow = ({ user, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [creatorData, setCreatorData] = useState({
    bio: '',
    trading_experience: 'intermediate'
  });
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true);
  const toast = useToast();
  const { updateUserProfile } = useAuth();

  const isCreator = user?.creator_profile_id != null;

  // Load onboarding status on mount
  useEffect(() => {
    const loadOnboardingStatus = async () => {
      try {
        const response = await axiosInstance.get('/api/v1/creators/onboarding-status');
        const { onboarding_step, onboarding_data, is_creator } = response.data;

        if (is_creator) {
          if (onboarding_step === 3) {
            setCurrentStep(3);
            if (onboarding_data) setCreatorData(onboarding_data);
          } else {
            // Already a creator and onboarding complete — tell parent
            if (onComplete) onComplete();
            return;
          }
        } else if (onboarding_step) {
          setCurrentStep(onboarding_step);
          if (onboarding_data) setCreatorData(onboarding_data);
        } else {
          setCurrentStep(1);
        }
      } catch (error) {
        console.error('Failed to load onboarding status:', error);
        setCurrentStep(1);
      } finally {
        setIsLoadingOnboarding(false);
      }
    };

    loadOnboardingStatus();
  }, [onComplete]);

  // Save step progress
  const saveOnboardingStep = async (step, data = null) => {
    try {
      await axiosInstance.post('/api/v1/creators/update-onboarding-step', { step, data });
    } catch (error) {
      console.error(`Failed to save onboarding step ${step}:`, error);
      toast({
        title: 'Failed to save progress',
        description: error.response?.data?.detail || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };

  const completeOnboarding = async () => {
    try {
      await axiosInstance.post('/api/v1/creators/complete-onboarding');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const handleCreateCreatorProfile = async () => {
    setIsCreatingProfile(true);
    try {
      if (isCreator) {
        setCurrentStep(3);
        return;
      }

      const profileResponse = await axiosInstance.post('/api/v1/creators/become-creator', {
        bio: creatorData.bio,
        trading_experience: creatorData.trading_experience
      });

      if (profileResponse.data.id) {
        updateUserProfile({ creator_profile_id: profileResponse.data.id });
      }

      setCurrentStep(3);
      try { await saveOnboardingStep(3, creatorData); } catch (e) { /* non-blocking */ }

      toast({
        title: 'Profile created!',
        description: 'Now let\'s set up your payment details',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Creator setup error:', error);
      toast({
        title: 'Setup failed',
        description: error.response?.data?.detail || error.message || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreatingProfile(false);
    }
  };

  // Skip to Stripe if already a creator
  useEffect(() => {
    if (isCreator && currentStep < 3) {
      setCurrentStep(3);
    }
  }, [isCreator, currentStep]);

  if (isLoadingOnboarding) {
    return (
      <SectionContainer icon={Zap} title="Creator">
        <Box p={8} textAlign="center">
          <Spinner color="#00C6E0" size="lg" />
          <Text color="whiteAlpha.600" mt={4}>Loading your creator status...</Text>
        </Box>
      </SectionContainer>
    );
  }

  // --- Step Rendering ---
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SectionContainer icon={Zap} title="Join the Creator Program">
            <VStack spacing={8} align="stretch">
              <Box
                bg="linear-gradient(135deg, rgba(0, 198, 224, 0.1) 0%, rgba(0, 198, 224, 0.05) 100%)"
                p={8}
                borderRadius="lg"
                border="1px solid rgba(0, 198, 224, 0.3)"
                position="relative"
                overflow="hidden"
              >
                <Box
                  position="absolute"
                  top="-50%"
                  right="-20%"
                  width="300px"
                  height="300px"
                  bg="radial-gradient(circle, rgba(0, 198, 224, 0.2) 0%, transparent 70%)"
                  borderRadius="full"
                  filter="blur(40px)"
                />
                <VStack spacing={6} align="center" position="relative" textAlign="center">
                  <Box color="#00C6E0"><Zap size={48} /></Box>
                  <VStack spacing={3}>
                    <Text color="white" fontSize="2xl" fontWeight="bold">
                      Monetize Your Trading Expertise
                    </Text>
                    <Text color="whiteAlpha.700" fontSize="lg">
                      Share strategies, build a following, earn recurring revenue
                    </Text>
                    <Text color="whiteAlpha.600" fontSize="sm" maxW="md">
                      Join thousands of traders who are earning passive income by sharing their
                      proven trading strategies with our community.
                    </Text>
                  </VStack>
                </VStack>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {[
                  { icon: DollarSign, title: 'Recurring Revenue', desc: 'Earn monthly subscription fees from traders who follow your strategies.' },
                  { icon: User, title: 'Build Your Brand', desc: 'Establish yourself as a thought leader in the trading community.' },
                  { icon: Zap, title: 'Easy Setup', desc: 'Get started in minutes with our streamlined onboarding process.' }
                ].map((benefit) => (
                  <Box key={benefit.title} bg="#1a1a1a" p={6} borderRadius="lg" border="1px solid #333">
                    <VStack align="start" spacing={4}>
                      <Box bg="rgba(0, 198, 224, 0.2)" p={3} borderRadius="md">
                        <benefit.icon size={24} color="#00C6E0" />
                      </Box>
                      <VStack align="start" spacing={2}>
                        <Text color="white" fontSize="lg" fontWeight="semibold">{benefit.title}</Text>
                        <Text color="whiteAlpha.700" fontSize="sm">{benefit.desc}</Text>
                      </VStack>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>

              <HStack justify="center">
                <Button
                  size="lg"
                  bg="#00C6E0"
                  color="white"
                  px={8}
                  _hover={{ bg: '#00A3B8' }}
                  leftIcon={<Zap size={20} />}
                  onClick={async () => {
                    setCurrentStep(2);
                    try { await saveOnboardingStep(2); } catch (e) { /* non-blocking */ }
                  }}
                >
                  Get Started
                </Button>
              </HStack>
            </VStack>
          </SectionContainer>
        );

      case 2:
        return (
          <SectionContainer icon={User} title="Set Up Your Creator Profile">
            <VStack spacing={6} align="stretch">
              <Box>
                <Text color="white" fontSize="lg" fontWeight="semibold" mb={2}>Tell us about yourself</Text>
                <Text color="whiteAlpha.600" fontSize="sm" mb={6}>
                  This information will be displayed on your creator profile.
                </Text>
              </Box>

              <VStack spacing={4} align="stretch">
                <FormInput
                  label="Bio"
                  value={creatorData.bio}
                  onChange={(e) => setCreatorData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell your audience about your trading experience..."
                  helperText="Share your trading background and what makes your strategies unique"
                />
                <Box>
                  <FormLabel color="white" fontSize="sm" fontWeight="medium" mb={2}>
                    Trading Experience Level
                  </FormLabel>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                    {['beginner', 'intermediate', 'expert'].map((level) => (
                      <Button
                        key={level}
                        variant={creatorData.trading_experience === level ? 'solid' : 'outline'}
                        bg={creatorData.trading_experience === level ? '#00C6E0' : 'transparent'}
                        color={creatorData.trading_experience === level ? 'white' : 'whiteAlpha.700'}
                        borderColor="#333"
                        _hover={{
                          bg: creatorData.trading_experience === level ? '#00A3B8' : 'rgba(0, 198, 224, 0.1)',
                          borderColor: '#00C6E0'
                        }}
                        onClick={() => setCreatorData(prev => ({ ...prev, trading_experience: level }))}
                        textTransform="capitalize"
                      >
                        {level}
                      </Button>
                    ))}
                  </SimpleGrid>
                </Box>
              </VStack>

              <HStack justify="space-between" pt={4}>
                <Button
                  variant="ghost"
                  color="whiteAlpha.600"
                  onClick={async () => {
                    setCurrentStep(1);
                    try { await saveOnboardingStep(1); } catch (e) { /* non-blocking */ }
                  }}
                  leftIcon={<ArrowLeft size={16} />}
                >
                  Back
                </Button>
                <Button
                  bg="#00C6E0"
                  color="white"
                  _hover={{ bg: '#00A3B8' }}
                  onClick={handleCreateCreatorProfile}
                  isDisabled={!creatorData.bio.trim()}
                  isLoading={isCreatingProfile}
                  loadingText="Creating profile..."
                >
                  Continue to Payment Setup
                </Button>
              </HStack>
            </VStack>
          </SectionContainer>
        );

      case 3:
        return (
          <SectionContainer icon={CreditCard} title="Set Up Payments">
            <VStack spacing={6} align="stretch">
              <Box>
                <Text color="white" fontSize="lg" fontWeight="semibold" mb={2}>Complete your payment setup</Text>
                <Text color="whiteAlpha.600" fontSize="sm" mb={6}>
                  Fill out the secure form below to start receiving payments. This information is
                  handled entirely by Stripe - we never see your banking details.
                </Text>
              </Box>

              <StripeConnectEmbed
                onComplete={async (status) => {
                  console.log('Stripe onboarding complete:', status);
                  await completeOnboarding();
                  setCurrentStep('success');

                  setTimeout(async () => {
                    try {
                      const response = await axiosInstance.get('/api/v1/auth/me');
                      if (response.data?.creator_profile_id && updateUserProfile) {
                        updateUserProfile(response.data);
                      }
                    } catch (error) {
                      console.error('Failed to refresh user data:', error);
                    }

                    if (onComplete) onComplete();
                  }, 4000);
                }}
                onError={(error) => {
                  console.error('Stripe onboarding error:', error);
                  toast({
                    title: 'Setup error',
                    description: 'Please try again or contact support',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                  });
                }}
              />

              <HStack justify="space-between" pt={4}>
                <Button
                  variant="ghost"
                  color="whiteAlpha.600"
                  leftIcon={<ArrowLeft size={16} />}
                  isDisabled
                >
                  Back
                </Button>
                <Text color="whiteAlpha.500" fontSize="xs">
                  Complete the form above to finish setup
                </Text>
              </HStack>
            </VStack>
          </SectionContainer>
        );

      case 'success':
        return (
          <SectionContainer icon={CheckCircle} title="Welcome to the Creator Program!">
            <VStack spacing={8} align="center">
              <MotionBox
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'backOut' }}
              >
                <Box
                  bg="linear-gradient(135deg, rgba(0, 198, 224, 0.2) 0%, rgba(0, 198, 224, 0.1) 100%)"
                  p={8}
                  borderRadius="full"
                  border="1px solid rgba(0, 198, 224, 0.3)"
                >
                  <CheckCircle size={64} color="#00C6E0" />
                </Box>
              </MotionBox>

              <VStack spacing={4} textAlign="center">
                <Text color="white" fontSize="2xl" fontWeight="bold">Setup Complete!</Text>
                <Text color="whiteAlpha.700" fontSize="lg" maxW="md">
                  Your payment account is ready. You can start monetizing your trading strategies immediately.
                </Text>
              </VStack>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full" maxW="2xl">
                {[
                  { icon: DollarSign, title: 'Start Earning', desc: 'Monetize your strategies with subscription pricing' },
                  { icon: Shield, title: 'Secure Payments', desc: 'Powered by Stripe with automatic payouts' },
                  { icon: Zap, title: 'Full Control', desc: 'Manage pricing, payouts, and analytics' }
                ].map((item) => (
                  <Box key={item.title} bg="#1a1a1a" p={4} borderRadius="lg" border="1px solid #333" textAlign="center">
                    <item.icon size={32} color="#00C6E0" style={{ margin: '0 auto 12px' }} />
                    <Text color="white" fontSize="md" fontWeight="semibold" mb={2}>{item.title}</Text>
                    <Text color="whiteAlpha.600" fontSize="sm">{item.desc}</Text>
                  </Box>
                ))}
              </SimpleGrid>

              <VStack spacing={3}>
                <Text color="whiteAlpha.600" fontSize="sm">Redirecting to your creator dashboard...</Text>
                <Spinner size="sm" color="#00C6E0" />
              </VStack>
            </VStack>
          </SectionContainer>
        );

      default:
        return null;
    }
  };

  return (
    <VStack spacing={8} align="stretch">
      {/* Progress indicator */}
      {currentStep !== 'success' && (
        <Box>
          <HStack spacing={4} justify="center" mb={2}>
            {[1, 2, 3].map((step) => (
              <HStack key={step} spacing={2}>
                <Box
                  w="8"
                  h="8"
                  borderRadius="full"
                  bg={currentStep >= step ? '#00C6E0' : '#333'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  transition="all 0.3s"
                >
                  <Text
                    color={currentStep >= step ? 'white' : 'whiteAlpha.600'}
                    fontSize="sm"
                    fontWeight="semibold"
                  >
                    {step}
                  </Text>
                </Box>
                {step < 3 && (
                  <Box w="12" h="1" bg={currentStep > step ? '#00C6E0' : '#333'} transition="all 0.3s" />
                )}
              </HStack>
            ))}
          </HStack>
          <HStack justify="center">
            <Text color="whiteAlpha.600" fontSize="xs">Step {currentStep} of 3</Text>
          </HStack>
        </Box>
      )}

      {renderStep()}
    </VStack>
  );
};

export default CreatorOnboardingFlow;
