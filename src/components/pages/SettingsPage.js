import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  useToast,
  FormControl,
  FormLabel,
  Avatar,
  IconButton,
  Link,
  Divider,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormHelperText,
  InputLeftElement,
  SimpleGrid,
  Switch,
  Spinner,
  Center,
  Editable,
  EditableInput,
  EditablePreview,
  Tooltip,
  useEditableControls
} from '@chakra-ui/react';
import { 
  User, 
  CreditCard,
  Save,
  Edit,
  Edit2,
  Check,
  X,
  ChevronRight,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Mail,
  AtSign,
  Twitter,
  Youtube,
  Instagram,
  MessageCircle,
  ExternalLink,
  CheckCircle,
  Info,
  Zap,
  Shield,
  FileText,
  RefreshCw,
  ArrowLeft,
  DollarSign,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/services/axiosConfig';
import { ProfilePicture } from '@/components/common/ProfilePicture';
import { AffiliateDashboard, BecomeAffiliateModal } from '@/components/affiliate';
import { useAffiliate } from '@/hooks/useAffiliate';
import StripeConnectEmbed from '@/components/features/creators/StripeConnectEmbed';
import StripeAccountManagement from '@/components/features/creators/StripeAccountManagement';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

// Custom X (formerly Twitter) icon component
const XIcon = ({ size = 20, ...props }) => (
  <Box 
    as="svg" 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    color="currentColor"
    fill="currentColor"
    {...props}
  >
    <path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
    />
  </Box>
);

// Custom TikTok icon component
const TikTokIcon = ({ size = 20, ...props }) => (
  <Box 
    as="svg" 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    color="currentColor"
    fill="currentColor"
    {...props}
  >
    <path
      d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64c0 3.33 2.76 5.7 5.69 5.7c3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"
    />
  </Box>
);

const MenuItem = ({ icon: Icon, label, isSelected, onClick }) => (
  <Button
    variant="ghost"
    justifyContent="flex-start"
    width="full"
    height="auto"
    py={3}
    px={4}
    bg={isSelected ? "#1a1a1a" : "transparent"}
    color="white"
    _hover={{ bg: "#1a1a1a" }}
    _active={{ bg: "#252525" }}
    leftIcon={<Icon size={16} color={isSelected ? "#00C6E0" : "white"} />}
    rightIcon={<ChevronRight size={14} opacity={0.5} />}
    onClick={onClick}
    position="relative"
    overflow="hidden"
    borderLeft="2px solid"
    borderColor={isSelected ? "#00C6E0" : "transparent"}
    borderRadius="0"
  >
    <Text fontSize="sm">{label}</Text>
  </Button>
);

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

const FormInput = ({ label, helperText, icon: Icon, initialValue = "", fieldName, onSave, ...props }) => {
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = (e) => {
    setValue(e.target.value);
    setHasChanged(e.target.value !== initialValue);
  };

  const handleBlur = async () => {
    if (!hasChanged) return;
    
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(fieldName, value);
      }
      setHasChanged(false);
      
      toast({
        title: `${label} updated`,
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right"
      });
    } catch (error) {
      console.error(`Error saving ${fieldName}:`, error);
      toast({
        title: `Failed to update ${label.toLowerCase()}`,
        description: error.response?.data?.detail || error.message || "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setValue(initialValue); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormControl>
      <FormLabel color="whiteAlpha.900" fontSize="sm" fontWeight="medium">
        {label}
        {isSaving && <Spinner size="xs" ml={2} color="#00C6E0" />}
      </FormLabel>
      <InputGroup>
        {Icon && (
          <InputLeftElement pointerEvents="none">
            <Icon size={16} color="rgba(255, 255, 255, 0.5)" />
          </InputLeftElement>
        )}
        <Input
          bg="#1a1a1a"
          border="1px solid #333"
          borderColor={hasChanged ? "#00C6E0" : "#333"}
          color="white"
          pl={Icon ? 10 : 4}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          _hover={{ borderColor: hasChanged ? "#00C6E0" : "#444" }}
          _focus={{ 
            borderColor: "#00C6E0",
            boxShadow: "none"
          }}
          {...props}
        />
        {hasChanged && (
          <InputRightElement>
            <Tooltip label="Changes will be saved when you click outside this field">
              <Box color="#00C6E0">
                <Info size={16} />
              </Box>
            </Tooltip>
          </InputRightElement>
        )}
      </InputGroup>
      {helperText && (
        <FormHelperText color="whiteAlpha.600" fontSize="xs">
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

const PasswordInput = ({ label, ...props }) => {
  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);

  return (
    <FormControl>
      <FormLabel color="whiteAlpha.900" fontSize="sm" fontWeight="medium">{label}</FormLabel>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <Lock size={16} color="rgba(255, 255, 255, 0.5)" />
        </InputLeftElement>
        <Input
          bg="#1a1a1a"
          border="1px solid #333"
          borderColor="#333"
          color="white"
          pl={10}
          type={show ? 'text' : 'password'}
          _hover={{ borderColor: "#444" }}
          _focus={{ 
            borderColor: "#00C6E0",
            boxShadow: "none"
          }}
          {...props}
        />
        <InputRightElement>
          <IconButton
            aria-label={show ? 'Hide password' : 'Show password'}
            h="1.75rem"
            size="sm"
            variant="ghost"
            color="whiteAlpha.600"
            _hover={{ color: "white" }}
            onClick={handleClick}
            icon={show ? <EyeOff size={16} /> : <Eye size={16} />}
          />
        </InputRightElement>
      </InputGroup>
    </FormControl>
  );
};

const SocialInput = ({ icon: Icon, label, initialValue = "", fieldName, onSave, ...props }) => {
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = (e) => {
    setValue(e.target.value);
    setHasChanged(e.target.value !== initialValue);
  };

  const handleBlur = async () => {
    if (!hasChanged) return;
    
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave('socialMedia', { [fieldName]: value });
      }
      setHasChanged(false);
      
      toast({
        title: `${label} updated`,
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right"
      });
    } catch (error) {
      console.error(`Error saving ${fieldName}:`, error);
      toast({
        title: `Failed to update ${label.toLowerCase()}`,
        description: error.response?.data?.detail || error.message || "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setValue(initialValue); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormControl>
      <FormLabel color="whiteAlpha.900" fontSize="sm" fontWeight="medium">
        {label}
        {isSaving && <Spinner size="xs" ml={2} color="#00C6E0" />}
      </FormLabel>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <Icon size={16} color="rgba(255, 255, 255, 0.5)" />
        </InputLeftElement>
        <Input
          bg="#1a1a1a"
          border="1px solid #333"
          borderColor={hasChanged ? "#00C6E0" : "#333"}
          color="white"
          pl={10}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          _hover={{ borderColor: hasChanged ? "#00C6E0" : "#444" }}
          _focus={{ 
            borderColor: "#00C6E0",
            boxShadow: "none"
          }}
          {...props}
        />
        {hasChanged && (
          <InputRightElement>
            <Tooltip label="Changes will be saved when you click outside this field">
              <Box color="#00C6E0">
                <Info size={16} />
              </Box>
            </Tooltip>
          </InputRightElement>
        )}
      </InputGroup>
    </FormControl>
  );
};

const SectionContainer = ({ icon: Icon, title, children }) => (
  <DarkCard p={6} mb={8}>
    <Text fontSize="lg" fontWeight="semibold" color="white" mb={6}>
      <Flex align="center" gap={2}>
        <Icon size={20} color="#00C6E0" />
        <span>{title}</span>
      </Flex>
    </Text>
    {children}
  </DarkCard>
);

const PasswordChangeModal = ({ isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Password updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Failed to update password",
        description: error.message || "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg="#121212" border="1px solid #333" borderRadius="md" mx={4}>
        <ModalHeader color="white">Change Password</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <PasswordInput
                label="Current Password"
                placeholder="Enter current password"
                required
              />
              <PasswordInput
                label="New Password"
                placeholder="Enter new password"
                required
              />
              <PasswordInput
                label="Confirm New Password"
                placeholder="Confirm new password"
                required
              />
              <Button
                type="submit"
                width="full"
                mt={4}
                bg="#00C6E0"
                color="white"
                _hover={{ bg: "#00A3B8" }}
                isLoading={isSubmitting}
              >
                Update Password
              </Button>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Creator Settings Flow Component
const CreatorSettingsFlow = ({ user }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [creatorData, setCreatorData] = useState({
    bio: '',
    trading_experience: 'intermediate'
  });
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true);
  const toast = useToast();
  const { updateUserProfile } = useAuth();
  
  // Determine if user is already a creator
  const isCreator = user?.creator_profile_id != null;

  // Load onboarding status on component mount
  React.useEffect(() => {
    const loadOnboardingStatus = async () => {
      try {
        const response = await axiosInstance.get('/api/v1/creators/onboarding-status');
        const { onboarding_step, onboarding_data, is_creator } = response.data;
        
        if (is_creator) {
          // If already a creator, show management view or skip to Stripe if incomplete
          if (onboarding_step === 3) {
            setCurrentStep(3); // Continue Stripe setup
            if (onboarding_data) {
              setCreatorData(onboarding_data);
            }
          } else {
            // Already a creator and onboarding complete, show management view
            setCurrentStep(null);
          }
        } else if (onboarding_step) {
          // Resume from saved step
          setCurrentStep(onboarding_step);
          if (onboarding_data) {
            setCreatorData(onboarding_data);
          }
        } else {
          // Start fresh
          setCurrentStep(1);
        }
      } catch (error) {
        console.error('Failed to load onboarding status:', error);
        setCurrentStep(1); // Default to start
      } finally {
        setIsLoadingOnboarding(false);
      }
    };

    loadOnboardingStatus();
  }, []);

  // Update onboarding step in database
  const saveOnboardingStep = async (step, data = null) => {
    try {
      const response = await axiosInstance.post('/api/v1/creators/update-onboarding-step', {
        step,
        data
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to save onboarding step ${step}:`, error);
      
      // Show user-friendly error
      toast({
        title: "Failed to save progress",
        description: error.response?.data?.detail || "Please check your connection and try again",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      throw error;
    }
  };

  // Complete onboarding and clear progress
  const completeOnboarding = async () => {
    try {
      await axiosInstance.post('/api/v1/creators/complete-onboarding');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  // Handle creator profile creation (now separate from Stripe)
  const handleCreateCreatorProfile = async () => {
    setIsCreatingProfile(true);
    try {
      // Check if user already has a creator profile
      if (isCreator) {
        console.log('User already has creator profile, skipping to Stripe setup');
        setCurrentStep(3);
        return;
      }

      // Create creator profile
      const profileResponse = await axiosInstance.post('/api/v1/creators/become-creator', {
        bio: creatorData.bio,
        trading_experience: creatorData.trading_experience
      });

      console.log('Creator profile created:', profileResponse.data);

      // Update user context
      if (profileResponse.data.id) {
        updateUserProfile({
          creator_profile_id: profileResponse.data.id
        });
      }

      // Move to Stripe setup step
      setCurrentStep(3);
      try {
        await saveOnboardingStep(3, creatorData);
      } catch (error) {
        console.error('Failed to save step 3:', error);
      }
      
      toast({
        title: "Profile created!",
        description: "Now let's set up your payment details",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Creator setup error:', error);
      toast({
        title: "Setup failed",
        description: error.response?.data?.detail || error.message || "Please try again",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreatingProfile(false);
    }
  };
  
  // Reset step when user navigates away and comes back
  React.useEffect(() => {
    if (isCreator && currentStep < 3) {
      setCurrentStep(3); // Skip to Stripe setup if already a creator
    }
  }, [isCreator, currentStep]);

  // Show loading state while fetching onboarding status
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

  // If already a creator and onboarding complete, show full settings view
  if (isCreator && currentStep === null) {
    return (
      <VStack spacing={8} align="stretch">
        {/* Creator Dashboard */}
        <SectionContainer icon={Zap} title="Creator Dashboard">
          <VStack spacing={6} align="stretch">
            {/* Status Badge */}
            <HStack justify="space-between" align="center">
              <HStack>
                <Box
                  bg="rgba(0, 198, 224, 0.2)"
                  p={2}
                  borderRadius="md"
                >
                  <CheckCircle size={20} color="#00C6E0" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text color="white" fontSize="md" fontWeight="semibold">
                    Creator Status: Active
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="sm">
                    You're part of the AtomikTrading Creator Program
                  </Text>
                </VStack>
              </HStack>
              <Button
                variant="outline"
                size="sm"
                color="white"
                borderColor="#333"
                _hover={{ borderColor: "#00C6E0", color: "#00C6E0" }}
              >
                View Creator Hub
              </Button>
            </HStack>

            <Divider borderColor="#333" />

            {/* Earnings Overview */}
            <Box>
              <Text color="white" fontSize="lg" fontWeight="semibold" mb={4}>
                Earnings Overview
              </Text>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Box bg="#1a1a1a" p={4} borderRadius="lg" border="1px solid #333">
                  <VStack align="start" spacing={2}>
                    <Text color="whiteAlpha.600" fontSize="sm">Total Earnings</Text>
                    <Text color="white" fontSize="xl" fontWeight="bold">$0.00</Text>
                  </VStack>
                </Box>
                <Box bg="#1a1a1a" p={4} borderRadius="lg" border="1px solid #333">
                  <VStack align="start" spacing={2}>
                    <Text color="whiteAlpha.600" fontSize="sm">This Month</Text>
                    <Text color="white" fontSize="xl" fontWeight="bold">$0.00</Text>
                  </VStack>
                </Box>
                <Box bg="#1a1a1a" p={4} borderRadius="lg" border="1px solid #333">
                  <VStack align="start" spacing={2}>
                    <Text color="whiteAlpha.600" fontSize="sm">Subscribers</Text>
                    <Text color="white" fontSize="xl" fontWeight="bold">0</Text>
                  </VStack>
                </Box>
              </SimpleGrid>
            </Box>
          </VStack>
        </SectionContainer>

        {/* Creator Profile Management */}
        <SectionContainer icon={User} title="Creator Profile">
          <VStack spacing={4} align="stretch">
            <FormInput
              label="Bio"
              placeholder="Tell your audience about your trading experience..."
              helperText="Share your trading background and expertise"
            />
            <FormInput
              label="Trading Experience"
              placeholder="e.g., 5+ years in forex and crypto markets"
              helperText="Describe your years of experience and markets you trade"
            />
          </VStack>
        </SectionContainer>

        {/* Stripe Account Management */}
        <StripeAccountManagement />
      </VStack>
    );
  }

  // First-time creator onboarding flow
  const renderOnboardingStep = () => {
    switch (currentStep) {
      case 1:
        // Welcome & Benefits
        return (
          <SectionContainer icon={Zap} title="Join the Creator Program">
            <VStack spacing={8} align="stretch">
              {/* Hero Section */}
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
                  <Box color="#00C6E0">
                    <Zap size={48} />
                  </Box>
                  
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

              {/* Benefits Grid */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <Box bg="#1a1a1a" p={6} borderRadius="lg" border="1px solid #333">
                  <VStack align="start" spacing={4}>
                    <Box bg="rgba(0, 198, 224, 0.2)" p={3} borderRadius="md">
                      <DollarSign size={24} color="#00C6E0" />
                    </Box>
                    <VStack align="start" spacing={2}>
                      <Text color="white" fontSize="lg" fontWeight="semibold">
                        Recurring Revenue
                      </Text>
                      <Text color="whiteAlpha.700" fontSize="sm">
                        Earn monthly subscription fees from traders who follow your strategies.
                      </Text>
                    </VStack>
                  </VStack>
                </Box>

                <Box bg="#1a1a1a" p={6} borderRadius="lg" border="1px solid #333">
                  <VStack align="start" spacing={4}>
                    <Box bg="rgba(0, 198, 224, 0.2)" p={3} borderRadius="md">
                      <User size={24} color="#00C6E0" />
                    </Box>
                    <VStack align="start" spacing={2}>
                      <Text color="white" fontSize="lg" fontWeight="semibold">
                        Build Your Brand
                      </Text>
                      <Text color="whiteAlpha.700" fontSize="sm">
                        Establish yourself as a thought leader in the trading community.
                      </Text>
                    </VStack>
                  </VStack>
                </Box>

                <Box bg="#1a1a1a" p={6} borderRadius="lg" border="1px solid #333">
                  <VStack align="start" spacing={4}>
                    <Box bg="rgba(0, 198, 224, 0.2)" p={3} borderRadius="md">
                      <Zap size={24} color="#00C6E0" />
                    </Box>
                    <VStack align="start" spacing={2}>
                      <Text color="white" fontSize="lg" fontWeight="semibold">
                        Easy Setup
                      </Text>
                      <Text color="whiteAlpha.700" fontSize="sm">
                        Get started in minutes with our streamlined onboarding process.
                      </Text>
                    </VStack>
                  </VStack>
                </Box>
              </SimpleGrid>

              {/* CTA */}
              <HStack justify="center">
                <Button
                  size="lg"
                  bg="#00C6E0"
                  color="white"
                  px={8}
                  _hover={{ bg: "#00A3B8" }}
                  leftIcon={<Zap size={20} />}
                  onClick={async () => {
                    setCurrentStep(2);
                    try {
                      await saveOnboardingStep(2);
                    } catch (error) {
                      console.error('Failed to save step 2:', error);
                    }
                  }}
                >
                  Get Started
                </Button>
              </HStack>
            </VStack>
          </SectionContainer>
        );

      case 2:
        // Creator Profile Setup
        return (
          <SectionContainer icon={User} title="Set Up Your Creator Profile">
            <VStack spacing={6} align="stretch">
              <Box>
                <Text color="white" fontSize="lg" fontWeight="semibold" mb={2}>
                  Tell us about yourself
                </Text>
                <Text color="whiteAlpha.600" fontSize="sm" mb={6}>
                  This information will be displayed on your creator profile to help potential 
                  subscribers understand your trading background and expertise.
                </Text>
              </Box>

              <VStack spacing={4} align="stretch">
                <FormInput
                  label="Bio"
                  value={creatorData.bio}
                  onChange={(e) => setCreatorData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell your audience about your trading experience..."
                  helperText="Share your trading background, years of experience, and what makes your strategies unique"
                />
                
                <Box>
                  <FormLabel color="white" fontSize="sm" fontWeight="medium" mb={2}>
                    Trading Experience Level
                  </FormLabel>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                    {['beginner', 'intermediate', 'expert'].map((level) => (
                      <Button
                        key={level}
                        variant={creatorData.trading_experience === level ? "solid" : "outline"}
                        bg={creatorData.trading_experience === level ? "#00C6E0" : "transparent"}
                        color={creatorData.trading_experience === level ? "white" : "whiteAlpha.700"}
                        borderColor="#333"
                        _hover={{
                          bg: creatorData.trading_experience === level ? "#00A3B8" : "rgba(0, 198, 224, 0.1)",
                          borderColor: "#00C6E0"
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
                    try {
                      await saveOnboardingStep(1);
                    } catch (error) {
                      console.error('Failed to save step 1:', error);
                    }
                  }}
                  leftIcon={<ArrowLeft size={16} />}
                >
                  Back
                </Button>
                <Button
                  bg="#00C6E0"
                  color="white"
                  _hover={{ bg: "#00A3B8" }}
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
        // Stripe Connect Setup with Embedded Components
        return (
          <SectionContainer icon={CreditCard} title="Set Up Payments">
            <VStack spacing={6} align="stretch">
              <Box>
                <Text color="white" fontSize="lg" fontWeight="semibold" mb={2}>
                  Complete your payment setup
                </Text>
                <Text color="whiteAlpha.600" fontSize="sm" mb={6}>
                  Fill out the secure form below to start receiving payments. This information is 
                  handled entirely by Stripe - we never see your banking details.
                </Text>
              </Box>

              {/* Embedded Stripe Connect Component */}
              <StripeConnectEmbed
                onComplete={async (status) => {
                  console.log('Stripe onboarding complete:', status);
                  
                  // Mark onboarding as complete
                  await completeOnboarding();
                  
                  // Show success state and redirect to creator area after longer delay
                  setCurrentStep('success');
                  
                  // Redirect to creator area after showing success for longer
                  setTimeout(() => {
                    setCurrentStep(null); // This will show the creator management interface
                  }, 4000); // Show success screen for 4 seconds
                }}
                onError={(error) => {
                  console.error('Stripe onboarding error:', error);
                  toast({
                    title: "Setup error",
                    description: "Please try again or contact support",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                  });
                }}
              />

              <HStack justify="space-between" pt={4}>
                <Button
                  variant="ghost"
                  color="whiteAlpha.600"
                  onClick={async () => {
                    setCurrentStep(2);
                    try {
                      await saveOnboardingStep(2);
                    } catch (error) {
                      console.error('Failed to save step 2:', error);
                    }
                  }}
                  leftIcon={<ArrowLeft size={16} />}
                  isDisabled // Disable back button during Stripe setup
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
        // Success screen after completion
        return (
          <SectionContainer icon={CheckCircle} title="Welcome to the Creator Program!">
            <VStack spacing={8} align="center">
              {/* Success Animation */}
              <MotionBox
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "backOut" }}
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

              {/* Success Message */}
              <VStack spacing={4} textAlign="center">
                <Text color="white" fontSize="2xl" fontWeight="bold">
                  🎉 Setup Complete!
                </Text>
                <Text color="whiteAlpha.700" fontSize="lg" maxW="md">
                  Your payment account is ready and you're now part of the creator program. 
                  You can start monetizing your trading strategies immediately.
                </Text>
              </VStack>

              {/* Success Features */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full" maxW="2xl">
                <Box bg="#1a1a1a" p={4} borderRadius="lg" border="1px solid #333" textAlign="center">
                  <DollarSign size={32} color="#00C6E0" style={{ margin: '0 auto 12px' }} />
                  <Text color="white" fontSize="md" fontWeight="semibold" mb={2}>
                    Start Earning
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="sm">
                    Monetize your strategies with subscription pricing
                  </Text>
                </Box>
                
                <Box bg="#1a1a1a" p={4} borderRadius="lg" border="1px solid #333" textAlign="center">
                  <Shield size={32} color="#00C6E0" style={{ margin: '0 auto 12px' }} />
                  <Text color="white" fontSize="md" fontWeight="semibold" mb={2}>
                    Secure Payments
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="sm">
                    Powered by Stripe with automatic payouts
                  </Text>
                </Box>
                
                <Box bg="#1a1a1a" p={4} borderRadius="lg" border="1px solid #333" textAlign="center">
                  <Zap size={32} color="#00C6E0" style={{ margin: '0 auto 12px' }} />
                  <Text color="white" fontSize="md" fontWeight="semibold" mb={2}>
                    Full Control
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="sm">
                    Manage pricing, payouts, and analytics
                  </Text>
                </Box>
              </SimpleGrid>

              {/* Loading indicator with countdown */}
              <VStack spacing={3}>
                <Text color="whiteAlpha.600" fontSize="sm">
                  Redirecting to your creator dashboard...
                </Text>
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
      {/* Progress Indicator - hide during success screen */}
      {currentStep !== 'success' && (
        <Box>
          <HStack spacing={4} justify="center" mb={2}>
            {[1, 2, 3].map((step) => (
              <HStack key={step} spacing={2}>
                <Box
                  w="8"
                  h="8"
                  borderRadius="full"
                  bg={currentStep >= step ? "#00C6E0" : "#333"}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  transition="all 0.3s"
                >
                  <Text
                    color={currentStep >= step ? "white" : "whiteAlpha.600"}
                    fontSize="sm"
                    fontWeight="semibold"
                  >
                    {step}
                  </Text>
                </Box>
                {step < 3 && (
                  <Box
                    w="12"
                    h="1"
                    bg={currentStep > step ? "#00C6E0" : "#333"}
                    transition="all 0.3s"
                  />
                )}
              </HStack>
            ))}
          </HStack>
          <HStack justify="center">
            <Text color="whiteAlpha.600" fontSize="xs">
              Step {currentStep} of 3
            </Text>
          </HStack>
        </Box>
      )}

      {renderOnboardingStep()}
    </VStack>
  );
};

const SettingsPage = () => {
  // Update this line to include updateUserProfile
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState('profile');
  const [isLoadingStripePortal, setIsLoadingStripePortal] = useState(false);
  const [personalName, setPersonalName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [originalName, setOriginalName] = useState(''); // Store original name for cancel action
  
  // Form data state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    socialMedia: {
      twitter: '',
      tiktok: '',
      instagram: '',
      youtube: '',
      discord: ''
    },
    preferences: {
      emailNotifications: true,
      marketingUpdates: false
    }
  });
  
  const fileInputRef = useRef(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Affiliate functionality
  const { isOpen: isAffiliateModalOpen, onOpen: onAffiliateModalOpen, onClose: onAffiliateModalClose } = useDisclosure();
  const { isAffiliate, becomeAffiliate, isBecomingAffiliate } = useAffiliate();

  // Handle joining affiliate program
  const handleJoinAffiliate = async () => {
    try {
      await becomeAffiliate();
      onAffiliateModalClose();
    } catch (error) {
      console.error('Error joining affiliate program:', error);
    }
  };

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'creator', label: 'Creator', icon: Zap },
    { id: 'affiliate', label: 'Affiliate', icon: DollarSign }
  ];

  // Handle back navigation
  const handleGoBack = () => {
    navigate(-1);
  };

  // Function to open Stripe Customer Portal in new tab
  const openStripePortal = async () => {
    setIsLoadingStripePortal(true);
    try {
      // Use axiosInstance to handle auth headers automatically
      const response = await axiosInstance.post('/api/v1/subscriptions/create-portal-session');
      const portalUrl = response.data.url;
      
      // Open in new tab
      window.open(portalUrl, '_blank', 'noopener,noreferrer');
      
      toast({
        title: "Billing portal opened",
        description: "Manage your subscription in the new tab",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Portal session error:', error);
      toast({
        title: "Error opening billing portal",
        description: error.response?.data?.detail || error.message || "Please try again later",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingStripePortal(false);
    }
  };

  // Function to save a field value to the backend
  const saveFieldValue = async (fieldName, value) => {
    // Create payload based on field type
    let payload = {};
    
    if (typeof value === 'object') {
      // For nested objects like socialMedia
      payload[fieldName] = value;
    } else {
      // For simple fields
      payload[fieldName] = value;
    }
    
    console.log(`Saving ${fieldName}:`, payload);
    
    // Call API to update the specific field
    const response = await axiosInstance.patch('/api/v1/auth/profile', payload);
    console.log(`Field ${fieldName} update response:`, response.data);
    
    // Update local state
    setFormData(prev => {
      if (typeof value === 'object') {
        return {
          ...prev,
          [fieldName]: { ...prev[fieldName], ...value }
        };
      }
      return { ...prev, [fieldName]: value };
    });
    
    return response.data;
  };

  // Handle notification preference toggles
  const handleNotificationToggle = async (prefName, isEnabled) => {
    try {
      // Update API
      await saveFieldValue('preferences', { [prefName]: isEnabled });
      
      // Toast notification
      toast({
        title: `${isEnabled ? 'Enabled' : 'Disabled'} ${prefName}`,
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right"
      });
    } catch (error) {
      console.error('Error toggling notification:', error);
      toast({
        title: "Failed to update preference",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Load user data and Stripe portal URL
  useEffect(() => {
    console.log("SettingsPage useEffect - Current user:", user);
    // Set initial personal name if available
    if (user?.full_name) {
      console.log("Using user.full_name:", user.full_name);
      setPersonalName(user.full_name);
      setOriginalName(user.full_name);
    } else if (user?.fullName) {
      console.log("Using user.fullName:", user.fullName);
      setPersonalName(user.fullName);
      setOriginalName(user.fullName);
    } else {
      console.log("No name found in user object, using default");
      setPersonalName('John Doe');
      setOriginalName('John Doe');
    }
    
    // Set other form fields from user data
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        socialMedia: {
          twitter: user.x_handle || '',
          tiktok: user.tiktok_handle || '',
          instagram: user.instagram_handle || '',
          youtube: user.youtube_handle || '',
          discord: user.discord_handle || ''
        },
        preferences: user.preferences || {
          emailNotifications: true,
          marketingUpdates: false
        }
      });
    }
  }, [user]);
  
  const handleNameChange = async (newName) => {
    // Don't process if name is empty or unchanged
    if (!newName.trim() || newName === originalName) {
      setPersonalName(originalName);
      setIsEditingName(false);
      return;
    }
    
    setIsUpdatingName(true);
    try {
      console.log('Updating name to:', newName.trim());
      
      // Make API call to update personal name using axiosInstance
      // Use "full_name" field name to match backend model
      await saveFieldValue('full_name', newName.trim());
      
      // Update state with new name
      setPersonalName(newName);
      setOriginalName(newName);
      setIsEditingName(false);
      
      // Update user context with new name
      if (user) {
        console.log("Updating user profile with:", {
          full_name: newName.trim(),
          fullName: newName.trim()
        });
        // Use the updateUserProfile method to properly update the context
        updateUserProfile({
          full_name: newName.trim(),
          fullName: newName.trim() // Include both versions for compatibility
        });
        console.log("User after update:", user);
      }
      
      toast({
        title: "Name updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Name update error:', error);
      console.error('Error response:', error.response?.data);
      
      // More detailed error handling
      let errorMessage = "Please try again";
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 404) {
        errorMessage = "Profile endpoint not found. Please check API configuration.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication error. Please log in again.";
      } else if (error.response?.status === 422) {
        errorMessage = "Invalid data format. Please check your input.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Failed to update name",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      // Revert to previous name if update fails
      setPersonalName(originalName);
      setIsEditingName(false);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const cancelNameEdit = () => {
    setPersonalName(originalName);
    setIsEditingName(false);
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Add your file upload logic here
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderContent = () => {
    switch (selectedSection) {
      case 'profile':
        return (
          <VStack spacing={8} align="stretch">
            <SectionContainer icon={User} title="Personal Information">
              <VStack spacing={8} align="stretch">
                {/* Avatar Section */}
                <Flex
                  direction={{ base: "column", md: "row" }}
                  align={{ base: "center", md: "flex-start" }}
                  gap={6}
                >
                  <ProfilePicture 
                    user={user}
                    size="xl"
                    editable={true}
                    showStatus={false}
                  />
                  
                  <VStack align={{ base: "center", md: "flex-start" }} spacing={2} flex={1}>
                    <Box position="relative">
                      {isEditingName ? (
                        // Show input field when editing
                        <Box position="relative">
                          <Input
                            value={personalName}
                            onChange={(e) => setPersonalName(e.target.value)}
                            fontSize="lg"
                            fontWeight="semibold"
                            color="white"
                            bg="#1a1a1a"
                            border="1px solid #00C6E0"
                            borderRadius="md"
                            px={2}
                            py={1}
                            autoFocus
                            isDisabled={isUpdatingName}
                            _focus={{
                              boxShadow: "none",
                              borderColor: "#00C6E0"
                            }}
                          />
                          
                          <HStack position="absolute" right={2} top="50%" transform="translateY(-50%)" spacing={1}>
                            <IconButton
                              aria-label="Cancel"
                              icon={<X size={14} />}
                              size="xs"
                              variant="ghost"
                              color="red.400"
                              _hover={{ color: "red.300", bg: "transparent" }}
                              onClick={cancelNameEdit}
                            />
                            <IconButton
                              aria-label="Confirm"
                              icon={<Check size={14} />}
                              size="xs"
                              variant="ghost"
                              color="green.400"
                              _hover={{ color: "green.300", bg: "transparent" }}
                              onClick={() => handleNameChange(personalName)}
                              isLoading={isUpdatingName}
                            />
                          </HStack>
                        </Box>
                      ) : (
                        // Show name with edit button when not editing
                        <Box position="relative">
                          <Text
                            fontSize="lg"
                            fontWeight="semibold"
                            color="white"
                            px={2}
                            py={1}
                            borderRadius="md"
                            _hover={{
                              bg: "rgba(0, 198, 224, 0.1)"
                            }}
                          >
                            {personalName}
                          </Text>
                          <Tooltip label="Edit name" placement="top">
                            <IconButton
                              aria-label="Edit name"
                              icon={<Edit2 size={14} />}
                              size="xs"
                              variant="ghost"
                              color="#00C6E0"
                              position="absolute"
                              top="50%"
                              right={-6}
                              transform="translateY(-50%)"
                              _hover={{ color: "#00A3B8", bg: "transparent" }}
                              onClick={() => setIsEditingName(true)}
                            />
                          </Tooltip>
                        </Box>
                      )}
                    </Box>
                    <Text color="whiteAlpha.700" fontSize="sm">
                      Pro Trader
                    </Text>
                    <Text color="whiteAlpha.600" fontSize="xs" mt={2}>
                      Your profile picture helps others recognize you across the platform.
                      <br />
                      Click on your avatar to upload or change your picture.
                    </Text>
                  </VStack>
                </Flex>

                <Divider borderColor="#333" />

                {/* User Information */}
                <VStack spacing={6} align="stretch">
                  <FormInput
                    label="Username"
                    initialValue={formData.username}
                    fieldName="username"
                    onSave={saveFieldValue}
                    placeholder="Enter your username"
                    icon={AtSign}
                    helperText="Your unique username on our platform."
                  />
                  
                  <FormInput
                    label="Email Address"
                    initialValue={formData.email}
                    fieldName="email"
                    onSave={saveFieldValue}
                    placeholder="Enter your email"
                    type="email"
                    icon={Mail}
                    helperText="We'll send important notifications to this email."
                  />
                  
                  <FormInput
                    label="Phone Number"
                    initialValue={formData.phone}
                    fieldName="phone"
                    onSave={saveFieldValue}
                    placeholder="Enter your phone number"
                    icon={Phone}
                    helperText="Used for security and account recovery."
                  />

                  <HStack>
                    <Button
                      variant="outline"
                      color="white"
                      borderColor="#00C6E0"
                      leftIcon={<Lock size={16} />}
                      onClick={onOpen}
                      _hover={{
                        bg: "rgba(0, 198, 224, 0.1)",
                      }}
                    >
                      Change Password
                    </Button>
                  </HStack>
                </VStack>
              </VStack>
            </SectionContainer>

            {/* Social Media Section */}
            <SectionContainer icon={AtSign} title="Social Media">
              <VStack spacing={6} align="stretch">
                <SocialInput
                  icon={XIcon}
                  label="Twitter/X"
                  initialValue={formData.socialMedia?.twitter || ''}
                  fieldName="twitter"
                  onSave={saveFieldValue}
                  placeholder="@yourusername"
                />
                
                <SocialInput
                  icon={Youtube}
                  label="YouTube"
                  initialValue={formData.socialMedia?.youtube || ''}
                  fieldName="youtube"
                  onSave={saveFieldValue}
                  placeholder="channel name or URL"
                />
                
                <SocialInput
                  icon={TikTokIcon}
                  label="TikTok"
                  initialValue={formData.socialMedia?.tiktok || ''}
                  fieldName="tiktok"
                  onSave={saveFieldValue}
                  placeholder="@yourusername"
                />

                <SocialInput
                  icon={Instagram}
                  label="Instagram"
                  initialValue={formData.socialMedia?.instagram || ''}
                  fieldName="instagram"
                  onSave={saveFieldValue}
                  placeholder="@yourusername"
                />

                <SocialInput
                  icon={MessageCircle}
                  label="Discord"
                  initialValue={formData.socialMedia?.discord || ''}
                  fieldName="discord"
                  onSave={saveFieldValue}
                  placeholder="username#1234 or username"
                />

                {/* Email Notifications */}
                <Box mt={6}>
                  <VStack spacing={4} align="stretch">
                    <Flex justify="space-between" align="center">
                      <HStack>
                        <Info size={16} color="#00C6E0" />
                        <Text color="white" fontWeight="medium">Notification Preferences</Text>
                      </HStack>
                    </Flex>
                    
                    <Divider borderColor="#333" />
                    
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <FormLabel color="white" mb="0" fontSize="sm">Email Notifications</FormLabel>
                        <Text fontSize="xs" color="whiteAlpha.600">
                          Receive trade alerts and updates via email
                        </Text>
                      </Box>
                      <Switch 
                        colorScheme="cyan" 
                        isChecked={formData.preferences?.emailNotifications}
                        onChange={(e) => handleNotificationToggle('emailNotifications', e.target.checked)}
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <FormLabel color="white" mb="0" fontSize="sm">Marketing Updates</FormLabel>
                        <Text fontSize="xs" color="whiteAlpha.600">
                          Receive news about new features and promotions
                        </Text>
                      </Box>
                      <Switch 
                        colorScheme="cyan" 
                        isChecked={formData.preferences?.marketingUpdates}
                        onChange={(e) => handleNotificationToggle('marketingUpdates', e.target.checked)}
                      />
                    </FormControl>
                  </VStack>
                </Box>
              </VStack>
            </SectionContainer>

            {/* Legal Links Section */}
            <Box pt={4}>
              <VStack align="flex-start" spacing={2}>
                <Text color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                  Legal
                </Text>
                <HStack spacing={4} pt={1}>
                  <Link 
                    href="https://atomiktrading.io/docs/legal/terms-of-service" 
                    isExternal 
                    color="whiteAlpha.600"
                    fontSize="xs"
                    _hover={{ color: "#00C6E0" }}
                    display="flex"
                    alignItems="center"
                  >
                    Terms of Service <ExternalLink size={12} style={{ marginLeft: '4px' }} />
                  </Link>
                  <Link 
                    href="https://atomiktrading.io/docs/legal/privacy-policy" 
                    isExternal
                    color="whiteAlpha.600"
                    fontSize="xs"
                    _hover={{ color: "#00C6E0" }}
                    display="flex"
                    alignItems="center"
                  >
                    Privacy Policy <ExternalLink size={12} style={{ marginLeft: '4px' }} />
                  </Link>
                  <Link 
                    href="https://atomiktrading.io/docs/legal/cookie-policy" 
                    isExternal
                    color="whiteAlpha.600"
                    fontSize="xs"
                    _hover={{ color: "#00C6E0" }}
                    display="flex"
                    alignItems="center"
                  >
                    Cookie Policy <ExternalLink size={12} style={{ marginLeft: '4px' }} />
                  </Link>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        );

      case 'billing':
        return (
          <VStack spacing={8} align="stretch">
            {/* Billing Section - Updated to use redirect instead of iframe due to Stripe CSP policies */}
            {/* Current Subscription Overview */}
            <SectionContainer icon={Zap} title="Subscription Overview">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {/* Current Plan Card */}
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box
                    bg="linear-gradient(135deg, rgba(0, 198, 224, 0.1) 0%, rgba(0, 198, 224, 0.05) 100%)"
                    p={6}
                    borderRadius="lg"
                    border="1px solid rgba(0, 198, 224, 0.3)"
                    position="relative"
                    overflow="hidden"
                  >
                    <Box
                      position="absolute"
                      top="-50%"
                      right="-20%"
                      width="200px"
                      height="200px"
                      bg="radial-gradient(circle, rgba(0, 198, 224, 0.2) 0%, transparent 70%)"
                      borderRadius="full"
                      filter="blur(40px)"
                    />
                    <VStack align="start" spacing={4} position="relative">
                      <HStack>
                        <Box
                          bg="rgba(0, 198, 224, 0.2)"
                          p={2}
                          borderRadius="md"
                        >
                          <CreditCard size={20} color="#00C6E0" />
                        </Box>
                        <Text color="#00C6E0" fontSize="sm" fontWeight="semibold">
                          CURRENT PLAN
                        </Text>
                      </HStack>
                      <Box>
                        <Text color="white" fontSize="2xl" fontWeight="bold">
                          {user?.subscription?.tier ? 
                            `${user.subscription.tier.charAt(0).toUpperCase() + user.subscription.tier.slice(1)} Plan` : 
                            'Free Plan'
                          }
                        </Text>
                        <Text color="whiteAlpha.700" fontSize="sm" mt={1}>
                          {user?.subscription?.status === 'active' ? 'Active subscription' : 'No active subscription'}
                        </Text>
                      </Box>
                    </VStack>
                  </Box>
                </MotionBox>

                {/* Quick Stats Card */}
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Box bg="#1a1a1a" p={6} borderRadius="lg" border="1px solid #333">
                    <VStack align="start" spacing={4}>
                      <Text color="whiteAlpha.900" fontSize="sm" fontWeight="semibold">
                        USAGE SUMMARY
                      </Text>
                      <VStack align="start" spacing={3} width="full">
                        <HStack justify="space-between" width="full">
                          <Text color="whiteAlpha.700" fontSize="sm">Trading Accounts</Text>
                          <Text color="white" fontSize="sm" fontWeight="medium">
                            {user?.subscription?.connected_accounts_count || 0} connected
                          </Text>
                        </HStack>
                        <HStack justify="space-between" width="full">
                          <Text color="whiteAlpha.700" fontSize="sm">Active Webhooks</Text>
                          <Text color="white" fontSize="sm" fontWeight="medium">
                            {user?.subscription?.active_webhooks_count || 0} active
                          </Text>
                        </HStack>
                        <HStack justify="space-between" width="full">
                          <Text color="whiteAlpha.700" fontSize="sm">Strategies</Text>
                          <Text color="white" fontSize="sm" fontWeight="medium">
                            {user?.subscription?.active_strategies_count || 0} running
                          </Text>
                        </HStack>
                      </VStack>
                    </VStack>
                  </Box>
                </MotionBox>
              </SimpleGrid>
            </SectionContainer>

            {/* Billing Management */}
            <SectionContainer icon={CreditCard} title="Billing Management">
              <Box
                bg="linear-gradient(135deg, #1a1a1a 0%, #121212 100%)"
                p={8}
                borderRadius="lg"
                border="1px solid #333"
                position="relative"
                overflow="hidden"
              >
                {/* Decorative elements */}
                <Box
                  position="absolute"
                  top="0"
                  right="0"
                  width="300px"
                  height="300px"
                  opacity="0.03"
                >
                  <CreditCard size={300} />
                </Box>

                <VStack spacing={6} align="stretch" position="relative">
                  <Box>
                    <Text color="white" fontSize="lg" fontWeight="semibold" mb={2}>
                      Manage Your Subscription
                    </Text>
                    <Text color="whiteAlpha.700" fontSize="sm">
                      Access Stripe's secure customer portal to manage all aspects of your subscription and billing.
                    </Text>
                  </Box>

                  {/* Features Grid */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} my={6}>
                    <HStack align="start" spacing={3}>
                      <Box color="#00C6E0" mt={1}>
                        <CreditCard size={18} />
                      </Box>
                      <Box>
                        <Text color="white" fontSize="sm" fontWeight="medium">
                          Payment Methods
                        </Text>
                        <Text color="whiteAlpha.600" fontSize="xs">
                          Add, remove, or update your payment cards
                        </Text>
                      </Box>
                    </HStack>

                    <HStack align="start" spacing={3}>
                      <Box color="#00C6E0" mt={1}>
                        <FileText size={18} />
                      </Box>
                      <Box>
                        <Text color="white" fontSize="sm" fontWeight="medium">
                          Invoices & Receipts
                        </Text>
                        <Text color="whiteAlpha.600" fontSize="xs">
                          Download past invoices for your records
                        </Text>
                      </Box>
                    </HStack>

                    <HStack align="start" spacing={3}>
                      <Box color="#00C6E0" mt={1}>
                        <RefreshCw size={18} />
                      </Box>
                      <Box>
                        <Text color="white" fontSize="sm" fontWeight="medium">
                          Plan Changes
                        </Text>
                        <Text color="whiteAlpha.600" fontSize="xs">
                          Upgrade, downgrade, or cancel your plan
                        </Text>
                      </Box>
                    </HStack>

                    <HStack align="start" spacing={3}>
                      <Box color="#00C6E0" mt={1}>
                        <Shield size={18} />
                      </Box>
                      <Box>
                        <Text color="white" fontSize="sm" fontWeight="medium">
                          Secure & Private
                        </Text>
                        <Text color="whiteAlpha.600" fontSize="xs">
                          PCI-compliant security by Stripe
                        </Text>
                      </Box>
                    </HStack>
                  </SimpleGrid>

                  {/* CTA Button */}
                  <Box>
                    <Button
                      size="lg"
                      bg="#00C6E0"
                      color="white"
                      width={{ base: "full", md: "auto" }}
                      px={8}
                      _hover={{ 
                        bg: "#00A3B8",
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 20px -8px rgba(0, 198, 224, 0.5)"
                      }}
                      _active={{
                        transform: "translateY(0)",
                      }}
                      leftIcon={<ExternalLink size={18} />}
                      isLoading={isLoadingStripePortal}
                      loadingText="Opening portal..."
                      onClick={openStripePortal}
                      transition="all 0.2s"
                    >
                      Open Billing Portal
                    </Button>
                    <Text color="whiteAlpha.500" fontSize="xs" mt={3}>
                      You'll be securely redirected to Stripe to manage your billing
                    </Text>
                  </Box>
                </VStack>
              </Box>
            </SectionContainer>

            {/* Security Notice */}
            <Box
              bg="rgba(0, 198, 224, 0.05)"
              p={5}
              borderRadius="lg"
              border="1px solid rgba(0, 198, 224, 0.2)"
            >
              <HStack spacing={4} align="start">
                <Box color="#00C6E0" mt={1}>
                  <Shield size={20} />
                </Box>
                <Box>
                  <Text color="#00C6E0" fontSize="sm" fontWeight="semibold" mb={1}>
                    Bank-Level Security
                  </Text>
                  <Text color="whiteAlpha.700" fontSize="sm">
                    Your payment information is encrypted and securely processed by Stripe, a PCI Level 1 certified payment processor. 
                    We never store your credit card details on our servers.
                  </Text>
                </Box>
              </HStack>
            </Box>

            {/* Support Section */}
            <Box mt={4}>
              <HStack justify="center" spacing={2}>
                <Text color="whiteAlpha.600" fontSize="sm">
                  Questions about billing?
                </Text>
                <Link
                  href="mailto:support@atomiktrading.com"
                  color="#00C6E0"
                  fontSize="sm"
                  _hover={{ color: "#00A3B8", textDecoration: "underline" }}
                >
                  Contact Support
                </Link>
              </HStack>
            </Box>
          </VStack>
        );

      case 'creator':
        return <CreatorSettingsFlow user={user} />;

      case 'affiliate':
        return (
          <VStack spacing={8} align="stretch">
            {isAffiliate ? (
              // Show affiliate dashboard for existing affiliates
              <AffiliateDashboard />
            ) : (
              // Show join affiliate program for non-affiliates
              <SectionContainer icon={DollarSign} title="Affiliate Program">
                <VStack spacing={6} align="stretch">
                  {/* Hero Section */}
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
                      <Box color="#00C6E0">
                        <DollarSign size={48} />
                      </Box>
                      
                      <VStack spacing={3}>
                        <Text color="white" fontSize="2xl" fontWeight="bold">
                          Join Our Affiliate Program
                        </Text>
                        <Text color="whiteAlpha.700" fontSize="lg">
                          Earn 20% lifetime recurring commissions
                        </Text>
                        <Text color="whiteAlpha.600" fontSize="sm" maxW="md">
                          Share AtomikTrading with your audience and earn generous commissions 
                          for every successful referral. No caps, no limits.
                        </Text>
                      </VStack>
                      
                      <Button
                        size="lg"
                        bg="#00C6E0"
                        color="white"
                        px={8}
                        py={6}
                        fontSize="md"
                        fontWeight="semibold"
                        _hover={{ 
                          bg: "#00A3B8",
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 20px -8px rgba(0, 198, 224, 0.5)"
                        }}
                        _active={{
                          transform: "translateY(0)",
                        }}
                        leftIcon={<Zap size={20} />}
                        onClick={onAffiliateModalOpen}
                        transition="all 0.2s"
                      >
                        Join Affiliate Program
                      </Button>
                    </VStack>
                  </Box>

                  {/* Benefits Grid */}
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    <Box bg="#1a1a1a" p={6} borderRadius="lg" border="1px solid #333">
                      <VStack align="start" spacing={4}>
                        <Box
                          bg="rgba(0, 198, 224, 0.2)"
                          p={3}
                          borderRadius="md"
                        >
                          <DollarSign size={24} color="#00C6E0" />
                        </Box>
                        <VStack align="start" spacing={2}>
                          <Text color="white" fontSize="lg" fontWeight="semibold">
                            20% Commission
                          </Text>
                          <Text color="whiteAlpha.700" fontSize="sm">
                            Earn 20% on all subscription plans - one of the highest rates in the industry.
                          </Text>
                        </VStack>
                      </VStack>
                    </Box>

                    <Box bg="#1a1a1a" p={6} borderRadius="lg" border="1px solid #333">
                      <VStack align="start" spacing={4}>
                        <Box
                          bg="rgba(0, 198, 224, 0.2)"
                          p={3}
                          borderRadius="md"
                        >
                          <RefreshCw size={24} color="#00C6E0" />
                        </Box>
                        <VStack align="start" spacing={2}>
                          <Text color="white" fontSize="lg" fontWeight="semibold">
                            Lifetime Revenue
                          </Text>
                          <Text color="whiteAlpha.700" fontSize="sm">
                            Earn commissions for as long as your referrals remain subscribed.
                          </Text>
                        </VStack>
                      </VStack>
                    </Box>

                    <Box bg="#1a1a1a" p={6} borderRadius="lg" border="1px solid #333">
                      <VStack align="start" spacing={4}>
                        <Box
                          bg="rgba(0, 198, 224, 0.2)"
                          p={3}
                          borderRadius="md"
                        >
                          <Calendar size={24} color="#00C6E0" />
                        </Box>
                        <VStack align="start" spacing={2}>
                          <Text color="white" fontSize="lg" fontWeight="semibold">
                            Monthly Payouts
                          </Text>
                          <Text color="whiteAlpha.700" fontSize="sm">
                            Automatic payments on the 1st of every month via Stripe.
                          </Text>
                        </VStack>
                      </VStack>
                    </Box>
                  </SimpleGrid>

                  {/* How It Works */}
                  <Box bg="#1a1a1a" p={6} borderRadius="lg" border="1px solid #333">
                    <Text color="white" fontSize="lg" fontWeight="semibold" mb={6}>
                      How It Works
                    </Text>
                    
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                      <VStack align="center" spacing={4} textAlign="center">
                        <Box
                          bg="rgba(0, 198, 224, 0.2)"
                          w="60px"
                          h="60px"
                          borderRadius="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="#00C6E0" fontSize="xl" fontWeight="bold">1</Text>
                        </Box>
                        <VStack spacing={2}>
                          <Text color="white" fontSize="md" fontWeight="medium">
                            Get Your Link
                          </Text>
                          <Text color="whiteAlpha.600" fontSize="sm">
                            Receive a unique referral link to share with your audience
                          </Text>
                        </VStack>
                      </VStack>

                      <VStack align="center" spacing={4} textAlign="center">
                        <Box
                          bg="rgba(0, 198, 224, 0.2)"
                          w="60px"
                          h="60px"
                          borderRadius="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="#00C6E0" fontSize="xl" fontWeight="bold">2</Text>
                        </Box>
                        <VStack spacing={2}>
                          <Text color="white" fontSize="md" fontWeight="medium">
                            Share & Promote
                          </Text>
                          <Text color="whiteAlpha.600" fontSize="sm">
                            Share on social media, blogs, or directly with traders
                          </Text>
                        </VStack>
                      </VStack>

                      <VStack align="center" spacing={4} textAlign="center">
                        <Box
                          bg="rgba(0, 198, 224, 0.2)"
                          w="60px"
                          h="60px"
                          borderRadius="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="#00C6E0" fontSize="xl" fontWeight="bold">3</Text>
                        </Box>
                        <VStack spacing={2}>
                          <Text color="white" fontSize="md" fontWeight="medium">
                            Earn Commissions
                          </Text>
                          <Text color="whiteAlpha.600" fontSize="sm">
                            Get paid 20% monthly for the lifetime of each referral
                          </Text>
                        </VStack>
                      </VStack>
                    </SimpleGrid>
                  </Box>

                  {/* FAQ/Additional Info */}
                  <Box
                    bg="rgba(0, 198, 224, 0.05)"
                    p={6}
                    borderRadius="lg"
                    border="1px solid rgba(0, 198, 224, 0.2)"
                  >
                    <HStack spacing={4} align="start">
                      <Box color="#00C6E0" mt={1}>
                        <Info size={20} />
                      </Box>
                      <VStack align="start" spacing={3}>
                        <Text color="#00C6E0" fontSize="md" fontWeight="semibold">
                          Program Details
                        </Text>
                        <VStack align="start" spacing={2}>
                          <Text color="whiteAlpha.700" fontSize="sm">
                            • Minimum payout threshold: $50
                          </Text>
                          <Text color="whiteAlpha.700" fontSize="sm">
                            • 90-day cookie tracking window
                          </Text>
                          <Text color="whiteAlpha.700" fontSize="sm">
                            • Real-time tracking and reporting
                          </Text>
                          <Text color="whiteAlpha.700" fontSize="sm">
                            • Dedicated affiliate support
                          </Text>
                        </VStack>
                      </VStack>
                    </HStack>
                  </Box>
                </VStack>
              </SectionContainer>
            )}
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Flex minH="100vh" bg="#000000" color="text.primary" fontFamily="body" position="relative">
      <Box flexGrow={1} p={{ base: 4, md: 6 }} position="relative">
        <MotionFlex
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          h="full"
          gap={6}
          direction={{ base: "column", md: "row" }}
        >
          {/* Left Menu */}
          <MotionBox
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <VStack spacing={4} align="stretch">
              {/* Back Button */}
              <Tooltip label="Go back" placement="right">
                <IconButton
                  aria-label="Go back"
                  icon={<ArrowLeft size={20} />}
                  variant="ghost"
                  color="whiteAlpha.700"
                  size="md"
                  w="fit-content"
                  _hover={{ 
                    color: "#00C6E0",
                    bg: "rgba(0, 198, 224, 0.1)"
                  }}
                  _active={{
                    bg: "rgba(0, 198, 224, 0.2)"
                  }}
                  onClick={handleGoBack}
                />
              </Tooltip>
              
              {/* Settings Menu */}
              <DarkCard w={{ base: "full", md: "64" }}>
                <VStack spacing={0} align="stretch">
                  {menuItems.map(item => (
                    <MenuItem
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      isSelected={selectedSection === item.id}
                      onClick={() => setSelectedSection(item.id)}
                    />
                  ))}
                </VStack>
              </DarkCard>
            </VStack>
          </MotionBox>

          {/* Main Content */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            flex={1}
          >
            <DarkCard h="full" overflow="auto">
              <Box p={6}>
                <Flex 
                  justify="space-between" 
                  align="center" 
                  mb={8}
                  direction={{ base: "column", sm: "row" }}
                  gap={{ base: 4, sm: 0 }}
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">
                    {menuItems.find(item => item.id === selectedSection)?.label} Settings
                  </Text>
                </Flex>

                <Box>
                  {renderContent()}
                </Box>
              </Box>
            </DarkCard>
          </MotionBox>
        </MotionFlex>
      </Box>

      {/* Password Change Modal */}
      <PasswordChangeModal isOpen={isOpen} onClose={onClose} />
      
      {/* Become Affiliate Modal */}
      <BecomeAffiliateModal 
        isOpen={isAffiliateModalOpen} 
        onClose={onAffiliateModalClose}
        onJoin={handleJoinAffiliate}
        isJoining={isBecomingAffiliate}
      />
    </Flex>
  );
};

export default SettingsPage;