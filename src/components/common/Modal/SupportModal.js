// src/components/common/Modal/SupportModal.js
import React, { useState, useRef } from 'react';
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
  Checkbox,
} from '@chakra-ui/react';
import { Link as LinkIcon, Video } from 'lucide-react';
import axiosInstance from '@/services/axiosConfig';
import logger from '@/utils/logger';

const ISSUE_TYPES = [
  { value: 'bug', label: 'Something isn\'t working correctly' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'question', label: 'Question' },
  { value: 'account', label: 'Account Issue' }
];

const SupportModal = ({ isOpen, onClose }) => {
  // State for form data, errors, and submission status
  const [formData, setFormData] = useState({
    issueType: 'question',
    subject: '',
    description: '',
    isCritical: false,
    screenRecordingUrl: '',
    pastedImage: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const textareaRef = useRef(null);

  // Determine priority based on issue type and critical flag
  const determinePriority = (issueType, isCritical) => {
    if (isCritical) return 'critical';
    
    switch (issueType) {
      case 'bug':
        return 'high';
      case 'account':
        return 'medium';
      case 'feature':
      case 'question':
      default:
        return 'low';
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    // Validate screen recording URL if provided
    if (formData.screenRecordingUrl && !isValidUrl(formData.screenRecordingUrl)) {
      newErrors.screenRecordingUrl = 'Please enter a valid URL';
    }
    
    return newErrors;
  };

  // Check if string is a valid URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle paste event in description textarea
  const handlePaste = (e) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // Check if there are any image items in the clipboard
    const items = clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        // Get the image from clipboard as a file
        const blob = items[i].getAsFile();
        
        // Check file size (limit to 5MB)
        if (blob.size > 5 * 1024 * 1024) {
          toast({
            title: "Image too large",
            description: "Maximum image size is 5MB",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }
        
        // Store the pasted image
        setFormData(prev => ({
          ...prev,
          pastedImage: blob
        }));
        
        // Show a success message
        toast({
          title: "Image pasted",
          description: "Image has been attached to your ticket",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        
        break;
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      issueType: 'question',
      subject: '',
      description: '',
      isCritical: false,
      screenRecordingUrl: '',
      pastedImage: null
    });
    setErrors({});
  };

  // Open Loom in a new window
  const openLoomRecorder = () => {
    window.open('https://www.loom.com/record', '_blank');
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
      // Determine priority based on issue type and critical flag
      const priority = determinePriority(formData.issueType, formData.isCritical);
      
      // Create FormData object for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('issue_type', formData.issueType);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('priority', priority);
      
      // Add screen recording URL to description if provided
      if (formData.screenRecordingUrl) {
        const enhancedDescription = `${formData.description}\n\nScreen Recording: ${formData.screenRecordingUrl}`;
        formDataToSend.set('description', enhancedDescription);
      }
      
      // Add pasted image if available
      if (formData.pastedImage) {
        formDataToSend.append('file', formData.pastedImage, 'pasted_image.png');
      }
      
      // In a real implementation, you'd send this to your API
      // For now, we'll simulate a successful API call
      // await axiosInstance.post('/api/v1/support/tickets', formDataToSend);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      logger.info('Support ticket submitted:', {
        issueType: formData.issueType,
        subject: formData.subject,
        priority: priority,
        isCritical: formData.isCritical,
        hasScreenRecording: !!formData.screenRecordingUrl,
        hasPastedImage: !!formData.pastedImage
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
              <FormLabel>What can we help you with?</FormLabel>
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
                ref={textareaRef}
                name="description"
                placeholder="Please provide details about your issue (you can paste screenshots directly here)"
                value={formData.description}
                onChange={handleChange}
                onPaste={handlePaste}
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
              {formData.pastedImage && (
                <Text fontSize="xs" color="green.300" mt={1}>
                  ✓ Screenshot attached ({Math.round(formData.pastedImage.size / 1024)} KB)
                </Text>
              )}
              <Text fontSize="xs" color="whiteAlpha.700" mt={1}>
                Tip: You can paste screenshots directly using Ctrl+V/Cmd+V
              </Text>
            </FormControl>

            {/* Screen Recording Link */}
            <FormControl isInvalid={!!errors.screenRecordingUrl}>
              <FormLabel>
                <Flex alignItems="center">
                  <Video size={16} style={{ marginRight: '8px' }} />
                  Screen Recording (highly recommended)
                </Flex>
              </FormLabel>
              <Input
                name="screenRecordingUrl"
                placeholder="Paste your Loom or Vimeo link here"
                value={formData.screenRecordingUrl}
                onChange={handleChange}
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.300"
                _hover={{ borderColor: "whiteAlpha.400" }}
                _focus={{ 
                  borderColor: "rgba(0, 198, 224, 0.6)",
                  boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
                }}
                mb={2}
              />
              <Flex justify="space-between" align="center">
                <Text fontSize="xs" color="whiteAlpha.700">
                  A short screen recording helps us understand your issue much faster
                </Text>
                <Button 
                  size="xs" 
                  leftIcon={<LinkIcon size={12} color="white" />} 
                  onClick={openLoomRecorder}
                  variant="outline"
                  color="white"
                  borderColor="whiteAlpha.400"
                  _hover={{ bg: "whiteAlpha.100" }}
                >
                  Create Loom
                </Button>
              </Flex>
              {errors.screenRecordingUrl && (
                <FormErrorMessage>{errors.screenRecordingUrl}</FormErrorMessage>
              )}
            </FormControl>

            {/* Critical Issue Checkbox */}
            <FormControl>
              <Flex 
                alignItems="center" 
                borderRadius="md"
                border="1px solid"
                borderColor="red.300"
                p={3}
                bg="rgba(255, 0, 0, 0.05)"
              >
                <Checkbox
                  name="isCritical"
                  isChecked={formData.isCritical}
                  onChange={handleChange}
                  mr={3}
                  colorScheme="red"
                />
                <Box>
                  <Text fontWeight="500">This issue is preventing me from using the service</Text>
                  <Text fontSize="xs" color="whiteAlpha.700">Check this only if the issue is blocking your workflow</Text>
                </Box>
              </Flex>
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