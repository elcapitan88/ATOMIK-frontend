import React, { useState, useEffect, useRef } from 'react';
import { Box, Flex, Input, Button, VStack, Text, IconButton, HStack } from '@chakra-ui/react';
import { Send, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const TypeWriter = ({ parts, speed = 30 }) => {
  const [displayedParts, setDisplayedParts] = useState([]);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  useEffect(() => {
    if (currentPartIndex < parts.length) {
      const currentPart = parts[currentPartIndex];
      if (currentCharIndex < currentPart.content.length) {
        const timer = setTimeout(() => {
          setDisplayedParts(prev => {
            const newParts = [...prev];
            if (!newParts[currentPartIndex]) {
              newParts[currentPartIndex] = { ...currentPart, content: '' };
            }
            newParts[currentPartIndex].content += currentPart.content[currentCharIndex];
            return newParts;
          });
          setCurrentCharIndex(prev => prev + 1);
        }, speed);
        return () => clearTimeout(timer);
      } else {
        setCurrentPartIndex(prev => prev + 1);
        setCurrentCharIndex(0);
      }
    }
  }, [parts, currentPartIndex, currentCharIndex, speed]);

  return (
    <>
      {displayedParts.map((part, index) => (
        <React.Fragment key={index}>
          {part.type === 'text' && <Text whiteSpace="pre-wrap" wordBreak="break-word">{part.content}</Text>}
          {part.type === 'code' && (
            <Box
              as="pre"
              fontFamily="monospace"
              bg="gray.800"
              color="gray.100"
              p={3}
              borderRadius="md"
              overflowX="auto"
              fontSize="0.9em"
              my={2}
            >
              {part.content}
            </Box>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

// Motion components
const MotionBox = motion(Box);

const Chatbox = ({ isOpen, onClose, strategyData }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize with welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        text: "Hello! I'm your AI strategy assistant. I can help you refine, optimize, or submit your trading strategy. What would you like to do?",
        sender: 'ai',
        isNew: true
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() !== '') {
      setMessages(prev => [...prev, { text: inputMessage, sender: 'user' }]);
      setInputMessage('');
      setIsTyping(true);
      
      try {
        const response = await axios.post('http://localhost:8000/api/chat/', { message: inputMessage });
        const cleanedResponse = response.data.response.replace(/(.)\1+/g, '$1');
        setMessages(prev => [...prev, { text: cleanedResponse, sender: 'ai', isNew: true }]);
      } catch (error) {
        console.error('Error sending message to Claude:', error);
        setMessages(prev => [...prev, { text: "Sorry, I couldn't process your request.", sender: 'ai', isNew: true }]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const parseMessage = (text) => {
    const parts = [];
    const codeBlockRegex = /```([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'code', content: match[1].trim() });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts;
  };

  const renderMessage = (message) => {
    const parts = parseMessage(message.text);
    return message.isNew ? (
      <TypeWriter parts={parts} />
    ) : (
      parts.map((part, index) => (
        <React.Fragment key={index}>
          {part.type === 'text' && <Text whiteSpace="pre-wrap" wordBreak="break-word">{part.content}</Text>}
          {part.type === 'code' && (
            <Box
              as="pre"
              fontFamily="monospace"
              bg="gray.800"
              color="gray.100"
              p={3}
              borderRadius="md"
              overflowX="auto"
              fontSize="0.9em"
              my={2}
            >
              {part.content}
            </Box>
          )}
        </React.Fragment>
      ))
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay - covers entire viewport */}
          <MotionBox
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0, 0, 0, 0.4)"
            backdropFilter="blur(4px)"
            zIndex={200}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          
          {/* Chat panel sliding from right - positioned at viewport level */}
          <MotionBox
            position="fixed"
            top={0}
            right={0}
            bottom={0}
            width="450px"
            maxWidth="40vw"
            bg="rgba(0, 0, 0, 0.95)"
            backdropFilter="blur(20px)"
            border="1px solid rgba(255, 255, 255, 0.1)"
            borderRight="none"
            borderTopRightRadius="0"
            borderBottomRightRadius="0"
            borderTopLeftRadius="xl"
            borderBottomLeftRadius="xl"
            zIndex={201}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <HStack
              p={4}
              borderBottom="1px solid rgba(255, 255, 255, 0.1)"
              justify="space-between"
              align="center"
            >
              <HStack spacing={3}>
                <MessageCircle size={20} color="#00C6E0" />
                <Text fontSize="lg" fontWeight="semibold" color="white">
                  AI Strategy Assistant
                </Text>
              </HStack>
              <IconButton
                icon={<X size={20} />}
                variant="ghost"
                colorScheme="whiteAlpha"
                size="sm"
                onClick={onClose}
                aria-label="Close chat"
                _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
              />
            </HStack>

            {/* Messages */}
            <VStack 
              flex={1} 
              overflowY="auto" 
              p={4} 
              spacing={4} 
              alignItems="stretch"
              h="calc(100vh - 140px)"
            >
              {messages.map((message, index) => (
                <Flex key={index} justifyContent={message.sender === 'user' ? 'flex-end' : 'flex-start'} w="full">
                  <Box
                    maxW="85%"
                    p={3}
                    borderRadius="lg"
                    bg={message.sender === 'user' 
                      ? 'linear-gradient(135deg, #00C6E0, #0099B8)' 
                      : 'rgba(255, 255, 255, 0.1)'
                    }
                    color="white"
                    boxShadow={message.sender === 'user' 
                      ? '0 2px 10px rgba(0, 198, 224, 0.3)' 
                      : '0 2px 10px rgba(0, 0, 0, 0.2)'
                    }
                  >
                    {renderMessage(message)}
                  </Box>
                </Flex>
              ))}
              {isTyping && (
                <Flex justifyContent="flex-start" w="full">
                  <Box 
                    maxW="85%" 
                    p={3} 
                    borderRadius="lg" 
                    bg="rgba(255, 255, 255, 0.1)" 
                    color="white"
                  >
                    <Text>AI is typing...</Text>
                  </Box>
                </Flex>
              )}
              <div ref={messagesEndRef} />
            </VStack>

            {/* Input */}
            <Box p={4} borderTop="1px solid rgba(255, 255, 255, 0.1)">
              <Flex 
                bg="rgba(255, 255, 255, 0.1)" 
                borderRadius="lg" 
                border="1px solid rgba(255, 255, 255, 0.2)"
              >
                <Input
                  flex={1}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about your strategy..."
                  bg="transparent"
                  border="none"
                  color="white"
                  _placeholder={{ color: 'whiteAlpha.600' }}
                  _focus={{ outline: 'none' }}
                />
                <Button 
                  onClick={handleSendMessage} 
                  bg="transparent" 
                  _hover={{ bg: 'rgba(0, 198, 224, 0.2)' }}
                  _active={{ bg: 'rgba(0, 198, 224, 0.3)' }}
                  color="#00C6E0"
                  isDisabled={isTyping || !inputMessage.trim()}
                  borderRadius="lg"
                >
                  <Send size={18} />
                </Button>
              </Flex>
            </Box>
          </MotionBox>
        </>
      )}
    </AnimatePresence>
  );
};

export default Chatbox;