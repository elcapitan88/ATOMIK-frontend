import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Flex, Input, Button, VStack, Text, IconButton, HStack, Badge, Tooltip } from '@chakra-ui/react';
import { Send, X, MessageCircle, Mic, Check, XCircle, Sparkles, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ariaApi, ariaHelpers } from '../services/api/ariaApi';

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
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [showExamples, setShowExamples] = useState(false);
  const messagesEndRef = useRef(null);

  // Example commands for users
  const exampleCommands = [
    "What are my positions?",
    "Show my active strategies",
    "How did I do today?",
    "Turn on Purple Reign strategy",
    "What's my AAPL position?"
  ];

  // Initialize with welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        text: "Hello! I'm ARIA, your Atomik trading assistant. I can help you manage strategies, check positions, and answer questions about your trading. Try asking me something!",
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

  const handleSendMessage = async (messageOverride = null) => {
    const messageToSend = messageOverride || inputMessage;

    if (messageToSend.trim() !== '') {
      setMessages(prev => [...prev, { text: messageToSend, sender: 'user' }]);
      if (!messageOverride) setInputMessage('');
      setIsTyping(true);
      setShowExamples(false);

      try {
        const response = await ariaApi.sendMessage(messageToSend, 'text');

        if (response.success) {
          const responseText = response.response?.text || response.response?.message || 'I processed your request.';

          // Check if confirmation is required
          if (ariaHelpers.requiresConfirmation(response)) {
            setPendingConfirmation({
              interactionId: response.interaction_id,
              message: responseText
            });
            setMessages(prev => [...prev, {
              text: responseText,
              sender: 'ai',
              isNew: true,
              requiresConfirmation: true,
              interactionId: response.interaction_id
            }]);
          } else {
            setMessages(prev => [...prev, {
              text: responseText,
              sender: 'ai',
              isNew: true,
              actionResult: response.action_result
            }]);
          }
        } else {
          const errorMessage = response.error || "Sorry, I couldn't process your request.";
          setMessages(prev => [...prev, { text: errorMessage, sender: 'ai', isNew: true, isError: true }]);
        }
      } catch (error) {
        console.error('Error sending message to ARIA:', error);
        setMessages(prev => [...prev, {
          text: error.message || "Sorry, I couldn't connect to ARIA. Please try again.",
          sender: 'ai',
          isNew: true,
          isError: true
        }]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleConfirmation = async (confirmed) => {
    if (!pendingConfirmation) return;

    setIsTyping(true);

    try {
      const response = await ariaApi.sendConfirmation(pendingConfirmation.interactionId, confirmed);

      // Add user's confirmation to messages
      setMessages(prev => [...prev, {
        text: confirmed ? "Yes, proceed" : "No, cancel",
        sender: 'user'
      }]);

      if (response.success) {
        const responseText = response.response?.text || (confirmed ? 'Action completed.' : 'Action cancelled.');
        setMessages(prev => [...prev, {
          text: responseText,
          sender: 'ai',
          isNew: true,
          actionResult: response.action_result
        }]);
      } else {
        setMessages(prev => [...prev, {
          text: response.error || "There was an issue processing your confirmation.",
          sender: 'ai',
          isNew: true,
          isError: true
        }]);
      }
    } catch (error) {
      console.error('Error sending confirmation:', error);
      setMessages(prev => [...prev, {
        text: "Sorry, I couldn't process your confirmation. Please try again.",
        sender: 'ai',
        isNew: true,
        isError: true
      }]);
    } finally {
      setPendingConfirmation(null);
      setIsTyping(false);
    }
  };

  const handleExampleClick = (example) => {
    handleSendMessage(example);
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
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="linear-gradient(135deg, rgba(0, 198, 224, 0.2), rgba(0, 153, 184, 0.2))"
                >
                  <Sparkles size={20} color="#00C6E0" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight="semibold" color="white">
                    ARIA
                  </Text>
                  <Text fontSize="xs" color="whiteAlpha.600">
                    Atomik Trading Assistant
                  </Text>
                </VStack>
              </HStack>
              <HStack spacing={2}>
                <Tooltip label="Show examples" placement="bottom">
                  <IconButton
                    icon={<HelpCircle size={18} />}
                    variant="ghost"
                    colorScheme="whiteAlpha"
                    size="sm"
                    onClick={() => setShowExamples(!showExamples)}
                    aria-label="Show examples"
                    _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                  />
                </Tooltip>
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
            </HStack>

            {/* Example Commands Dropdown */}
            <AnimatePresence>
              {showExamples && (
                <MotionBox
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  overflow="hidden"
                  borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                >
                  <Box p={3} bg="rgba(0, 198, 224, 0.05)">
                    <Text fontSize="xs" color="whiteAlpha.700" mb={2}>Try these commands:</Text>
                    <Flex flexWrap="wrap" gap={2}>
                      {exampleCommands.map((cmd, idx) => (
                        <Button
                          key={idx}
                          size="xs"
                          variant="outline"
                          borderColor="rgba(0, 198, 224, 0.3)"
                          color="whiteAlpha.800"
                          _hover={{ bg: 'rgba(0, 198, 224, 0.1)', borderColor: '#00C6E0' }}
                          onClick={() => handleExampleClick(cmd)}
                        >
                          {cmd}
                        </Button>
                      ))}
                    </Flex>
                  </Box>
                </MotionBox>
              )}
            </AnimatePresence>

            {/* Messages */}
            <VStack
              flex={1}
              overflowY="auto"
              p={4}
              spacing={4}
              alignItems="stretch"
              h="calc(100vh - 180px)"
            >
              {messages.map((message, index) => (
                <Flex key={index} justifyContent={message.sender === 'user' ? 'flex-end' : 'flex-start'} w="full">
                  <Box maxW="85%">
                    <Box
                      p={3}
                      borderRadius="lg"
                      bg={message.sender === 'user'
                        ? 'linear-gradient(135deg, #00C6E0, #0099B8)'
                        : message.isError
                          ? 'rgba(255, 100, 100, 0.15)'
                          : 'rgba(255, 255, 255, 0.1)'
                      }
                      color="white"
                      boxShadow={message.sender === 'user'
                        ? '0 2px 10px rgba(0, 198, 224, 0.3)'
                        : '0 2px 10px rgba(0, 0, 0, 0.2)'
                      }
                      borderLeft={message.isError ? '3px solid #ff6464' : 'none'}
                    >
                      {renderMessage(message)}
                    </Box>

                    {/* Confirmation Buttons */}
                    {message.requiresConfirmation && pendingConfirmation?.interactionId === message.interactionId && (
                      <HStack mt={2} spacing={2}>
                        <Button
                          size="sm"
                          leftIcon={<Check size={14} />}
                          colorScheme="green"
                          variant="solid"
                          onClick={() => handleConfirmation(true)}
                          isDisabled={isTyping}
                        >
                          Yes, proceed
                        </Button>
                        <Button
                          size="sm"
                          leftIcon={<XCircle size={14} />}
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleConfirmation(false)}
                          isDisabled={isTyping}
                        >
                          Cancel
                        </Button>
                      </HStack>
                    )}

                    {/* Action Result Badge */}
                    {message.actionResult && message.actionResult.success && (
                      <Badge mt={2} colorScheme="green" variant="subtle">
                        Action completed
                      </Badge>
                    )}
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
                    <HStack spacing={2}>
                      <Box
                        as="span"
                        display="inline-block"
                        animation="pulse 1.5s ease-in-out infinite"
                      >
                        <Sparkles size={16} color="#00C6E0" />
                      </Box>
                      <Text color="whiteAlpha.800">ARIA is thinking...</Text>
                    </HStack>
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