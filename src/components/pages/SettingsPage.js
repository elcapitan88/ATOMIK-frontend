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
  ExternalLink,
  CheckCircle,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/services/axiosConfig';

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

const SettingsPage = () => {
  const { user } = useAuth(); // Access user from auth context
  const [selectedSection, setSelectedSection] = useState('profile');
  const [isLoadingStripePortal, setIsLoadingStripePortal] = useState(false);
  const [stripePortalUrl, setStripePortalUrl] = useState('');
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
      youtube: '',
      tiktok: ''
    },
    preferences: {
      emailNotifications: true,
      marketingUpdates: false
    }
  });
  
  const fileInputRef = useRef(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ];

  // Function to create Stripe Customer Portal session
  const createStripePortalSession = async () => {
    setIsLoadingStripePortal(true);
    try {
      // Use axiosInstance to handle auth headers automatically
      const response = await axiosInstance.post('/api/v1/subscriptions/create-portal-session');
      return response.data.url;
    } catch (error) {
      console.error('Portal session error:', error); // Debug log
      toast({
        title: "Error loading Stripe portal",
        description: error.response?.data?.detail || error.message || "Please try again later",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      throw error;
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
    // Set initial personal name if available
    if (user?.full_name) {
      setPersonalName(user.full_name);
      setOriginalName(user.full_name);
    } else if (user?.fullName) { 
      // Backward compatibility with frontend naming
      setPersonalName(user.fullName);
      setOriginalName(user.fullName);
    } else {
      setPersonalName('John Doe'); // Default name if no user data
      setOriginalName('John Doe');
    }
    
    // Set other form fields from user data
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        socialMedia: user.socialMedia || {
          twitter: '',
          youtube: '',
          tiktok: ''
        },
        preferences: user.preferences || {
          emailNotifications: true,
          marketingUpdates: false
        }
      });
    }
    
    if (selectedSection === 'billing') {
      createStripePortalSession()
        .then(url => {
          setStripePortalUrl(url);
        })
        .catch(err => {
          console.error('Error fetching Stripe portal URL:', err);
          // Don't set URL to avoid showing the portal if there's an error
        });
    }
  }, [selectedSection, user]);
  
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
      
      // Update user context if needed
      if (user) {
        user.fullName = newName; // Keep frontend naming consistent
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
                  <Box position="relative">
                    <Avatar
                      size="xl"
                      src="/api/placeholder/100/100"
                      name={personalName}
                      border="2px solid #00C6E0"
                      bg="#1a1a1a"
                      cursor="pointer"
                      onClick={handleAvatarClick}
                    />
                    <IconButton
                      aria-label="Change avatar"
                      icon={<Camera size={16} />}
                      size="sm"
                      isRound
                      position="absolute"
                      bottom={0}
                      right={0}
                      bg="#00C6E0"
                      color="white"
                      _hover={{ bg: "#00A3B8" }}
                      onClick={handleAvatarClick}
                    />
                    <Input
                      type="file"
                      hidden
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </Box>
                  <VStack align={{ base: "center", md: "flex-start" }} spacing={1}>
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
                          <HStack position="absolute" top="50%" right={-20} transform="translateY(-50%)" spacing={1}>
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
                      Upload a clear profile picture to personalize your account.
                      <br />
                      Square images work best, recommended size 200x200px.
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

                {/* Email Notifications */}
                <Box mt={4} p={4} bg="#1a1a1a" borderRadius="md" border="1px solid #333">
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
                          Receive news about features and promotions
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
            {/* Stripe Customer Portal - Full Content Area */}
            <Box height="calc(100vh - 200px)" width="100%">
              {isLoadingStripePortal ? (
                <Center h="100%" bg="#121212" borderRadius="md" border="1px solid #333">
                  <VStack spacing={4}>
                    <Spinner size="xl" color="#00C6E0" thickness="3px" />
                    <Text color="white">Loading payment portal...</Text>
                  </VStack>
                </Center>
              ) : stripePortalUrl ? (
                <iframe 
                  src={stripePortalUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    backgroundColor: '#1a1a1a'
                  }}
                  title="Stripe Customer Portal"
                />
              ) : (
                <Center h="100%" bg="#121212" borderRadius="md" border="1px solid #333">
                  <VStack spacing={4}>
                    <Text color="white">Could not load payment portal</Text>
                    <Button
                      size="md"
                      bg="#00C6E0"
                      color="white"
                      _hover={{ bg: "#00A3B8" }}
                      onClick={() => createStripePortalSession().then(url => setStripePortalUrl(url))}
                    >
                      Retry
                    </Button>
                  </VStack>
                </Center>
              )}
            </Box>
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
    </Flex>
  );
};

export default SettingsPage;