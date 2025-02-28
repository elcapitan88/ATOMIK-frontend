// src/components/modals/SupportModal.js
import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Button,
  Input,
  Textarea,
  Select,
  Flex,
  Text,
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useToast,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { Upload, AlertCircle } from 'lucide-react';
import axiosInstance from '@/services/axiosConfig';
import logger from '@/utils/logger';

const ISSUE_TYPES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'question', label: 'Question' },
  { value: 'account', label: 'Account Issue' }
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'gray.400' },
  { value: 'medium', label: 'Medium', color: 'blue.400' },
  { value: 'high', label: 'High', color: 'orange.400' },
  { value: 'critical', label: 'Critical', color: 'red.400' }
];

const SupportModal = ({ isOpen, onClose }) => {
  // State for form data, errors, and submission status
  const [formData, setFormData] = useState({
    issueType: 'question',
    subject: '',
    description: '',
    priority: 'medium',
    screenshot: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    return newErrors;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file upload
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        screenshot: file
      }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      issueType: 'question',
      subject: '',
      description: '',
      priority: 'medium',
      screenshot: null
    });
    setErrors({});
  };

  // Handle form submission
  const handleSubmit = async () => {
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create FormData object for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('issue_type', formData.issueType);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('priority', formData.priority);
      
      if (formData.screenshot) {
        formDataToSend.append('file', formData.screenshot);
      }
      
      // In a real implementation, you'd send this to your API
      // For now, we'll simulate a successful API call
      // await axiosInstance.post('/api/v1/support/tickets', formDataToSend);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      logger.info('Support ticket submitted:', {
        issueType: formData.issueType,
        subject: formData.subject,
        hasScreenshot: !!formData.screenshot
      });
      
      toast({
        title: "Support Ticket Submitted",
        description: "Our team will review your request and respond shortly.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      resetForm();
      onClose();
    } catch (error) {
      logger.error('Error submitting support ticket:', error);
      
      toast({
        title: "Submission Failed",
        description: error.message || "Could not submit your ticket. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    const found = PRIORITY_LEVELS.find(p => p.value === priority);
    return found ? found.color : 'gray.400';
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered
      size="xl"
      closeOnOverlayClick={!isSubmitting}
    >
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent 
        bg="rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
        border="1px solid rgba(255, 255, 255, 0.18)"
        borderRadius="xl"
        color="white"
      >
        <ModalHeader borderBottom="1px solid rgba(255, 255, 255, 0.18)">
          Submit Support Ticket
        </ModalHeader>
        {!isSubmitting && <ModalCloseButton />}
        <ModalBody py={6}>
          <VStack spacing={6}>
            {/* Issue Type */}
            <FormControl isRequired>
              <FormLabel>Issue Type</FormLabel>
              <Select
                name="issueType"
                value={formData.issueType}
                onChange={handleChange}
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.300"
                _hover={{ borderColor: "whiteAlpha.400" }}
                _focus={{ 
                  borderColor: "rgba(0, 198, 224, 0.6)",
                  boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
                }}
              >
                {ISSUE_TYPES.map(type => (
                  <option key={type.value} value={type.value}
                    style={{
                      backgroundColor: 'rgba(23, 25, 35, 0.95)',
                      color: 'white'
                    }}
                  >
                    {type.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Subject */}
            <FormControl isRequired isInvalid={!!errors.subject}>
              <FormLabel>Subject</FormLabel>
              <Input
                name="subject"
                placeholder="Brief description of your issue"
                value={formData.subject}
                onChange={handleChange}
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.300"
                _hover={{ borderColor: "whiteAlpha.400" }}
                _focus={{ 
                  borderColor: "rgba(0, 198, 224, 0.6)",
                  boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
                }}
              />
              {errors.subject && (
                <FormErrorMessage>{errors.subject}</FormErrorMessage>
              )}
            </FormControl>

            {/* Description */}
            <FormControl isRequired isInvalid={!!errors.description}>
              <FormLabel>Description</FormLabel>
              <Textarea
                name="description"
                placeholder="Please provide details about your issue"
                value={formData.description}
                onChange={handleChange}
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.300"
                _hover={{ borderColor: "whiteAlpha.400" }}
                _focus={{ 
                  borderColor: "rgba(0, 198, 224, 0.6)",
                  boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
                }}
                rows={5}
              />
              {errors.description && (
                <FormErrorMessage>{errors.description}</FormErrorMessage>
              )}
            </FormControl>

            {/* Priority */}
            <FormControl>
              <FormLabel>Priority</FormLabel>
              <HStack spacing={4} mb={2}>
                {PRIORITY_LEVELS.map(priority => (
                  <Box 
                    key={priority.value}
                    as="button"
                    py={2}
                    px={3}
                    borderRadius="md"
                    bg={formData.priority === priority.value ? "whiteAlpha.200" : "transparent"}
                    border="1px solid"
                    borderColor={formData.priority === priority.value ? priority.color : "whiteAlpha.300"}
                    onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                    _hover={{ bg: "whiteAlpha.100" }}
                    transition="all 0.2s"
                  >
                    <HStack>
                      <Badge 
                        bg={`${priority.color}`} 
                        opacity={formData.priority === priority.value ? 1 : 0.5}
                        w="8px" 
                        h="8px" 
                        borderRadius="full" 
                        p={0}
                      />
                      <Text fontSize="sm">{priority.label}</Text>
                    </HStack>
                  </Box>
                ))}
              </HStack>
            </FormControl>

            {/* Screenshot Upload */}
            <FormControl>
              <FormLabel>Attach Screenshot (optional)</FormLabel>
              <Box
                as="label"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="1px dashed"
                borderColor="whiteAlpha.400"
                borderRadius="md"
                py={4}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ bg: "whiteAlpha.100" }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <Flex direction="column" align="center">
                  <Upload size={24} />
                  <Text mt={2} fontSize="sm">
                    {formData.screenshot ? formData.screenshot.name : "Click to upload (max 5MB)"}
                  </Text>
                </Flex>
              </Box>
            </FormControl>

            {/* Action Buttons */}
            <Flex width="full" gap={4} mt={4}>
              <Button
                flex={1}
                variant="ghost"
                onClick={onClose}
                isDisabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                flex={1}
                bg="transparent"
                color="white"
                borderWidth={1}
                borderColor="rgba(0, 198, 224, 1)"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                loadingText="Submitting..."
                _hover={{
                  bg: 'whiteAlpha.100'
                }}
              >
                Submit Ticket
              </Button>
            </Flex>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SupportModal;