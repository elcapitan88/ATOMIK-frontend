import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  Textarea,
  IconButton,
  HStack,
  Text,
  useColorModeValue,
  VStack,
  Badge,
  Avatar,
  useDisclosure
} from '@chakra-ui/react';
import { Send, Smile, Plus, X, Reply } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

const MessageInput = ({ 
  onSendMessage, 
  placeholder = "Type a message...", 
  disabled = false,
  replyTo = null,
  onCancelReply = null 
}) => {
  const [message, setMessage] = useState('');
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const textareaRef = useRef(null);
  const { isOpen: isEmojiPickerOpen, onOpen: openEmojiPicker, onClose: closeEmojiPicker } = useDisclosure();
  
  const bgColor = useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)');
  const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)');
  const focusBorderColor = useColorModeValue('#00C6E0', '#00C6E0');

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && onSendMessage && !disabled) {
      onSendMessage(trimmedMessage, replyTo?.id);
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Clear reply after sending
      if (replyTo && onCancelReply) {
        onCancelReply();
      }
    }
  };
  
  // Focus textarea when replying
  useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyTo]);

  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      
      // Reset cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      // Fallback: append emoji to end
      setMessage(prev => prev + emoji);
    }
    closeEmojiPicker();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Shift') {
      setIsShiftPressed(true);
    }
    
    if (e.key === 'Enter' && !isShiftPressed && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === 'Shift') {
      setIsShiftPressed(false);
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <Box>
      {/* Enhanced Reply indicator */}
      {replyTo && (
        <Box
          bg="rgba(0, 198, 224, 0.08)"
          border="1px solid rgba(0, 198, 224, 0.3)"
          borderRadius="lg"
          p={3}
          mb={3}
          position="relative"
          backdropFilter="blur(10px)"
        >
          <VStack spacing={2} align="start">
            <HStack justify="space-between" w="full">
              <HStack spacing={2}>
                <Reply size={14} color="rgba(0, 198, 224, 0.8)" />
                <Text fontSize="xs" color="rgba(0, 198, 224, 0.9)" fontWeight="semibold">
                  Replying to {replyTo.user_name}
                </Text>
                <Badge 
                  size="sm" 
                  colorScheme="blue" 
                  variant="subtle"
                  bg="rgba(0, 198, 224, 0.2)"
                  color="rgba(0, 198, 224, 1)"
                >
                  Thread
                </Badge>
              </HStack>
              
              {onCancelReply && (
                <IconButton
                  icon={<X size={14} />}
                  variant="ghost"
                  size="xs"
                  colorScheme="whiteAlpha"
                  onClick={onCancelReply}
                  aria-label="Cancel reply"
                  _hover={{ 
                    bg: "rgba(255, 255, 255, 0.1)",
                    transform: "scale(1.1)"
                  }}
                  transition="all 0.2s"
                />
              )}
            </HStack>
            
            <HStack spacing={3} w="full">
              <Avatar
                size="xs"
                name={replyTo.user_name}
                bg={replyTo.user_role_color || "gray.500"}
                color="white"
              />
              <Box
                flex={1}
                bg="rgba(255, 255, 255, 0.05)"
                borderRadius="md"
                p={2}
                borderLeft="3px solid"
                borderLeftColor="rgba(0, 198, 224, 0.6)"
              >
                <Text
                  fontSize="sm"
                  color="whiteAlpha.800"
                  noOfLines={2}
                  lineHeight="1.3"
                >
                  {replyTo.content}
                </Text>
              </Box>
            </HStack>
          </VStack>
        </Box>
      )}

      {/* Message input */}
      <Flex
        bg={bgColor}
        border={`1px solid ${borderColor}`}
        borderRadius="lg"
        p={2}
        align="end"
        _focusWithin={{
          borderColor: focusBorderColor,
          boxShadow: `0 0 0 1px ${focusBorderColor}`
        }}
        transition="all 0.2s"
      >
        {/* Attachment button - Future feature */}
        <IconButton
          icon={<Plus size={18} />}
          variant="ghost"
          size="sm"
          colorScheme="whiteAlpha"
          isDisabled // TODO: Implement file uploads
          aria-label="Attach file"
          _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
          mr={2}
        />

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder={placeholder}
          resize="none"
          border="none"
          bg="transparent"
          color="white"
          fontSize="sm"
          lineHeight="1.4"
          minH="40px"
          maxH="120px"
          flex={1}
          _placeholder={{ color: 'whiteAlpha.600' }}
          _focus={{ 
            outline: 'none',
            boxShadow: 'none'
          }}
          disabled={disabled}
        />

        {/* Action buttons */}
        <HStack spacing={1} ml={2}>
          {/* Emoji picker */}
          <EmojiPicker
            isOpen={isEmojiPickerOpen}
            onClose={closeEmojiPicker}
            onEmojiSelect={handleEmojiSelect}
          >
            <IconButton
              icon={<Smile size={18} />}
              variant="ghost"
              size="sm"
              colorScheme="whiteAlpha"
              onClick={openEmojiPicker}
              cursor="pointer"
              aria-label="Add emoji"
              _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
            />
          </EmojiPicker>

          {/* Send button */}
          <IconButton
            icon={<Send size={18} />}
            variant="ghost"
            size="sm"
            colorScheme={canSend ? "blue" : "whiteAlpha"}
            onClick={handleSend}
            isDisabled={!canSend}
            aria-label="Send message"
            bg={canSend ? "rgba(0, 198, 224, 0.2)" : "transparent"}
            color={canSend ? "#00C6E0" : "whiteAlpha.600"}
            _hover={{
              bg: canSend ? "rgba(0, 198, 224, 0.3)" : "rgba(255, 255, 255, 0.1)"
            }}
            _active={{
              bg: canSend ? "rgba(0, 198, 224, 0.4)" : "rgba(255, 255, 255, 0.1)"
            }}
          />
        </HStack>
      </Flex>

      {/* Help text */}
      <Text fontSize="xs" color="whiteAlpha.500" mt={2}>
        Press Enter to send, Shift + Enter for new line
      </Text>
    </Box>
  );
};

export default MessageInput;