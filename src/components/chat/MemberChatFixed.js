import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  IconButton,
  Divider,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { X, Hash, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import ChannelList from './ChannelList';

const MotionBox = motion(Box);

const MemberChatFixed = ({ 
  isOpen, 
  onClose,
  channels = [],
  activeChannelId,
  onChannelSelect,
  messages = [],
  userRoles = {}, // Map of user_id -> roles array
  isLoading = false,
  error = null,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onAddReaction,
  onRemoveReaction,
  currentUser,
  chatSettings = {}
}) => {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showChannelList, setShowChannelList] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Better styling from debug version
  const bgColor = 'rgba(20, 20, 20, 0.95)'; // Dark background with transparency
  const borderColor = 'rgba(255, 255, 255, 0.2)'; // Light border
  const headerBg = 'rgba(30, 30, 30, 0.9)'; // Slightly lighter header

  // Find active channel
  useEffect(() => {
    if (activeChannelId && channels.length > 0) {
      const channel = channels.find(c => c.id === activeChannelId);
      setSelectedChannel(channel || channels[0]);
    } else if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0]);
    }
  }, [activeChannelId, channels]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleChannelSelect = (channelId) => {
    const channel = channels.find(c => c.id === channelId);
    setSelectedChannel(channel);
    onChannelSelect?.(channelId);
    setShowChannelList(false);
  };

  const handleSendMessage = (content, replyToId = null) => {
    if (selectedChannel && onSendMessage) {
      onSendMessage(selectedChannel.id, content, replyToId);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(0, 0, 0, 0.4)"
        zIndex={200}
        onClick={onClose}
      />
      
      {/* Chat panel sliding from right */}
      <MotionBox
        position="fixed"
        top={0}
        right={0}
        bottom={0}
        width={{ base: "100vw", md: "450px" }}
        maxWidth="90vw"
        bg={bgColor}
        backdropFilter="blur(20px)"
        border={`1px solid ${borderColor}`}
        borderRight="none"
        borderTopRightRadius="0"
        borderBottomRightRadius="0"
        borderTopLeftRadius={{ base: "0", md: "xl" }}
        borderBottomLeftRadius={{ base: "0", md: "xl" }}
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.3)"
        zIndex={201}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <HStack
          p={4}
          borderBottom={`1px solid ${borderColor}`}
          bg={headerBg}
          justify="space-between"
          align="center"
          minH="60px"
        >
          <HStack spacing={3} flex={1} minW={0}>
            <IconButton
              icon={<Hash size={18} />}
              variant="ghost"
              colorScheme="whiteAlpha"
              size="sm"
              onClick={() => setShowChannelList(!showChannelList)}
              aria-label="Channel list"
              _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
            />
            
            <VStack align="start" spacing={0} flex={1} minW={0}>
              <Text 
                fontSize="md" 
                fontWeight="semibold" 
                color="white"
                isTruncated
              >
                {selectedChannel ? `#${selectedChannel.name}` : 'Member Chat'}
              </Text>
              {selectedChannel?.description && (
                <Text 
                  fontSize="xs" 
                  color="gray.400"
                  isTruncated
                >
                  {selectedChannel.description}
                </Text>
              )}
            </VStack>
          </HStack>
          
          <HStack spacing={2}>
            <IconButton
              icon={<Settings size={18} />}
              variant="ghost"
              colorScheme="whiteAlpha"
              size="sm"
              aria-label="Chat settings"
              _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
              isDisabled
            />
            
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

        {/* Channel List Overlay */}
        {showChannelList && (
          <Box
            position="absolute"
            top="60px"
            left={0}
            right={0}
            bg={bgColor}
            borderBottom={`1px solid ${borderColor}`}
            zIndex={10}
          >
            <ChannelList
              channels={channels}
              activeChannelId={selectedChannel?.id}
              onChannelSelect={handleChannelSelect}
            />
          </Box>
        )}

        {/* Messages Area */}
        <VStack 
          flex={1} 
          overflowY="auto" 
          spacing={0}
          align="stretch"
          css={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '2px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'rgba(255, 255, 255, 0.5)',
            },
          }}
        >
          {error && (
            <Alert status="error" variant="subtle" bg="transparent" border="none">
              <AlertIcon />
              <Text color="white">{error}</Text>
            </Alert>
          )}

          {isLoading ? (
            <Flex justify="center" align="center" flex={1} p={8}>
              <VStack spacing={4}>
                <Spinner size="lg" color="blue.500" thickness="3px" />
                <Text color="gray.400">Loading messages...</Text>
              </VStack>
            </Flex>
          ) : (
            <VStack spacing={1} p={4} align="stretch">
              {messages.length === 0 ? (
                <Flex justify="center" align="center" flex={1} p={8}>
                  <VStack spacing={4}>
                    <Text color="gray.400" textAlign="center">
                      {selectedChannel 
                        ? `Welcome to #${selectedChannel.name}! Start the conversation.`
                        : 'Select a channel to start chatting.'
                      }
                    </Text>
                  </VStack>
                </Flex>
              ) : (
                messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    currentUser={currentUser}
                    userRoles={userRoles[message.user_id] || []}
                    showAvatar={chatSettings.show_profile_pictures !== false}
                    compactMode={chatSettings.compact_mode || false}
                    onEdit={onEditMessage}
                    onDelete={onDeleteMessage}
                    onAddReaction={onAddReaction}
                    onRemoveReaction={onRemoveReaction}
                    showTimestamp={
                      index === 0 || 
                      new Date(message.created_at).getTime() - 
                      new Date(messages[index - 1]?.created_at).getTime() > 300000 // 5 minutes
                    }
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </VStack>
          )}
        </VStack>

        {/* Message Input */}
        {selectedChannel && (
          <>
            <Divider borderColor={borderColor} />
            <Box p={4}>
              <MessageInput
                onSendMessage={handleSendMessage}
                placeholder={`Message #${selectedChannel.name}...`}
                disabled={isLoading}
              />
            </Box>
          </>
        )}
      </MotionBox>
    </>
  );
};

export default MemberChatFixed;