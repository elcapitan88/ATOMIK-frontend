import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Select,
  Switch,
  useToast,
  FormControl,
  FormLabel,
  Image,
} from '@chakra-ui/react';
import { 
  User, 
  Bell, 
  Globe,
  Save,
  ChevronRight,
  CreditCard,
  Lock
} from 'lucide-react';

const MenuItem = ({ icon: Icon, label, isSelected, onClick }) => (
  <Button
    variant="ghost"
    justifyContent="flex-start"
    width="full"
    height="auto"
    py={3}
    px={4}
    bg={isSelected ? "whiteAlpha.200" : "transparent"}
    color="white"
    _hover={{ bg: "whiteAlpha.100" }}
    _active={{ bg: "whiteAlpha.300" }}
    leftIcon={<Icon size={16} />}
    rightIcon={<ChevronRight size={14} opacity={0.5} />}
    onClick={onClick}
    position="relative"
    overflow="hidden"
    _before={{
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: "2px",
      bg: isSelected ? "rgba(0, 198, 224, 1)" : "transparent",
      transition: "all 0.2s"
    }}
  >
    <Text fontSize="sm">{label}</Text>
  </Button>
);

const GlassCard = ({ children, ...props }) => (
  <Box
    bg="rgba(255, 255, 255, 0.1)"
    boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
    border="1px solid rgba(255, 255, 255, 0.18)"
    borderRadius="xl"
    overflow="hidden"
    {...props}
  >
    {children}
  </Box>
);

const FormInput = ({ label, ...props }) => (
  <FormControl>
    <FormLabel color="whiteAlpha.900" fontSize="sm">{label}</FormLabel>
    <Input
      bg="whiteAlpha.100"
      border="1px solid"
      borderColor="whiteAlpha.200"
      color="white"
      _hover={{ borderColor: "whiteAlpha.300" }}
      _focus={{ 
        borderColor: "rgba(0, 198, 224, 0.6)",
        boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
      }}
      {...props}
    />
  </FormControl>
);

const FormSelect = ({ label, children, ...props }) => (
  <FormControl>
    <FormLabel color="whiteAlpha.900" fontSize="sm">{label}</FormLabel>
    <Select
      bg="whiteAlpha.100"
      border="1px solid"
      borderColor="whiteAlpha.200"
      color="white"
      _hover={{ borderColor: "whiteAlpha.300" }}
      _focus={{ 
        borderColor: "rgba(0, 198, 224, 0.6)",
        boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
      }}
      sx={{
        option: {
          bg: "rgba(26, 32, 44, 0.9)",
          color: "white",
        }
      }}
      {...props}
    >
      {children}
    </Select>
  </FormControl>
);

const SectionContainer = ({ icon: Icon, title, children }) => (
  <GlassCard p={6} mb={4}>
    <Text fontSize="lg" fontWeight="semibold" color="white" mb={4}>
      <Flex align="center" gap={2}>
        <Icon size={20} />
        <span>{title}</span>
      </Flex>
    </Text>
    {children}
  </GlassCard>
);

const SettingsPage = () => {
  const [selectedSection, setSelectedSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Settings updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: error.message || "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Add your file upload logic here
      console.log('File selected:', file);
    }
  };

  const renderContent = () => {
    switch (selectedSection) {
      case 'profile':
        return (
          <VStack spacing={4} align="stretch">
            <SectionContainer icon={User} title="Personal Information">
              <VStack spacing={4} align="stretch">
                <Box>
                  <FormLabel color="whiteAlpha.900" fontSize="sm">Profile Picture</FormLabel>
                  <HStack spacing={6} align="start">
                    <Box position="relative" w="100px" h="100px">
                      <Image
                        src="/api/placeholder/100/100"
                        fallbackSrc="https://via.placeholder.com/100"
                        alt="Profile"
                        borderRadius="xl"
                        objectFit="cover"
                        w="100px"
                        h="100px"
                      />
                      <Button
                        position="absolute"
                        bottom={-4}
                        left="50%"
                        transform="translateX(-50%)"
                        size="sm"
                        bg="rgba(0, 198, 224, 0.3)"
                        color="white"
                        _hover={{ bg: "rgba(0, 198, 224, 0.5)" }}
                        borderWidth={1}
                        borderColor="rgba(0, 198, 224, 1)"
                        onClick={() => document.getElementById('avatar-upload').click()}
                      >
                        Change
                      </Button>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        display="none"
                        onChange={handleAvatarChange}
                      />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text color="white" fontSize="sm" fontWeight="medium">
                        Upload Photo
                      </Text>
                      <Text color="whiteAlpha.600" fontSize="xs">
                        Upload a new avatar. Recommended size: 100x100px.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
                <FormInput label="Full Name" defaultValue="John Doe" />
                <FormInput label="Email Address" defaultValue="john@example.com" type="email" />
                <FormSelect label="Time Zone" defaultValue="UTC">
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="PST">Pacific Time</option>
                  <option value="CST">Central Time</option>
                </FormSelect>
              </VStack>
            </SectionContainer>

            <SectionContainer icon={CreditCard} title="Billing Information">
              <VStack spacing={6} align="stretch">
                <GlassCard p={6} bg="whiteAlpha.50">
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="medium" color="white">Current Plan</Text>
                    <Text color="green.300">Active</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color="white" mb={2}>Pro Plan</Text>
                  <Text color="whiteAlpha.700">$49.00/month</Text>
                </GlassCard>
                
                <GlassCard p={6} bg="whiteAlpha.50">
                  <Text fontWeight="medium" color="white" mb={4}>Payment Method</Text>
                  <HStack spacing={4}>
                    <CreditCard size={24} color="white" />
                    <Box>
                      <Text color="white">Visa ending in 4242</Text>
                      <Text fontSize="sm" color="whiteAlpha.700">Expires 12/24</Text>
                    </Box>
                  </HStack>
                </GlassCard>

                <VStack spacing={3}>
                  <FormInput label="Address Line 1" defaultValue="123 Trading Street" />
                  <FormInput label="Address Line 2" />
                  <HStack spacing={4}>
                    <FormInput label="City" defaultValue="New York" />
                    <FormInput label="State" defaultValue="NY" />
                    <FormInput label="ZIP" defaultValue="10001" />
                  </HStack>
                </VStack>
              </VStack>
            </SectionContainer>

            <SectionContainer icon={Lock} title="Security">
              <VStack spacing={6} align="stretch">
                <GlassCard p={6} bg="whiteAlpha.50">
                  <Text fontWeight="medium" color="white" mb={4}>Change Password</Text>
                  <VStack spacing={3}>
                    <FormInput type="password" label="Current Password" />
                    <FormInput type="password" label="New Password" />
                    <FormInput type="password" label="Confirm New Password" />
                  </VStack>
                </GlassCard>

                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel color="white" mb="0">Two-Factor Authentication</FormLabel>
                    <Text fontSize="sm" color="whiteAlpha.600">
                      Add an extra layer of security
                    </Text>
                  </Box>
                  <Switch colorScheme="green" />
                </FormControl>
              </VStack>
            </SectionContainer>
          </VStack>
        );

      case 'notifications':
        return (
          <VStack spacing={6} align="stretch">
            {['Email Alerts', 'Trade Notifications', 'Webhook Alerts'].map((setting) => (
              <FormControl key={setting} display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <FormLabel color="white" mb="0">{setting}</FormLabel>
                  <Text fontSize="sm" color="whiteAlpha.600">
                    Get notified about {setting.toLowerCase()}
                  </Text>
                </Box>
                <Switch colorScheme="green" defaultChecked />
              </FormControl>
            ))}
          </VStack>
        );

      case 'preferences':
        return (
          <VStack spacing={6} align="stretch">
            <FormSelect label="Default Trading View">
              <option value="candlesticks">Candlesticks</option>
              <option value="line">Line Chart</option>
              <option value="bars">Bars</option>
            </FormSelect>

            <FormSelect label="Default Timeframe">
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="4h">4 Hours</option>
              <option value="1d">1 Day</option>
            </FormSelect>

            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <FormLabel color="white" mb="0">Dark Mode</FormLabel>
                <Text fontSize="sm" color="whiteAlpha.600">Use dark theme</Text>
              </Box>
              <Switch colorScheme="green" defaultChecked />
            </FormControl>
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Flex minH="100vh" bg="background" color="text.primary" fontFamily="body">
      <Box flexGrow={1} p={6} overflow="hidden" position="relative">
        <Box 
          position="absolute" 
          inset={0} 
          bgGradient="linear(to-br, blackAlpha.400, blackAlpha.200, blackAlpha.400)" 
          pointerEvents="none"
        />
        <Box 
          position="absolute" 
          inset={0} 
          backdropFilter="blur(16px)" 
          bg="blackAlpha.300"
        />
        <Box 
          position="absolute" 
          inset={0} 
          boxShadow="inset 0 0 15px rgba(0, 0, 0, 0.2)" 
          borderRadius="xl" 
          pointerEvents="none"
        />
        
        <Box position="relative" h="full" zIndex={1}>
          <Flex position="relative" h="full" gap={4}>
            <GlassCard w="64">
              <VStack spacing={1} align="stretch" p={2}>
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
            </GlassCard>

            <GlassCard flex={1} p={6}>
              <Flex justify="space-between" align="center" mb={6}>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {menuItems.find(item => item.id === selectedSection)?.label}
                </Text>
                <Button
                  bg="transparent"
                  color="white"
                  fontWeight="medium"
                  borderWidth={1}
                  borderColor="rgba(0, 198, 224, 1)"
                  position="relative"
                  overflow="hidden"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bg: 'linear-gradient(90deg, transparent, rgba(0, 198, 224, 1) 20%, rgba(0, 198, 224, 1) 80%, transparent)',
                    opacity: 0.3,
                  }}
                  _hover={{
                    _before: {
                      opacity: 0.5,
                    }
                  }}
                  _active={{
                    _before: {
                      opacity: 0.7,
                    }
                  }}
                  leftIcon={<Save size={16} />}
                  onClick={handleSave}
                  isLoading={isSaving}
                >
                  Save Changes
                </Button>
              </Flex>

              <Box overflowY="auto" maxH="calc(100vh - 160px)">
                {renderContent()}
              </Box>
            </GlassCard>
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
};

export default SettingsPage;