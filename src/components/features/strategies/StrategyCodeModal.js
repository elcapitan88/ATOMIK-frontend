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
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  useToast,
  Switch,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
  Tooltip,
  Card,
  CardHeader,
  CardBody,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { Code, Play, Trash2, Edit, Check, X } from 'lucide-react';
import { strategyCodesApi } from '@/services/api/strategies/strategyCodesApi';

const StrategyCodeCard = ({ code, onEdit, onDelete, onToggle, onValidate }) => {
  return (
    <Card bg="whiteAlpha.100" borderRadius="lg" borderColor="whiteAlpha.200">
      <CardHeader pb={2}>
        <Flex align="center">
          <HStack spacing={2} flex={1}>
            <Box p={2} bg="purple.500" borderRadius="md">
              <Code size={16} />
            </Box>
            <VStack spacing={0} align="start">
              <Text fontWeight="bold" color="white">
                {code.name}
              </Text>
              <Text fontSize="sm" color="whiteAlpha.600">
                Version {code.version}
              </Text>
            </VStack>
          </HStack>
          <HStack spacing={2}>
            <Badge colorScheme={code.is_validated ? 'green' : 'orange'}>
              {code.is_validated ? 'Validated' : 'Not Validated'}
            </Badge>
            <Badge colorScheme={code.is_active ? 'green' : 'red'}>
              {code.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </HStack>
        </Flex>
      </CardHeader>
      
      <CardBody pt={0}>
        <VStack spacing={3} align="stretch">
          {code.description && (
            <Text fontSize="sm" color="whiteAlpha.700">
              {code.description}
            </Text>
          )}
          
          {code.symbols_list && code.symbols_list.length > 0 && (
            <Box>
              <Text fontSize="xs" color="whiteAlpha.600" mb={1}>
                Supported Symbols:
              </Text>
              <HStack spacing={1} flexWrap="wrap">
                {code.symbols_list.map(symbol => (
                  <Badge key={symbol} size="sm" colorScheme="blue">
                    {symbol}
                  </Badge>
                ))}
              </HStack>
            </Box>
          )}

          <HStack spacing={4} fontSize="sm" color="whiteAlpha.600">
            <Text>Signals: {code.signals_generated || 0}</Text>
            <Text>Errors: {code.error_count || 0}</Text>
          </HStack>

          {code.last_error_message && (
            <Alert status="error" size="sm" borderRadius="md">
              <AlertIcon />
              <AlertDescription fontSize="xs">
                {code.last_error_message.substring(0, 100)}...
              </AlertDescription>
            </Alert>
          )}

          <HStack spacing={2} justify="flex-end">
            <Tooltip label="Validate Code">
              <IconButton
                icon={<Check size={16} />}
                size="sm"
                variant="ghost"
                colorScheme="green"
                onClick={() => onValidate(code.id)}
                isDisabled={code.is_validated}
              />
            </Tooltip>
            <Tooltip label="Edit Code">
              <IconButton
                icon={<Edit size={16} />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={() => onEdit(code)}
              />
            </Tooltip>
            <Tooltip label={code.is_active ? 'Deactivate' : 'Activate'}>
              <IconButton
                icon={code.is_active ? <X size={16} /> : <Play size={16} />}
                size="sm"
                variant="ghost"
                colorScheme={code.is_active ? 'orange' : 'green'}
                onClick={() => onToggle(code.id)}
              />
            </Tooltip>
            <Tooltip label="Delete Code">
              <IconButton
                icon={<Trash2 size={16} />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={() => onDelete(code.id)}
              />
            </Tooltip>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

const StrategyCodeModal = ({
  isOpen,
  onClose,
  onSave,
  strategyCodes
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    symbols: '',
    is_active: true,
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        code: '',
        symbols: '',
        is_active: true,
      });
      setEditingCode(null);
      setValidationResult(null);
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Strategy name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Strategy code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const submitData = {
        ...formData,
        symbols: formData.symbols ? formData.symbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : []
      };

      if (editingCode) {
        await strategyCodesApi.updateStrategyCode(editingCode.id, submitData);
        toast({
          title: "Strategy code updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await strategyCodesApi.createStrategyCode(submitData);
        toast({
          title: "Strategy code created",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      
      setFormData({
        name: '',
        description: '',
        code: '',
        symbols: '',
        is_active: true,
      });
      setEditingCode(null);
      await onSave();
    } catch (error) {
      toast({
        title: "Error saving strategy code",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateCode = async () => {
    if (!formData.code.trim()) {
      toast({
        title: "No code to validate",
        description: "Please enter strategy code first",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await strategyCodesApi.validateStrategyCode({
        name: formData.name || 'Untitled',
        code: formData.code,
        symbols: formData.symbols ? formData.symbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : []
      });
      
      setValidationResult(result);
      
      if (result.is_valid) {
        toast({
          title: "Code validation successful",
          description: "Your strategy code is valid",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Code validation failed",
          description: result.error_message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Validation error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCode = (code) => {
    setEditingCode(code);
    setFormData({
      name: code.name,
      description: code.description || '',
      code: code.code,
      symbols: code.symbols_list ? code.symbols_list.join(', ') : '',
      is_active: code.is_active,
    });
  };

  const handleDeleteCode = async (codeId) => {
    if (!window.confirm('Are you sure you want to delete this strategy code? This action cannot be undone.')) {
      return;
    }

    try {
      await strategyCodesApi.deleteStrategyCode(codeId);
      toast({
        title: "Strategy code deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await onSave();
    } catch (error) {
      toast({
        title: "Error deleting strategy code",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleToggleCode = async (codeId) => {
    try {
      const code = strategyCodes.find(c => c.id === codeId);
      if (code.is_active) {
        await strategyCodesApi.deactivateStrategyCode(codeId);
      } else {
        await strategyCodesApi.activateStrategyCode(codeId);
      }
      toast({
        title: "Strategy code updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await onSave();
    } catch (error) {
      toast({
        title: "Error updating strategy code",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleValidateExisting = async (codeId) => {
    try {
      const code = strategyCodes.find(c => c.id === codeId);
      const result = await strategyCodesApi.validateStrategyCode({
        name: code.name,
        code: code.code,
        symbols: code.symbols_list || []
      });
      
      if (result.is_valid) {
        toast({
          title: "Code validation successful",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Code validation failed",
          description: result.error_message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
      await onSave();
    } catch (error) {
      toast({
        title: "Validation error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white" maxH="90vh">
        <ModalHeader>
          <HStack spacing={3}>
            <Box p={2} bg="purple.500" borderRadius="md">
              <Code size={20} />
            </Box>
            <Text>Strategy Code Management</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody overflow="auto">
          <Tabs colorScheme="blue">
            <TabList>
              <Tab>Create/Edit Code</Tab>
              <Tab>Existing Codes ({strategyCodes.length})</Tab>
            </TabList>

            <TabPanels>
              {/* Create/Edit Tab */}
              <TabPanel px={0}>
                <form onSubmit={handleSubmit}>
                  <VStack spacing={4} align="stretch">
                    <HStack spacing={4}>
                      <FormControl isInvalid={errors.name} flex={2}>
                        <FormLabel>Strategy Name</FormLabel>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="My Trading Strategy"
                          bg="whiteAlpha.100"
                        />
                        <FormErrorMessage>{errors.name}</FormErrorMessage>
                      </FormControl>

                      <FormControl flex={1}>
                        <FormLabel>Symbols (comma-separated)</FormLabel>
                        <Input
                          value={formData.symbols}
                          onChange={(e) => setFormData(prev => ({ ...prev, symbols: e.target.value }))}
                          placeholder="ES, MES, NQ"
                          bg="whiteAlpha.100"
                        />
                      </FormControl>
                    </HStack>

                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your strategy..."
                        bg="whiteAlpha.100"
                        rows={3}
                      />
                    </FormControl>

                    <FormControl isInvalid={errors.code}>
                      <FormLabel>Python Strategy Code</FormLabel>
                      <Textarea
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                        placeholder={`# Example strategy code:\ndef on_bar(context, data):\n    # Your trading logic here\n    if condition:\n        context.signal('BUY', symbol='ES', quantity=1)\n    elif other_condition:\n        context.signal('SELL', symbol='ES', quantity=1)`}
                        bg="whiteAlpha.100"
                        fontFamily="mono"
                        fontSize="sm"
                        rows={15}
                      />
                      <FormErrorMessage>{errors.code}</FormErrorMessage>
                    </FormControl>

                    {validationResult && (
                      <Alert
                        status={validationResult.is_valid ? 'success' : 'error'}
                        borderRadius="md"
                      >
                        <AlertIcon />
                        <Box>
                          <AlertTitle>
                            {validationResult.is_valid ? 'Validation Success!' : 'Validation Failed'}
                          </AlertTitle>
                          <AlertDescription>
                            {validationResult.is_valid 
                              ? 'Your strategy code passed validation and is ready to use.'
                              : validationResult.error_message
                            }
                          </AlertDescription>
                        </Box>
                      </Alert>
                    )}

                    <FormControl>
                      <HStack justify="space-between">
                        <FormLabel mb={0}>Active</FormLabel>
                        <Switch
                          isChecked={formData.is_active}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                          colorScheme="green"
                        />
                      </HStack>
                    </FormControl>

                    <HStack spacing={3}>
                      <Button
                        onClick={handleValidateCode}
                        isLoading={isLoading}
                        loadingText="Validating..."
                        leftIcon={<Check size={16} />}
                        colorScheme="green"
                        variant="outline"
                      >
                        Validate Code
                      </Button>
                      <Spacer />
                      <Button
                        type="submit"
                        isLoading={isLoading}
                        loadingText={editingCode ? "Updating..." : "Creating..."}
                        colorScheme="blue"
                      >
                        {editingCode ? 'Update Code' : 'Create Code'}
                      </Button>
                      {editingCode && (
                        <Button
                          onClick={() => {
                            setEditingCode(null);
                            setFormData({
                              name: '',
                              description: '',
                              code: '',
                              symbols: '',
                              is_active: true,
                            });
                          }}
                          variant="ghost"
                        >
                          Cancel Edit
                        </Button>
                      )}
                    </HStack>
                  </VStack>
                </form>
              </TabPanel>

              {/* Existing Codes Tab */}
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  {strategyCodes.length === 0 ? (
                    <Box textAlign="center" py={8}>
                      <Text color="whiteAlpha.600">
                        No strategy codes created yet. Create your first strategy code to get started.
                      </Text>
                    </Box>
                  ) : (
                    strategyCodes.map(code => (
                      <StrategyCodeCard
                        key={code.id}
                        code={code}
                        onEdit={handleEditCode}
                        onDelete={handleDeleteCode}
                        onToggle={handleToggleCode}
                        onValidate={handleValidateExisting}
                      />
                    ))
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default StrategyCodeModal;