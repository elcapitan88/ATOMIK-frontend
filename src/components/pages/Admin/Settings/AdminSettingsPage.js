import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Textarea,
  Divider,
  Badge,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useToast,
  Tooltip,
  Icon,
  SimpleGrid,
  InputGroup,
  InputRightElement,
  Code,
  Radio,
  RadioGroup,
  Stack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import {
  Save,
  Settings,
  RefreshCw,
  AlertTriangle,
  Globe,
  Mail,
  Server,
  Shield,
  Clock,
  Database,
  HelpCircle,
  Zap,
  Copy,
  Key,
  CheckCircle,
  Lock,
  Upload,
  Download,
  Trash2,
  Edit,
  Send
} from 'lucide-react';
import AdminService from '../../../../services/api/admin';

// Mock settings data
const mockSettings = {
  general: {
    siteName: "Atomik Trading",
    supportEmail: "support@atomiktrading.io",
    maintenanceMode: false,
    defaultLanguage: "en",
    defaultTimezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h"
  },
  security: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumber: true,
    passwordRequireSymbol: true,
    sessionTimeout: 60, // minutes
    maxLoginAttempts: 5,
    twoFactorEnabled: true,
    loginThrottlingEnabled: true,
    apiRateLimiting: true
  },
  email: {
    smtpServer: "smtp.sendgrid.net",
    smtpPort: 587,
    smtpUsername: "apikey",
    smtpPassword: "••••••••••••••••••••••",
    emailFromAddress: "no-reply@atomiktrading.io",
    emailFromName: "Atomik Trading",
    emailFooterText: "© 2025 Atomik Trading. All rights reserved."
  },
  webhooks: {
    defaultTimeout: 30, // seconds
    maxRetries: 3,
    retryDelay: 5, // seconds
    webhookLoggingEnabled: true,
    loggingRetentionDays: 30
  },
  trading: {
    defaultOrderTimeInForce: "GTC",
    defaultTradeSize: 1,
    safeguardEnabled: true,
    maxPositionValue: 100000,
    maxDailyLoss: 1000,
    tradingHoursStart: "09:30",
    tradingHoursEnd: "16:00",
    tradingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  },
  api: {
    apiUrl: "https://api.atomiktrading.io",
    wsUrl: "wss://api.atomiktrading.io",
    tokenLifetime: 86400, // seconds (24 hours)
    refreshTokenLifetime: 604800, // seconds (7 days)
    publicApiKey: "pk_live_51QQYUaDw86VJEB1aD1eqK8oWcR1iZfGcTSc",
    webhookSigningSecret: "whsec_GvTdYUBjleRQFCHxYQQrvE7egpUNEw7PpcSwwIw0Pb3"
  },
  backups: {
    backupSchedule: "daily",
    backupTime: "02:00",
    backupRetention: 30, // days
    lastBackupDate: "2025-04-12T02:00:00Z",
    backupLocation: "AWS S3",
    backupEncrypted: true
  }
};

// Email Template Testing Component
const EmailTemplateTest = () => {
  const [recipient, setRecipient] = useState('');
  const [template, setTemplate] = useState('welcome');
  const [sending, setSending] = useState(false);
  const toast = useToast();
  
  const handleTestEmail = () => {
    setSending(true);
    
    // Simulate sending a test email
    setTimeout(() => {
      setSending(false);
      toast({
        title: "Test email sent",
        description: `Email template "${template}" was sent to ${recipient}`,
        status: "success",
        duration: 3000,
      });
      setRecipient('');
    }, 1500);
  };
  
  return (
    <Box bg="blackAlpha.400" p={4} borderRadius="md">
      <Heading size="sm" mb={4} color="white">Test Email Template</Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <FormControl>
          <FormLabel fontSize="sm">Recipient Email</FormLabel>
          <Input 
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="test@example.com"
            size="sm"
            bg="whiteAlpha.100"
          />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">Template</FormLabel>
          <Select 
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            size="sm"
            bg="whiteAlpha.100"
          >
            <option value="welcome" style={{ backgroundColor: "#1A202C" }}>Welcome Email</option>
            <option value="password_reset" style={{ backgroundColor: "#1A202C" }}>Password Reset</option>
            <option value="account_verification" style={{ backgroundColor: "#1A202C" }}>Account Verification</option>
            <option value="webhook_error" style={{ backgroundColor: "#1A202C" }}>Webhook Error</option>
            <option value="subscription_renewal" style={{ backgroundColor: "#1A202C" }}>Subscription Renewal</option>
          </Select>
        </FormControl>
        <Button 
          leftIcon={<Send size={16} />} 
          colorScheme="blue" 
          size="sm" 
          alignSelf="flex-end"
          onClick={handleTestEmail}
          isLoading={sending}
          loadingText="Sending"
          isDisabled={!recipient}
        >
          Send Test
        </Button>
      </SimpleGrid>
    </Box>
  );
};

// API Key Management Component
const ApiKeyManagement = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [keys, setKeys] = useState([
    { id: 'key1', name: 'Primary API Key', key: 'sk_live_51QQYUaDw86VJEB1aD1eqK8oWcR1iZfGcTScdwjleYQxJvuPYQr', created: '2025-01-15T10:00:00Z', lastUsed: '2025-04-13T08:32:15Z' },
    { id: 'key2', name: 'Backup API Key', key: 'sk_live_51QQYUbVKh86VJEB1aD1eqK8oWcR1iZfGcTScdwjleYQxJvuPYQr', created: '2025-02-20T14:30:00Z', lastUsed: '2025-03-28T16:45:22Z' },
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState(null);
  const toast = useToast();
  
  // Generate a new API key
  const generateKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name required",
        description: "Please provide a name for the new API key",
        status: "error",
        duration: 3000,
      });
      return;
    }
    
    // Simulate API key generation
    const generatedKey = 'sk_live_' + Array(40).fill(0).map(() => 
      Math.random().toString(36).charAt(2)).join('');
    
    setNewKey(generatedKey);
  };
  
  // Save the newly generated key
  const saveNewKey = () => {
    const now = new Date().toISOString();
    setKeys([...keys, {
      id: `key${keys.length + 1}`,
      name: newKeyName,
      key: newKey,
      created: now,
      lastUsed: null
    }]);
    
    setNewKey(null);
    setNewKeyName('');
    onClose();
    
    toast({
      title: "API key created",
      description: "Your new API key has been created successfully",
      status: "success",
      duration: 3000,
    });
  };
  
  // Copy key to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      status: "success",
      duration: 2000,
    });
  };
  
  // Delete API key
  const deleteKey = (id) => {
    setKeys(keys.filter(key => key.id !== id));
    toast({
      title: "API key deleted",
      status: "success",
      duration: 3000,
    });
  };
  
  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };
  
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="sm" color="white">API Keys</Heading>
        <Button 
          leftIcon={<Key size={16} />} 
          colorScheme="blue" 
          size="sm" 
          onClick={onOpen}
        >
          Generate New Key
        </Button>
      </Flex>
      
      <Box bg="blackAlpha.400" borderRadius="md" overflow="hidden">
        <VStack spacing={0} align="stretch">
          {keys.map((apiKey, index) => (
            <Box key={apiKey.id} p={4} borderBottom={index < keys.length - 1 ? "1px solid" : "none"} borderColor="whiteAlpha.200">
              <Flex justify="space-between" align="center">
                <VStack align="flex-start" spacing={1}>
                  <Text fontWeight="medium" color="white">{apiKey.name}</Text>
                  <Code fontSize="sm" bg="blackAlpha.500" p={1} borderRadius="md">
                    {apiKey.key.substring(0, 12)}...{apiKey.key.substring(apiKey.key.length - 6)}
                  </Code>
                </VStack>
                <HStack>
                  <Tooltip label="Copy API Key">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(apiKey.key)}
                      color="blue.400"
                      _hover={{ bg: "whiteAlpha.100" }}
                    >
                      <Copy size={16} />
                    </Button>
                  </Tooltip>
                  <Tooltip label="Delete API Key">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => deleteKey(apiKey.id)}
                      color="red.400"
                      _hover={{ bg: "whiteAlpha.100" }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </Tooltip>
                </HStack>
              </Flex>
              <HStack spacing={4} mt={2} fontSize="xs" color="whiteAlpha.600">
                <Text>Created: {formatRelativeTime(apiKey.created)}</Text>
                <Text>Last used: {apiKey.lastUsed ? formatRelativeTime(apiKey.lastUsed) : 'Never'}</Text>
              </HStack>
            </Box>
          ))}
          
          {keys.length === 0 && (
            <Box p={4}>
              <Text color="whiteAlpha.600" textAlign="center">No API keys found</Text>
            </Box>
          )}
        </VStack>
      </Box>
      
      {/* New API Key Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="rgba(0, 0, 0, 0.8)" color="white">
          <ModalHeader>Generate New API Key</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {!newKey ? (
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Key Name</FormLabel>
                  <Input 
                    placeholder="e.g. Production API Key" 
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    bg="whiteAlpha.100"
                  />
                </FormControl>
                
                <Alert status="warning" bg="yellow.900" borderRadius="md">
                  <AlertIcon color="yellow.200" />
                  <Box>
                    <AlertTitle>Security Notice</AlertTitle>
                    <AlertDescription fontSize="sm">
                      This key will have full access to the API. Make sure to keep it secure.
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            ) : (
              <VStack spacing={4} align="stretch">
                <Alert status="success" bg="green.900" borderRadius="md" mb={4}>
                  <AlertIcon color="green.200" />
                  <AlertTitle>API Key Generated!</AlertTitle>
                </Alert>
                
                <Box bg="blackAlpha.400" p={3} borderRadius="md">
                  <Text fontSize="sm" color="whiteAlpha.600" mb={1}>Your API Key:</Text>
                  <Code fontSize="sm" wordBreak="break-all" p={2} bg="blackAlpha.500">
                    {newKey}
                  </Code>
                </Box>
                
                <Alert status="warning" bg="red.900" borderRadius="md">
                  <AlertIcon color="red.200" />
                  <Box>
                    <AlertTitle>Important!</AlertTitle>
                    <AlertDescription fontSize="sm">
                      This key will only be displayed once. Please save it somewhere secure.
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            {!newKey ? (
              <>
                <Button variant="ghost" mr={3} onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  colorScheme="blue" 
                  onClick={generateKey}
                  isDisabled={!newKeyName.trim()}
                >
                  Generate Key
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  mr={3} 
                  leftIcon={<Copy size={16} />}
                  onClick={() => copyToClipboard(newKey)}
                >
                  Copy Key
                </Button>
                <Button 
                  colorScheme="blue" 
                  onClick={saveNewKey}
                >
                  Done
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

// Backup Management Component
const BackupManagement = () => {
  const [backups, setBackups] = useState([
    { id: 'bak1', filename: 'atomik-backup-20250413.zip', size: '458 MB', date: '2025-04-13T02:00:00Z', status: 'completed' },
    { id: 'bak2', filename: 'atomik-backup-20250412.zip', size: '456 MB', date: '2025-04-12T02:00:00Z', status: 'completed' },
    { id: 'bak3', filename: 'atomik-backup-20250411.zip', size: '455 MB', date: '2025-04-11T02:00:00Z', status: 'completed' },
    { id: 'bak4', filename: 'atomik-backup-20250410.zip', size: '452 MB', date: '2025-04-10T02:00:00Z', status: 'completed' },
    { id: 'bak5', filename: 'atomik-backup-20250409.zip', size: '451 MB', date: '2025-04-09T02:00:00Z', status: 'completed' },
  ]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const toast = useToast();
  
  // Create a new backup
  const createBackup = () => {
    setIsCreatingBackup(true);
    
    // Simulate backup creation
    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const newBackup = {
        id: `bak${backups.length + 1}`,
        filename: `atomik-backup-${dateStr}.zip`,
        size: '459 MB',
        date: now.toISOString(),
        status: 'completed'
      };
      
      setBackups([newBackup, ...backups]);
      setIsCreatingBackup(false);
      
      toast({
        title: "Backup created successfully",
        status: "success",
        duration: 3000,
      });
    }, 3000);
  };
  
  // Download a backup
  const downloadBackup = (id) => {
    const backup = backups.find(b => b.id === id);
    
    toast({
      title: "Download started",
      description: `Downloading ${backup.filename}`,
      status: "info",
      duration: 3000,
    });
  };
  
  // Delete a backup
  const deleteBackup = (id) => {
    setBackups(backups.filter(b => b.id !== id));
    
    toast({
      title: "Backup deleted",
      status: "success",
      duration: 3000,
    });
  };
  
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="sm" color="white">Database Backups</Heading>
        <Button 
          leftIcon={<Download size={16} />} 
          colorScheme="blue" 
          size="sm" 
          onClick={createBackup}
          isLoading={isCreatingBackup}
          loadingText="Creating Backup"
        >
          Create Backup Now
        </Button>
      </Flex>
      
      <Box bg="blackAlpha.400" borderRadius="md" overflow="hidden">
        <VStack spacing={0} align="stretch">
          {backups.map((backup, index) => (
            <Box key={backup.id} p={4} borderBottom={index < backups.length - 1 ? "1px solid" : "none"} borderColor="whiteAlpha.200">
              <Flex justify="space-between" align="center">
                <VStack align="flex-start" spacing={1}>
                  <Text fontWeight="medium" color="white">{backup.filename}</Text>
                  <HStack spacing={4} fontSize="xs" color="whiteAlpha.600">
                    <Text>Size: {backup.size}</Text>
                    <Text>Date: {new Date(backup.date).toLocaleString()}</Text>
                    <Badge colorScheme="green">
                      {backup.status}
                    </Badge>
                  </HStack>
                </VStack>
                <HStack>
                  <Tooltip label="Download Backup">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => downloadBackup(backup.id)}
                      color="blue.400"
                      _hover={{ bg: "whiteAlpha.100" }}
                    >
                      <Download size={16} />
                    </Button>
                  </Tooltip>
                  <Tooltip label="Delete Backup">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => deleteBackup(backup.id)}
                      color="red.400"
                      _hover={{ bg: "whiteAlpha.100" }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </Tooltip>
                </HStack>
              </Flex>
            </Box>
          ))}
          
          {backups.length === 0 && (
            <Box p={4}>
              <Text color="whiteAlpha.600" textAlign="center">No backups found</Text>
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

const AdminSettingsPage = () => {
  // State for settings
  const [settings, setSettings] = useState(mockSettings);
  const [maintenanceSettings, setMaintenanceSettings] = useState({ is_enabled: false, message: '' });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMaintenance, setIsLoadingMaintenance] = useState(true);
  const toast = useToast();
  
  // Load maintenance settings on component mount
  useEffect(() => {
    loadMaintenanceSettings();
  }, []);

  const loadMaintenanceSettings = async () => {
    try {
      setIsLoadingMaintenance(true);
      const data = await AdminService.getMaintenanceSettings();
      setMaintenanceSettings({
        is_enabled: data.is_enabled,
        message: data.message || ''
      });
    } catch (error) {
      console.error('Error loading maintenance settings:', error);
      toast({
        title: "Error loading maintenance settings",
        description: "Failed to load current maintenance settings",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsLoadingMaintenance(false);
    }
  };

  // Handle input change
  const handleChange = (section, field, value) => {
    if (section === 'maintenance') {
      setMaintenanceSettings({
        ...maintenanceSettings,
        [field]: value
      });
      setIsDirty(true);
    } else {
      setSettings({
        ...settings,
        [section]: {
          ...settings[section],
          [field]: value
        }
      });
      setIsDirty(true);
    }
  };
  
  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Save maintenance settings if they were changed
      if (isDirty) {
        await AdminService.updateMaintenanceSettings(maintenanceSettings);
      }
      
      setIsDirty(false);
      
      toast({
        title: "Settings saved",
        description: "Your changes have been saved successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: "Failed to save settings. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" color="white">System Settings</Heading>
          <Text color="whiteAlpha.600">Configure global application settings</Text>
        </Box>
        <HStack spacing={4}>
          <Button 
            leftIcon={<RefreshCw size={16} />} 
            variant="ghost" 
            color="white" 
            _hover={{ bg: "whiteAlpha.100" }}
          >
            Reset
          </Button>
          <Button 
            leftIcon={<Save size={16} />} 
            colorScheme="blue" 
            isDisabled={!isDirty}
            onClick={saveSettings}
            isLoading={isSaving}
            loadingText="Saving"
          >
            Save Changes
          </Button>
        </HStack>
      </Flex>
      
      {/* Settings Tabs */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">
            <HStack spacing={2}>
              <Globe size={16} />
              <Text>General</Text>
            </HStack>
          </Tab>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">
            <HStack spacing={2}>
              <Shield size={16} />
              <Text>Security</Text>
            </HStack>
          </Tab>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">
            <HStack spacing={2}>
              <Mail size={16} />
              <Text>Email</Text>
            </HStack>
          </Tab>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">
            <HStack spacing={2}>
              <Zap size={16} />
              <Text>Webhooks</Text>
            </HStack>
          </Tab>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">
            <HStack spacing={2}>
              <Server size={16} />
              <Text>API</Text>
            </HStack>
          </Tab>
          <Tab _selected={{ color: "blue.400", bg: "rgba(0, 0, 0, 0.4)" }} color="white">
            <HStack spacing={2}>
              <Database size={16} />
              <Text>Backup</Text>
            </HStack>
          </Tab>
        </TabList>
        
        <TabPanels mt={6}>
          {/* General Settings */}
          <TabPanel p={0}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              {/* Site Settings */}
              <Box 
                bg="rgba(0, 0, 0, 0.4)" 
                p={6} 
                borderRadius="xl" 
                border="1px solid" 
                borderColor="whiteAlpha.200"
              >
                <Heading size="md" color="white" mb={4}>Site Settings</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Site Name</FormLabel>
                    <Input 
                      value={settings.general.siteName}
                      onChange={(e) => handleChange('general', 'siteName', e.target.value)}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Support Email</FormLabel>
                    <Input 
                      value={settings.general.supportEmail}
                      onChange={(e) => handleChange('general', 'supportEmail', e.target.value)}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="maintenance-mode" mb="0">
                      Maintenance Mode
                    </FormLabel>
                    <Switch
                      id="maintenance-mode"
                      isChecked={maintenanceSettings.is_enabled}
                      onChange={(e) => handleChange('maintenance', 'is_enabled', e.target.checked)}
                      colorScheme="blue"
                      isDisabled={isLoadingMaintenance}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Maintenance Message</FormLabel>
                    <Textarea 
                      value={maintenanceSettings.message}
                      onChange={(e) => handleChange('maintenance', 'message', e.target.value)}
                      placeholder="Enter a message to display to users during maintenance..."
                      bg="whiteAlpha.100"
                      rows={3}
                      isDisabled={isLoadingMaintenance}
                    />
                    <Text fontSize="xs" color="whiteAlpha.600" mt={1}>
                      This message will be shown to users when maintenance mode is enabled
                    </Text>
                  </FormControl>
                </VStack>
              </Box>
              
              {/* Localization Settings */}
              <Box 
                bg="rgba(0, 0, 0, 0.4)" 
                p={6} 
                borderRadius="xl" 
                border="1px solid" 
                borderColor="whiteAlpha.200"
              >
                <Heading size="md" color="white" mb={4}>Localization</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Default Language</FormLabel>
                    <Select 
                      value={settings.general.defaultLanguage}
                      onChange={(e) => handleChange('general', 'defaultLanguage', e.target.value)}
                      bg="whiteAlpha.100"
                    >
                      <option value="en" style={{ backgroundColor: "#1A202C" }}>English</option>
                      <option value="es" style={{ backgroundColor: "#1A202C" }}>Spanish</option>
                      <option value="fr" style={{ backgroundColor: "#1A202C" }}>French</option>
                      <option value="de" style={{ backgroundColor: "#1A202C" }}>German</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Default Timezone</FormLabel>
                    <Select 
                      value={settings.general.defaultTimezone}
                      onChange={(e) => handleChange('general', 'defaultTimezone', e.target.value)}
                      bg="whiteAlpha.100"
                    >
                      <option value="UTC" style={{ backgroundColor: "#1A202C" }}>UTC</option>
                      <option value="America/New_York" style={{ backgroundColor: "#1A202C" }}>Eastern Time (ET)</option>
                      <option value="America/Chicago" style={{ backgroundColor: "#1A202C" }}>Central Time (CT)</option>
                      <option value="America/Denver" style={{ backgroundColor: "#1A202C" }}>Mountain Time (MT)</option>
                      <option value="America/Los_Angeles" style={{ backgroundColor: "#1A202C" }}>Pacific Time (PT)</option>
                    </Select>
                  </FormControl>
                  
                  <Grid templateColumns="1fr 1fr" gap={4}>
                    <FormControl>
                      <FormLabel>Date Format</FormLabel>
                      <Select 
                        value={settings.general.dateFormat}
                        onChange={(e) => handleChange('general', 'dateFormat', e.target.value)}
                        bg="whiteAlpha.100"
                      >
                        <option value="MM/DD/YYYY" style={{ backgroundColor: "#1A202C" }}>MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY" style={{ backgroundColor: "#1A202C" }}>DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD" style={{ backgroundColor: "#1A202C" }}>YYYY-MM-DD</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Time Format</FormLabel>
                      <Select 
                        value={settings.general.timeFormat}
                        onChange={(e) => handleChange('general', 'timeFormat', e.target.value)}
                        bg="whiteAlpha.100"
                      >
                        <option value="12h" style={{ backgroundColor: "#1A202C" }}>12-hour (AM/PM)</option>
                        <option value="24h" style={{ backgroundColor: "#1A202C" }}>24-hour</option>
                      </Select>
                    </FormControl>
                  </Grid>
                </VStack>
              </Box>
            </SimpleGrid>
          </TabPanel>
          
          {/* Security Settings */}
          <TabPanel p={0}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              {/* Password Settings */}
              <Box 
                bg="rgba(0, 0, 0, 0.4)" 
                p={6} 
                borderRadius="xl" 
                border="1px solid" 
                borderColor="whiteAlpha.200"
              >
                <Heading size="md" color="white" mb={4}>Password Security</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Minimum Password Length</FormLabel>
                    <Input 
                      type="number" 
                      value={settings.security.passwordMinLength}
                      onChange={(e) => handleChange('security', 'passwordMinLength', parseInt(e.target.value))}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="require-uppercase" mb="0">
                      Require Uppercase Letter
                    </FormLabel>
                    <Switch
                      id="require-uppercase"
                      isChecked={settings.security.passwordRequireUppercase}
                      onChange={(e) => handleChange('security', 'passwordRequireUppercase', e.target.checked)}
                      colorScheme="blue"
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="require-number" mb="0">
                      Require Number
                    </FormLabel>
                    <Switch
                      id="require-number"
                      isChecked={settings.security.passwordRequireNumber}
                      onChange={(e) => handleChange('security', 'passwordRequireNumber', e.target.checked)}
                      colorScheme="blue"
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="require-symbol" mb="0">
                      Require Special Character
                    </FormLabel>
                    <Switch
                      id="require-symbol"
                      isChecked={settings.security.passwordRequireSymbol}
                      onChange={(e) => handleChange('security', 'passwordRequireSymbol', e.target.checked)}
                      colorScheme="blue"
                    />
                  </FormControl>
                </VStack>
              </Box>
              
              {/* Authentication Settings */}
              <Box 
                bg="rgba(0, 0, 0, 0.4)" 
                p={6} 
                borderRadius="xl" 
                border="1px solid" 
                borderColor="whiteAlpha.200"
              >
                <Heading size="md" color="white" mb={4}>Authentication</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Session Timeout (minutes)</FormLabel>
                    <Input 
                      type="number" 
                      value={settings.security.sessionTimeout}
                      onChange={(e) => handleChange('security', 'sessionTimeout', parseInt(e.target.value))}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Max Login Attempts</FormLabel>
                    <Input 
                      type="number" 
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => handleChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="two-factor" mb="0">
                      Enable Two-Factor Authentication
                    </FormLabel>
                    <Switch
                      id="two-factor"
                      isChecked={settings.security.twoFactorEnabled}
                      onChange={(e) => handleChange('security', 'twoFactorEnabled', e.target.checked)}
                      colorScheme="blue"
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="login-throttling" mb="0">
                      Enable Login Throttling
                    </FormLabel>
                    <Switch
                      id="login-throttling"
                      isChecked={settings.security.loginThrottlingEnabled}
                      onChange={(e) => handleChange('security', 'loginThrottlingEnabled', e.target.checked)}
                      colorScheme="blue"
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="rate-limiting" mb="0">
                      Enable API Rate Limiting
                    </FormLabel>
                    <Switch
                      id="rate-limiting"
                      isChecked={settings.security.apiRateLimiting}
                      onChange={(e) => handleChange('security', 'apiRateLimiting', e.target.checked)}
                      colorScheme="blue"
                    />
                  </FormControl>
                </VStack>
              </Box>
            </SimpleGrid>
          </TabPanel>
          
          {/* Email Settings */}
          <TabPanel p={0}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              {/* SMTP Settings */}
              <Box 
                bg="rgba(0, 0, 0, 0.4)" 
                p={6} 
                borderRadius="xl" 
                border="1px solid" 
                borderColor="whiteAlpha.200"
              >
                <Heading size="md" color="white" mb={4}>SMTP Configuration</Heading>
                <VStack spacing={4} align="stretch">
                  <Grid templateColumns="1fr 120px" gap={4}>
                    <FormControl>
                      <FormLabel>SMTP Server</FormLabel>
                      <Input 
                        value={settings.email.smtpServer}
                        onChange={(e) => handleChange('email', 'smtpServer', e.target.value)}
                        bg="whiteAlpha.100"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Port</FormLabel>
                      <Input 
                        type="number" 
                        value={settings.email.smtpPort}
                        onChange={(e) => handleChange('email', 'smtpPort', parseInt(e.target.value))}
                        bg="whiteAlpha.100"
                      />
                    </FormControl>
                  </Grid>
                  
                  <FormControl>
                    <FormLabel>SMTP Username</FormLabel>
                    <Input 
                      value={settings.email.smtpUsername}
                      onChange={(e) => handleChange('email', 'smtpUsername', e.target.value)}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>SMTP Password</FormLabel>
                    <Input 
                      type="password" 
                      value={settings.email.smtpPassword}
                      onChange={(e) => handleChange('email', 'smtpPassword', e.target.value)}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <Button 
                    leftIcon={<Send size={16} />} 
                    colorScheme="blue" 
                    size="sm" 
                    alignSelf="flex-start"
                    mt={2}
                  >
                    Test Connection
                  </Button>
                </VStack>
              </Box>
              
              {/* Email Content Settings */}
              <Box 
                bg="rgba(0, 0, 0, 0.4)" 
                p={6} 
                borderRadius="xl" 
                border="1px solid" 
                borderColor="whiteAlpha.200"
              >
                <Heading size="md" color="white" mb={4}>Email Content</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>From Email Address</FormLabel>
                    <Input 
                      value={settings.email.emailFromAddress}
                      onChange={(e) => handleChange('email', 'emailFromAddress', e.target.value)}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>From Name</FormLabel>
                    <Input 
                      value={settings.email.emailFromName}
                      onChange={(e) => handleChange('email', 'emailFromName', e.target.value)}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Email Footer Text</FormLabel>
                    <Textarea 
                      value={settings.email.emailFooterText}
                      onChange={(e) => handleChange('email', 'emailFooterText', e.target.value)}
                      bg="whiteAlpha.100"
                      rows={3}
                    />
                  </FormControl>
                  
                  <EmailTemplateTest />
                </VStack>
              </Box>
            </SimpleGrid>
          </TabPanel>
          
          {/* Webhook Settings */}
          <TabPanel p={0}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              {/* Webhook Configuration */}
              <Box 
                bg="rgba(0, 0, 0, 0.4)" 
                p={6} 
                borderRadius="xl" 
                border="1px solid" 
                borderColor="whiteAlpha.200"
              >
                <Heading size="md" color="white" mb={4}>Webhook Configuration</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Default Timeout (seconds)</FormLabel>
                    <Input 
                      type="number" 
                      value={settings.webhooks.defaultTimeout}
                      onChange={(e) => handleChange('webhooks', 'defaultTimeout', parseInt(e.target.value))}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Max Retries</FormLabel>
                    <Input 
                      type="number" 
                      value={settings.webhooks.maxRetries}
                      onChange={(e) => handleChange('webhooks', 'maxRetries', parseInt(e.target.value))}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Retry Delay (seconds)</FormLabel>
                    <Input 
                      type="number" 
                      value={settings.webhooks.retryDelay}
                      onChange={(e) => handleChange('webhooks', 'retryDelay', parseInt(e.target.value))}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                </VStack>
              </Box>
              
              {/* Webhook Logging */}
              <Box 
                bg="rgba(0, 0, 0, 0.4)" 
                p={6} 
                borderRadius="xl" 
                border="1px solid" 
                borderColor="whiteAlpha.200"
              >
                <Heading size="md" color="white" mb={4}>Webhook Logging</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="webhook-logging" mb="0">
                      Enable Webhook Logging
                    </FormLabel>
                    <Switch
                      id="webhook-logging"
                      isChecked={settings.webhooks.webhookLoggingEnabled}
                      onChange={(e) => handleChange('webhooks', 'webhookLoggingEnabled', e.target.checked)}
                      colorScheme="blue"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Log Retention (days)</FormLabel>
                    <Input 
                      type="number" 
                      value={settings.webhooks.loggingRetentionDays}
                      onChange={(e) => handleChange('webhooks', 'loggingRetentionDays', parseInt(e.target.value))}
                      bg="whiteAlpha.100"
                      isDisabled={!settings.webhooks.webhookLoggingEnabled}
                    />
                  </FormControl>
                  
                  <Alert status="info" bg="blue.900" borderRadius="md">
                    <AlertIcon color="blue.200" />
                    <Box>
                      <AlertTitle>Webhook Debug Mode</AlertTitle>
                      <AlertDescription fontSize="sm">
                        When enabled, webhook logging will capture request and response payloads for debugging.
                      </AlertDescription>
                    </Box>
                  </Alert>
                </VStack>
              </Box>
            </SimpleGrid>
          </TabPanel>
          
          {/* API Settings */}
          <TabPanel p={0}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              {/* API Configuration */}
              <Box 
                bg="rgba(0, 0, 0, 0.4)" 
                p={6} 
                borderRadius="xl" 
                border="1px solid" 
                borderColor="whiteAlpha.200"
              >
                <Heading size="md" color="white" mb={4}>API Configuration</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>API URL</FormLabel>
                    <Input 
                      value={settings.api.apiUrl}
                      onChange={(e) => handleChange('api', 'apiUrl', e.target.value)}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>WebSocket URL</FormLabel>
                    <Input 
                      value={settings.api.wsUrl}
                      onChange={(e) => handleChange('api', 'wsUrl', e.target.value)}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Token Lifetime (seconds)</FormLabel>
                    <Input 
                      type="number" 
                      value={settings.api.tokenLifetime}
                      onChange={(e) => handleChange('api', 'tokenLifetime', parseInt(e.target.value))}
                      bg="whiteAlpha.100"
                    />
                    <Text fontSize="xs" color="whiteAlpha.600" mt={1}>
                      {Math.floor(settings.api.tokenLifetime / 3600)} hours
                    </Text>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Refresh Token Lifetime (seconds)</FormLabel>
                    <Input 
                      type="number" 
                      value={settings.api.refreshTokenLifetime}
                      onChange={(e) => handleChange('api', 'refreshTokenLifetime', parseInt(e.target.value))}
                      bg="whiteAlpha.100"
                    />
                    <Text fontSize="xs" color="whiteAlpha.600" mt={1}>
                      {Math.floor(settings.api.refreshTokenLifetime / 86400)} days
                    </Text>
                  </FormControl>
                </VStack>
              </Box>
              
              {/* API Keys */}
              <Box 
                bg="rgba(0, 0, 0, 0.4)" 
                p={6} 
                borderRadius="xl" 
                border="1px solid" 
                borderColor="whiteAlpha.200"
              >
                <ApiKeyManagement />
              </Box>
            </SimpleGrid>
          </TabPanel>
          
          {/* Backup Settings */}
          <TabPanel p={0}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              {/* Backup Configuration */}
              <Box 
                bg="rgba(0, 0, 0, 0.4)" 
                p={6} 
                borderRadius="xl" 
                border="1px solid" 
                borderColor="whiteAlpha.200"
              >
                <Heading size="md" color="white" mb={4}>Backup Configuration</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Backup Schedule</FormLabel>
                    <Select 
                      value={settings.backups.backupSchedule}
                      onChange={(e) => handleChange('backups', 'backupSchedule', e.target.value)}
                      bg="whiteAlpha.100"
                    >
                      <option value="daily" style={{ backgroundColor: "#1A202C" }}>Daily</option>
                      <option value="weekly" style={{ backgroundColor: "#1A202C" }}>Weekly</option>
                      <option value="monthly" style={{ backgroundColor: "#1A202C" }}>Monthly</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Backup Time</FormLabel>
                    <Input 
                      type="time" 
                      value={settings.backups.backupTime}
                      onChange={(e) => handleChange('backups', 'backupTime', e.target.value)}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Backup Retention (days)</FormLabel>
                    <Input 
                      type="number" 
                      value={settings.backups.backupRetention}
                      onChange={(e) => handleChange('backups', 'backupRetention', parseInt(e.target.value))}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Backup Location</FormLabel>
                    <Input 
                      value={settings.backups.backupLocation}
                      onChange={(e) => handleChange('backups', 'backupLocation', e.target.value)}
                      bg="whiteAlpha.100"
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="backup-encryption" mb="0">
                      Enable Backup Encryption
                    </FormLabel>
                    <Switch
                      id="backup-encryption"
                      isChecked={settings.backups.backupEncrypted}
                      onChange={(e) => handleChange('backups', 'backupEncrypted', e.target.checked)}
                      colorScheme="blue"
                    />
                  </FormControl>
                </VStack>
              </Box>
              
              {/* Backup Management */}
              <Box 
                bg="rgba(0, 0, 0, 0.4)" 
                p={6} 
                borderRadius="xl" 
                border="1px solid" 
                borderColor="whiteAlpha.200"
              >
                <BackupManagement />
              </Box>
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default AdminSettingsPage;