import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Box, Flex, Text, Textarea, IconButton, HStack, Button,
  keyframes
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiSquare } from 'react-icons/fi';
import CodeArtifact from './CodeArtifact';

const MotionBox = motion(Box);

const pulseAnimation = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

const SuggestedPrompts = ({ onSelect }) => {
  const prompts = [
    'Momentum breakout strategy for ES',
    'RSI mean reversion for NQ',
    'Trend following with MACD on MNQ',
    'Convert my PineScript to Python',
  ];

  return (
    <Flex direction="column" align="center" justify="center" h="full" px={6}>
      <Text fontSize="2xl" fontWeight="bold" mb={2} textAlign="center">
        What strategy do you want to build?
      </Text>
      <Text fontSize="sm" color="whiteAlpha.600" mb={8} textAlign="center">
        Describe your trading strategy and I'll generate the code
      </Text>
      <HStack spacing={3} flexWrap="wrap" justify="center">
        {prompts.map((prompt, i) => (
          <Button
            key={i}
            size="sm"
            variant="outline"
            borderColor="whiteAlpha.300"
            color="whiteAlpha.800"
            borderRadius="full"
            px={4}
            mb={2}
            _hover={{ borderColor: '#00C6E0', color: '#00C6E0' }}
            onClick={() => onSelect(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </HStack>
      <Text fontSize="xs" color="whiteAlpha.400" mt={6}>
        or pull up strategy blocks below to define conditions visually
      </Text>
    </Flex>
  );
};

const TypingIndicator = () => (
  <HStack spacing={1} px={4} py={2}>
    {[0, 1, 2].map(i => (
      <Box
        key={i}
        w="6px"
        h="6px"
        borderRadius="full"
        bg="#00C6E0"
        animation={`${pulseAnimation} 1.4s ease-in-out ${i * 0.2}s infinite`}
      />
    ))}
  </HStack>
);

const ChatMessage = ({ message, onSaveCode, onEditCode }) => {
  const isUser = message.type === 'user';

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      px={4}
      py={2}
    >
      <Flex justify={isUser ? 'flex-end' : 'flex-start'}>
        <Box
          maxW={isUser ? '80%' : '95%'}
          bg={isUser ? 'rgba(0, 198, 224, 0.15)' : 'transparent'}
          borderRadius="lg"
          px={isUser ? 4 : 0}
          py={isUser ? 2 : 0}
        >
          {!isUser && (
            <Text fontSize="xs" color="#00C6E0" fontWeight="600" mb={1}>
              ARIA
            </Text>
          )}
          {message.text && (
            <Text fontSize="sm" color="whiteAlpha.900" whiteSpace="pre-wrap">
              {message.text}
            </Text>
          )}
          {message.code && (
            <CodeArtifact
              code={message.code}
              language={message.codeLanguage || 'python'}
              strategyName={message.strategyName || 'Generated Strategy'}
              onSave={onSaveCode}
              onEdit={onEditCode}
            />
          )}
        </Box>
      </Flex>
    </MotionBox>
  );
};

const BuilderChat = forwardRef(({
  onCodeGenerated,
  onSaveCode,
  provider = 'groq',
  model = null,
  outputLanguage = 'python',
}, ref) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState(outputLanguage);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Expose sendMessage to parent via ref
  useImperativeHandle(ref, () => ({
    sendMessage: (text) => sendMessage(text)
  }));

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.REACT_APP_API_URL || 'https://api.atomiktrading.io';

      // Get existing code from last AI message for iteration context
      const lastAiMsg = [...messages].reverse().find(m => m.type === 'aria' && m.code);
      const existingCode = lastAiMsg?.code || null;

      const response = await fetch(`${apiUrl}/api/v1/aria/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text.trim(),
          mode: 'strategy_builder',
          input_type: 'text',
          provider,
          model,
          existing_code: existingCode,
          output_language: language
        })
      });

      const data = await response.json();

      if (data.success && data.response) {
        const responseText = data.response.text || data.response;

        // Try to extract code block from response
        const codeMatch = responseText.match(/```(?:python|pinescript)\s*\n([\s\S]*?)```/);
        const code = codeMatch ? codeMatch[1].trim() : null;
        const explanation = codeMatch
          ? responseText.slice(responseText.indexOf('```', responseText.indexOf('```') + 3) + 3).trim()
          : responseText;

        const ariaMsg = {
          id: (Date.now() + 1).toString(),
          type: 'aria',
          text: explanation || (code ? 'Here\'s your generated strategy:' : responseText),
          code,
          codeLanguage: language,
          strategyName: 'Generated Strategy',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, ariaMsg]);

        if (code) {
          onCodeGenerated?.(code, language);
        }
      } else {
        const errorMsg = {
          id: (Date.now() + 1).toString(),
          type: 'aria',
          text: data.error || 'Sorry, I encountered an error generating your strategy. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        type: 'aria',
        text: `Connection error: ${err.message}. Please check your connection and try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, provider, model, language, onCodeGenerated]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }, [input, sendMessage]);

  const handlePromptSelect = useCallback((prompt) => {
    sendMessage(prompt);
  }, [sendMessage]);

  const isEmpty = messages.length === 0;

  return (
    <Flex direction="column" h="full" position="relative">
      {/* Messages Area */}
      <Box flex="1" overflowY="auto" pb="80px">
        {isEmpty ? (
          <SuggestedPrompts onSelect={handlePromptSelect} />
        ) : (
          <Box py={4}>
            <AnimatePresence>
              {messages.map(msg => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onSaveCode={onSaveCode}
                  onEditCode={(editedCode) => onCodeGenerated?.(editedCode, language)}
                />
              ))}
            </AnimatePresence>
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Input Bar */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        p={4}
        bg="linear-gradient(transparent, rgba(10,10,15,0.95) 30%)"
      >
        <Flex
          bg="rgba(255,255,255,0.05)"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="xl"
          p={2}
          align="flex-end"
          _focusWithin={{ borderColor: '#00C6E0' }}
        >
          {/* Language Toggle */}
          <HStack spacing={0} mr={2}>
            <Button
              size="xs"
              variant={language === 'python' ? 'solid' : 'ghost'}
              colorScheme={language === 'python' ? 'cyan' : 'gray'}
              borderRadius="md"
              onClick={() => setLanguage('python')}
              fontSize="10px"
            >
              PY
            </Button>
            <Button
              size="xs"
              variant={language === 'pinescript' ? 'solid' : 'ghost'}
              colorScheme={language === 'pinescript' ? 'orange' : 'gray'}
              borderRadius="md"
              onClick={() => setLanguage('pinescript')}
              fontSize="10px"
            >
              PINE
            </Button>
          </HStack>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your strategy..."
            variant="unstyled"
            fontSize="sm"
            resize="none"
            minH="36px"
            maxH="120px"
            rows={1}
            flex="1"
            px={2}
            overflow="auto"
          />

          <IconButton
            icon={isLoading ? <FiSquare /> : <FiSend />}
            size="sm"
            colorScheme="cyan"
            variant={input.trim() || isLoading ? 'solid' : 'ghost'}
            borderRadius="lg"
            onClick={() => isLoading ? null : sendMessage(input)}
            isDisabled={!input.trim() && !isLoading}
            aria-label={isLoading ? 'Stop' : 'Send'}
          />
        </Flex>
      </Box>
    </Flex>
  );
});

BuilderChat.displayName = 'BuilderChat';

export default BuilderChat;
