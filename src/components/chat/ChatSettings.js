import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Switch,
  FormControl,
  FormLabel,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Box,
  Divider,
  Badge,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Avatar,
  Input,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { 
  Settings, 
  Bell, 
  Volume2, 
  VolumeX, 
  Monitor, 
  Smartphone, 
  Eye, 
  EyeOff, 
  Palette,
  MessageSquare,
  Users,
  Save,
  RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const ChatSettings = ({ 
  isOpen, 
  onClose, 
  currentSettings = {}, 
  onSaveSettings 
}) => {
  const [settings, setSettings] = useState({
    // Appearance
    showProfilePictures: true,
    compactMode: false,
    theme: 'dark',
    fontSize: 14,
    messageSpacing: 'normal',
    
    // Notifications
    notificationSound: true,
    desktopNotifications: true,
    mobileNotifications: true,
    notificationVolume: 50,
    soundType: 'default',
    
    // Privacy & Behavior
    showOnlineStatus: true,
    showTypingIndicator: true,
    autoScrollToNew: true,
    markAsReadOnScroll: true,
    confirmBeforeLeaving: true,
    
    // Chat Features
    enableEmojis: true,
    enableReactions: true,
    enableGifs: false, // Future feature
    enableFileUploads: false, // Future feature
    
    // Accessibility
    highContrast: false,
    reducedMotion: false,
    screenReaderMode: false,
    
    ...currentSettings
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen: isResetDialogOpen, onOpen: openResetDialog, onClose: closeResetDialog } = useDisclosure();
  const cancelRef = React.useRef();
  const toast = useToast();

  // Track changes
  useEffect(() => {
    const hasChanges = JSON.stringify(settings) !== JSON.stringify({ ...currentSettings });
    setHasChanges(hasChanges);
  }, [settings, currentSettings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSaveSettings?.(settings);
      setHasChanges(false);
      toast({
        title: "Settings saved",
        description: "Your chat preferences have been updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to save settings",
        description: error.message || "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      showProfilePictures: true,
      compactMode: false,
      theme: 'dark',
      fontSize: 14,
      messageSpacing: 'normal',
      notificationSound: true,
      desktopNotifications: true,
      mobileNotifications: true,
      notificationVolume: 50,
      soundType: 'default',
      showOnlineStatus: true,
      showTypingIndicator: true,
      autoScrollToNew: true,
      markAsReadOnScroll: true,
      confirmBeforeLeaving: true,
      enableEmojis: true,
      enableReactions: true,
      enableGifs: false,
      enableFileUploads: false,
      highContrast: false,
      reducedMotion: false,
      screenReaderMode: false
    };
    setSettings(defaultSettings);
    closeResetDialog();
    toast({
      title: "Settings reset",
      description: "All settings have been restored to defaults",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const playTestSound = () => {
    // Play a test notification sound
    const audio = new Audio('/sounds/notification.mp3'); // You'd need to add this file
    audio.volume = settings.notificationVolume / 100;
    audio.play().catch(() => {
      // Fallback for browsers that don't allow audio without user interaction
      toast({
        title: "Sound test",
        description: "🔊 This is how your notifications will sound",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    });
  };

  const settingSections = [
    {
      title: "Appearance",
      icon: <Palette size={16} />,
      settings: [
        {
          key: "showProfilePictures",
          label: "Show profile pictures",
          description: "Display user avatars next to messages",
          type: "switch"
        },
        {
          key: "compactMode",
          label: "Compact mode",
          description: "Reduce spacing between messages",
          type: "switch"
        },
        {
          key: "theme",
          label: "Theme",
          description: "Choose your preferred color scheme",
          type: "select",
          options: [
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
            { value: "auto", label: "System" }
          ]
        },
        {
          key: "fontSize",
          label: "Font size",
          description: "Adjust text size for better readability",
          type: "slider",
          min: 10,
          max: 20,
          step: 1,
          marks: { 10: "10px", 14: "14px", 18: "18px" }
        },
        {
          key: "messageSpacing",
          label: "Message spacing",
          description: "Space between individual messages",
          type: "select",
          options: [
            { value: "compact", label: "Compact" },
            { value: "normal", label: "Normal" },
            { value: "comfortable", label: "Comfortable" }
          ]
        }
      ]
    },
    {
      title: "Notifications",
      icon: <Bell size={16} />,
      settings: [
        {
          key: "notificationSound",
          label: "Sound notifications",
          description: "Play sounds for new messages",
          type: "switch"
        },
        {
          key: "desktopNotifications",
          label: "Desktop notifications",
          description: "Show browser notifications",
          type: "switch"
        },
        {
          key: "mobileNotifications",
          label: "Mobile notifications",
          description: "Push notifications on mobile devices",
          type: "switch"
        },
        {
          key: "notificationVolume",
          label: "Notification volume",
          description: "Adjust notification sound volume",
          type: "slider",
          min: 0,
          max: 100,
          step: 10,
          marks: { 0: "0%", 50: "50%", 100: "100%" },
          disabled: !settings.notificationSound,
          action: playTestSound
        },
        {
          key: "soundType",
          label: "Sound type",
          description: "Choose notification sound",
          type: "select",
          options: [
            { value: "default", label: "Default" },
            { value: "chime", label: "Chime" },
            { value: "ping", label: "Ping" },
            { value: "pop", label: "Pop" }
          ],
          disabled: !settings.notificationSound
        }
      ]
    },
    {
      title: "Chat Behavior",
      icon: <MessageSquare size={16} />,
      settings: [
        {
          key: "showOnlineStatus",
          label: "Show online status",
          description: "Display when you're online to other users",
          type: "switch"
        },
        {
          key: "showTypingIndicator",
          label: "Show typing indicator",
          description: "Let others see when you're typing",
          type: "switch"
        },
        {
          key: "autoScrollToNew",
          label: "Auto-scroll to new messages",
          description: "Automatically scroll to newest messages",
          type: "switch"
        },
        {
          key: "markAsReadOnScroll",
          label: "Mark as read on scroll",
          description: "Mark messages as read when scrolled into view",
          type: "switch"
        },
        {
          key: "confirmBeforeLeaving",
          label: "Confirm before leaving",
          description: "Ask for confirmation when closing chat",
          type: "switch"
        }
      ]
    },
    {
      title: "Features",
      icon: <Users size={16} />,
      settings: [
        {
          key: "enableEmojis",
          label: "Enable emojis",
          description: "Allow emoji reactions and picker",
          type: "switch"
        },
        {
          key: "enableReactions",
          label: "Enable reactions",
          description: "Allow emoji reactions on messages",
          type: "switch",
          disabled: !settings.enableEmojis
        },
        {
          key: "enableGifs",
          label: "Enable GIFs",
          description: "Allow GIF sharing (coming soon)",
          type: "switch",
          disabled: true,
          badge: "Soon"
        },
        {
          key: "enableFileUploads",
          label: "Enable file uploads",
          description: "Allow file and image sharing (coming soon)",
          type: "switch",
          disabled: true,
          badge: "Soon"
        }
      ]
    },
    {
      title: "Accessibility",
      icon: <Eye size={16} />,
      settings: [
        {
          key: "highContrast",
          label: "High contrast mode",
          description: "Improve visibility with higher contrast",
          type: "switch"
        },
        {
          key: "reducedMotion",
          label: "Reduced motion",
          description: "Minimize animations and transitions",
          type: "switch"
        },
        {
          key: "screenReaderMode",
          label: "Screen reader optimizations",
          description: "Enhanced accessibility for screen readers",
          type: "switch"
        }
      ]
    }
  ];

  const renderSetting = (setting) => {
    const value = settings[setting.key];
    const isDisabled = setting.disabled || false;

    switch (setting.type) {
      case "switch":
        return (
          <HStack justify="space-between" w="full">
            <Box flex={1}>
              <HStack>
                <Text fontSize="sm" fontWeight="medium">
                  {setting.label}
                </Text>
                {setting.badge && (
                  <Badge size="sm" colorScheme="blue" variant="subtle">
                    {setting.badge}
                  </Badge>
                )}
              </HStack>
              <Text fontSize="xs" color="whiteAlpha.600">
                {setting.description}
              </Text>
            </Box>
            <Switch
              isChecked={value}
              onChange={(e) => updateSetting(setting.key, e.target.checked)}
              isDisabled={isDisabled}
              colorScheme="blue"
            />
          </HStack>
        );

      case "select":
        return (
          <VStack align="start" spacing={2} w="full">
            <Box>
              <Text fontSize="sm" fontWeight="medium">
                {setting.label}
              </Text>
              <Text fontSize="xs" color="whiteAlpha.600">
                {setting.description}
              </Text>
            </Box>
            <Select
              value={value}
              onChange={(e) => updateSetting(setting.key, e.target.value)}
              isDisabled={isDisabled}
              size="sm"
              bg="rgba(255, 255, 255, 0.05)"
              borderColor="rgba(255, 255, 255, 0.1)"
              _focus={{
                borderColor: "rgba(0, 198, 224, 0.5)",
                boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.3)"
              }}
            >
              {setting.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </VStack>
        );

      case "slider":
        return (
          <VStack align="start" spacing={4} w="full">
            <Box>
              <HStack justify="space-between">
                <Text fontSize="sm" fontWeight="medium">
                  {setting.label}
                </Text>
                {setting.action && (
                  <Tooltip label="Test sound">
                    <IconButton
                      size="xs"
                      variant="ghost"
                      icon={settings.notificationSound ? <Volume2 size={12} /> : <VolumeX size={12} />}
                      onClick={setting.action}
                      isDisabled={isDisabled}
                      aria-label="Test sound"
                    />
                  </Tooltip>
                )}
              </HStack>
              <Text fontSize="xs" color="whiteAlpha.600">
                {setting.description}
              </Text>
            </Box>
            <Box w="full" px={2}>
              <Slider
                value={value}
                onChange={(val) => updateSetting(setting.key, val)}
                min={setting.min}
                max={setting.max}
                step={setting.step}
                isDisabled={isDisabled}
                colorScheme="blue"
              >
                {setting.marks && Object.entries(setting.marks).map(([mark, label]) => (
                  <SliderMark key={mark} value={parseInt(mark)} fontSize="xs" mt={2} ml={-2}>
                    {label}
                  </SliderMark>
                ))}
                <SliderTrack bg="rgba(255, 255, 255, 0.1)">
                  <SliderFilledTrack bg="rgba(0, 198, 224, 0.8)" />
                </SliderTrack>
                <SliderThumb boxShadow="md" />
              </Slider>
            </Box>
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="rgba(0, 0, 0, 0.6)" />
        <ModalContent 
          bg="gray.800" 
          borderColor="whiteAlpha.200" 
          maxH="90vh"
          boxShadow="xl"
        >
          <ModalHeader borderBottom="1px" borderColor="whiteAlpha.200">
            <HStack spacing={3}>
              <Box
                p={2}
                bg="rgba(0, 198, 224, 0.1)"
                borderRadius="md"
                border="1px solid"
                borderColor="rgba(0, 198, 224, 0.3)"
              >
                <Settings size={20} color="rgba(0, 198, 224, 1)" />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight="bold">
                  Chat Settings
                </Text>
                <Text fontSize="sm" color="whiteAlpha.600">
                  Customize your chat experience
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={6}>
            <VStack spacing={6} align="start">
              {settingSections.map((section, sectionIndex) => (
                <MotionBox
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sectionIndex * 0.1 }}
                  w="full"
                >
                  <VStack spacing={4} align="start" w="full">
                    <HStack spacing={2}>
                      <Box color="rgba(0, 198, 224, 1)">
                        {section.icon}
                      </Box>
                      <Text fontSize="md" fontWeight="semibold">
                        {section.title}
                      </Text>
                    </HStack>
                    
                    <VStack spacing={4} align="start" w="full" pl={6}>
                      {section.settings.map((setting, settingIndex) => (
                        <Box key={setting.key} w="full">
                          {renderSetting(setting)}
                          {settingIndex < section.settings.length - 1 && (
                            <Divider mt={4} borderColor="whiteAlpha.100" />
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </VStack>
                  
                  {sectionIndex < settingSections.length - 1 && (
                    <Divider mt={6} borderColor="whiteAlpha.200" />
                  )}
                </MotionBox>
              ))}
            </VStack>
          </ModalBody>

          <ModalFooter borderTop="1px" borderColor="whiteAlpha.200">
            <HStack spacing={3}>
              <Button
                variant="ghost"
                leftIcon={<RotateCcw size={16} />}
                onClick={openResetDialog}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Reset to Defaults
              </Button>
              
              <Button
                variant="ghost"
                onClick={onClose}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Cancel
              </Button>
              
              <Button
                colorScheme="blue"
                leftIcon={<Save size={16} />}
                onClick={handleSave}
                isLoading={isLoading}
                loadingText="Saving"
                isDisabled={!hasChanges}
                bg="rgba(0, 198, 224, 0.8)"
                _hover={{ bg: "rgba(0, 198, 224, 1)" }}
              >
                Save Changes
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reset Confirmation Dialog */}
      <AlertDialog
        isOpen={isResetDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeResetDialog}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" borderColor="whiteAlpha.200">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Reset Settings
            </AlertDialogHeader>

            <AlertDialogBody color="whiteAlpha.800">
              Are you sure you want to reset all settings to their default values? 
              This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button 
                ref={cancelRef} 
                onClick={closeResetDialog}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleReset}
                ml={3}
                bg="red.600"
                _hover={{ bg: "red.700" }}
              >
                Reset All Settings
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default ChatSettings;