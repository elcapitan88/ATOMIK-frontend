import React, { useState, useEffect, useRef } from 'react';
import { Box, Flex, Input, Button, VStack, Text } from '@chakra-ui/react';
import { Send } from 'lucide-react';
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

const Chatbox = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

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
    <Flex flexDirection="column" h="full" bg="whiteAlpha.50" backdropFilter="blur(4px)">
      <VStack flex={1} overflowY="auto" p={4} spacing={4} alignItems="stretch">
        {messages.map((message, index) => (
          <Flex key={index} justifyContent={message.sender === 'user' ? 'flex-end' : 'flex-start'} w="full">
            <Box
              maxW="70%"
              p={3}
              borderRadius="lg"
              bg={message.sender === 'user' ? 'blue.500' : 'whiteAlpha.200'}
              color="white"
            >
              {renderMessage(message)}
            </Box>
          </Flex>
        ))}
        {isTyping && (
          <Flex justifyContent="flex-start" w="full">
            <Box maxW="70%" p={3} borderRadius="lg" bg="whiteAlpha.200" color="white">
              <Text>Claude is typing...</Text>
            </Box>
          </Flex>
        )}
        <div ref={messagesEndRef} />
      </VStack>
      <Box p={4} borderTop="1px" borderColor="whiteAlpha.100">
        <Flex bg="whiteAlpha.100" borderRadius="lg">
          <Input
            flex={1}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            bg="transparent"
            border="none"
            color="white"
            _placeholder={{ color: 'gray.400' }}
            _focus={{ outline: 'none' }}
          />
          <Button 
            onClick={handleSendMessage} 
            bg="transparent" 
            _hover={{ bg: 'whiteAlpha.200' }} 
            color="blue.300"
            isDisabled={isTyping}
          >
            <Send size={20} />
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};

export default Chatbox;