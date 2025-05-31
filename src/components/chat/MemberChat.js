import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  IconButton,
  Divider,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  useDisclosure
} from '@chakra-ui/react';
import { X, Hash, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import ChannelList from './ChannelList';
// import ChatSettings from './ChatSettings';

const MotionBox = motion(Box);

// Updated MemberChat component with enhanced features

const MemberChat = ({ 
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
  chatSettings = {},
  onUpdateChatSettings
}) => {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showChannelList, setShowChannelList] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { isOpen: isSettingsOpen, onOpen: openSettings, onClose: closeSettings } = useDisclosure();
  
  // Create a map for quick message lookups
  const messageMap = React.useMemo(() => {
    const map = new Map();
    messages.forEach(msg => map.set(msg.id, msg));
    return map;
  }, [messages]);
  
  // Theme colors - Fixed to work properly with dark mode
  const bgColor = 'rgba(16, 16, 16, 0.95)'; // Dark background
  const borderColor = 'rgba(255, 255, 255, 0.1)'; // Light border
  const headerBg = 'rgba(24, 24, 24, 0.9)'; // Slightly lighter header

  // Find active channel
  useEffect(() => {
    if (activeChannelId && channels.length > 0) {
      const channel = channels.find(c => c.id === activeChannelId);
      setSelectedChannel(channel || channels[0]);
    } else if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0]);
    }
  }, [activeChannelId, channels]); // Removed selectedChannel to prevent infinite loops

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
    onChannelSelect(channelId);
    setShowChannelList(false);
  };

  const handleSendMessage = (content, replyToId = null) => {
    if (selectedChannel && onSendMessage) {
      onSendMessage(selectedChannel.id, content, replyToId || replyToMessage?.id);
      setReplyToMessage(null); // Clear reply after sending
    }
  };
  
  const handleReply = (message) => {
    setReplyToMessage(message);
  };
  
  const handleCancelReply = () => {
    setReplyToMessage(null);
  };
  
  const handleJumpToMessage = (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement && messagesContainerRef.current) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Highlight the message briefly
      messageElement.style.backgroundColor = 'rgba(0, 198, 224, 0.2)';
      messageElement.style.transition = 'background-color 0.3s ease';
      
      setTimeout(() => {
        messageElement.style.backgroundColor = 'transparent';
      }, 1500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
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
                      color="whiteAlpha.700"
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
                  onClick={openSettings}
                  aria-label="Chat settings"
                  _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
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
            <AnimatePresence>
              {showChannelList && (
                <MotionBox
                  position="absolute"
                  top="60px"
                  left={0}
                  right={0}
                  bg={bgColor}
                  borderBottom={`1px solid ${borderColor}`}
                  zIndex={10}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChannelList
                    channels={channels}
                    activeChannelId={selectedChannel?.id}
                    onChannelSelect={handleChannelSelect}
                  />
                </MotionBox>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <VStack 
              ref={messagesContainerRef}
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
                    <Text color="whiteAlpha.700">Loading messages...</Text>
                  </VStack>
                </Flex>
              ) : (
                <VStack spacing={1} p={4} align="stretch">
                  {messages.length === 0 ? (
                    <Flex justify="center" align="center" flex={1} p={8}>
                      <VStack spacing={4}>
                        <Text color="whiteAlpha.700" textAlign="center">
                          {selectedChannel 
                            ? `Welcome to #${selectedChannel.name}! Start the conversation.`
                            : 'Select a channel to start chatting.'
                          }
                        </Text>
                      </VStack>
                    </Flex>
                  ) : (
                    messages.map((message, index) => (
                      <Box key={message.id} id={`message-${message.id}`}>
                        <ChatMessage
                          message={message}
                          currentUser={currentUser}
                          userRoles={userRoles[message.user_id] || []}
                          showAvatar={chatSettings.show_profile_pictures !== false}
                          compactMode={chatSettings.compact_mode || false}
                          onEdit={onEditMessage}
                          onDelete={onDeleteMessage}
                          onAddReaction={onAddReaction}
                          onRemoveReaction={onRemoveReaction}
                          onReply={handleReply}
                          replyToMessage={message.reply_to_id ? messageMap.get(message.reply_to_id) : null}
                          onJumpToMessage={handleJumpToMessage}
                          showTimestamp={
                            index === 0 || 
                            new Date(message.created_at).getTime() - 
                            new Date(messages[index - 1]?.created_at).getTime() > 300000 // 5 minutes
                          }
                        />
                      </Box>
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
                    replyTo={replyToMessage}
                    onCancelReply={handleCancelReply}
                  />
                </Box>
              </>
            )}
          </MotionBox>
        </>
      )}
      
      {/* Chat Settings Modal - Temporarily disabled to fix webpack error */}
      {/* <ChatSettings
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        currentSettings={chatSettings}
        onSaveSettings={onUpdateChatSettings}
      /> */}
    </AnimatePresence>
  );
};

export default MemberChat;