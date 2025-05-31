import React, { useState } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Avatar,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Flex,
  useColorModeValue,
  useDisclosure,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  Spinner,
  useToast,
  Input,
  Textarea
} from '@chakra-ui/react';
import { 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Reply, 
  Smile,
  Copy,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import EmojiPicker from './EmojiPicker';
import UserRoleBadge from './UserRoleBadge';
import { getUserRoleColor } from '../../utils/roleColors';

const MotionBox = motion(Box);

const ChatMessage = ({
  message,
  currentUser,
  userRoles = [], // User roles for this message author
  showAvatar = true,
  compactMode = false,
  showTimestamp = true,
  onEdit,
  onDelete,
  onAddReaction,
  onRemoveReaction,
  onReply,
  replyToMessage = null, // The message this is replying to
  onJumpToMessage // Function to scroll to a message
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const { isOpen: isEmojiPickerOpen, onOpen: openEmojiPicker, onClose: closeEmojiPicker } = useDisclosure();
  const { isOpen: isDeleteDialogOpen, onOpen: openDeleteDialog, onClose: closeDeleteDialog } = useDisclosure();
  const cancelRef = React.useRef();
  const toast = useToast();
  
  const hoverBg = 'rgba(255, 255, 255, 0.05)'; // Light hover for dark mode
  const ownMessageBg = 'rgba(0, 198, 224, 0.1)'; // Consistent blue highlight
  
  const isOwnMessage = currentUser && message.user_id === currentUser.id;
  const canEdit = isOwnMessage && onEdit;
  const canDelete = isOwnMessage && onDelete;
  
  // Get role color - prefer userRoles prop, fallback to message data
  const roleColor = userRoles.length > 0 
    ? getUserRoleColor(userRoles) 
    : (message.user_role_color || '#FFFFFF');

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true // Use 12-hour format with AM/PM
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast({
        title: "Message cannot be empty",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (editContent.trim() === message.content) {
      setIsEditing(false);
      return;
    }
    
    setIsEditLoading(true);
    try {
      await onEdit?.(message.id, editContent.trim());
      setIsEditing(false);
      toast({
        title: "Message updated",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to update message",
        description: error.message || "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsEditLoading(false);
    }
  };
  
  const handleDelete = async () => {
    setIsDeleteLoading(true);
    try {
      await onDelete?.(message.id);
      closeDeleteDialog();
      toast({
        title: "Message deleted",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to delete message",
        description: error.message || "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleteLoading(false);
    }
  };
  
  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
    setIsEditLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  const copyMessageContent = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      bg="transparent" // No background
      borderRadius="md"
      p={compactMode ? 1 : 2}
      position="relative"
      _hover={{
        bg: "rgba(255, 255, 255, 0.02)" // Very subtle hover
      }}
      transition="background-color 0.2s"
    >
      {/* Removed timestamp divider */}

      <HStack align="start" spacing={2} position="relative">
        {/* Avatar */}
        {showAvatar && !compactMode ? (
          <Avatar
            size="sm"
            name={message.user_name}
            src={
              currentUser?.id === message.user_id 
                ? currentUser?.profile_picture 
                : message.user_profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.user_name)}&background=${roleColor.slice(1)}&color=fff&size=128`
            }
            bg={roleColor}
            color="white"
            fontSize="sm"
            flexShrink={0}
            border="1px solid"
            borderColor="whiteAlpha.200"
          />
        ) : compactMode ? (
          // Placeholder space for compact mode alignment
          <Box w="40px" flexShrink={0} />
        ) : null}

        {/* Message Content */}
        <VStack align="start" spacing={1} flex={1} minW={0}>
          {/* Username and Metadata - Single line */}
          {!compactMode && (
            <HStack spacing={2} wrap="wrap" align="baseline">
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color={roleColor}
                style={{ color: roleColor }}
              >
                {message.user_name}
              </Text>
              
              {/* Role Badges */}
              {userRoles.length > 0 && (
                <UserRoleBadge 
                  roles={userRoles} 
                  showAll={false} 
                  size="xs"
                />
              )}
              
              {/* Timestamp shown always now */}
              <Text fontSize="xs" color="whiteAlpha.500">
                {formatTime(message.created_at)}
              </Text>
              
              {message.is_edited && (
                <Badge size="xs" colorScheme="gray" variant="subtle">
                  edited
                </Badge>
              )}
            </HStack>
          )}

          {/* Reply Reference */}
          {message.reply_to_id && replyToMessage && (
            <Box
              mb={2}
              p={2}
              bg="rgba(255, 255, 255, 0.05)"
              borderLeft="3px solid"
              borderLeftColor="rgba(0, 198, 224, 0.6)"
              borderRadius="md"
              cursor="pointer"
              _hover={{
                bg: "rgba(255, 255, 255, 0.08)",
                borderLeftColor: "rgba(0, 198, 224, 0.8)"
              }}
              transition="all 0.2s"
              onClick={() => onJumpToMessage?.(message.reply_to_id)}
            >
              <HStack spacing={2} align="start">
                <Reply size={12} color="rgba(0, 198, 224, 0.8)" />
                <VStack align="start" spacing={0} flex={1} minW={0}>
                  <Text
                    fontSize="xs"
                    color="rgba(0, 198, 224, 0.8)"
                    fontWeight="semibold"
                  >
                    {replyToMessage.user_name}
                  </Text>
                  <Text
                    fontSize="xs"
                    color="whiteAlpha.700"
                    isTruncated
                    maxW="100%"
                  >
                    {replyToMessage.content}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          )}

          {/* Message Text - Starts right after username */}
          {isEditing ? (
            <Box w="full" position="relative">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                bg="rgba(255, 255, 255, 0.1)"
                border="2px solid"
                borderColor="rgba(0, 198, 224, 0.5)"
                borderRadius="md"
                color="white"
                fontSize="sm"
                resize="vertical"
                minH="60px"
                _focus={{
                  borderColor: "rgba(0, 198, 224, 0.8)",
                  boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.3)"
                }}
                _placeholder={{ color: "whiteAlpha.500" }}
                isDisabled={isEditLoading}
                autoFocus
              />
              
              {/* Edit Controls */}
              <HStack mt={2} spacing={2}>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={handleEdit}
                  isLoading={isEditLoading}
                  loadingText="Saving"
                  leftIcon={isEditLoading ? <Spinner size="xs" /> : undefined}
                  bg="rgba(0, 198, 224, 0.8)"
                  _hover={{ bg: "rgba(0, 198, 224, 1)" }}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelEdit}
                  isDisabled={isEditLoading}
                  _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                >
                  Cancel
                </Button>
              </HStack>
              
              <Text fontSize="xs" color="whiteAlpha.600" mt={1}>
                Press Enter to save • Escape to cancel
              </Text>
            </Box>
          ) : (
            <Text
              fontSize="sm"
              color="white"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              lineHeight="1.4"
            >
              {message.content}
            </Text>
          )}

          {/* Reactions - Only show existing reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <HStack spacing={1} mt={1} wrap="wrap">
              {message.reactions.map((reaction) => {
                const hasReacted = reaction.users?.includes(currentUser?.username);
                return (
                  <Tooltip
                    key={reaction.emoji}
                    label={reaction.users?.join(', ') || 'No reactions'}
                    placement="top"
                    hasArrow
                  >
                    <Badge
                      variant={hasReacted ? "solid" : "outline"}
                      colorScheme={hasReacted ? "blue" : "gray"}
                      cursor="pointer"
                      fontSize="xs"
                      borderRadius="full"
                      px={2}
                      py={1}
                      bg={hasReacted ? "rgba(0, 198, 224, 0.3)" : "rgba(255, 255, 255, 0.05)"}
                      borderColor={hasReacted ? "rgba(0, 198, 224, 0.5)" : "rgba(255, 255, 255, 0.2)"}
                      _hover={{
                        bg: hasReacted ? "rgba(0, 198, 224, 0.4)" : "rgba(255, 255, 255, 0.1)",
                        transform: "scale(1.05)"
                      }}
                      transition="all 0.2s"
                      onClick={() => {
                        if (hasReacted) {
                          onRemoveReaction?.(message.id, reaction.emoji);
                        } else {
                          onAddReaction?.(message.id, reaction.emoji);
                        }
                      }}
                    >
                      {reaction.emoji} {reaction.count}
                    </Badge>
                  </Tooltip>
                );
              })}
            </HStack>
          )}
        </VStack>

        {/* Message Actions - Fixed positioning to prevent layout shift */}
        <Box 
          position="absolute" 
          top="2px" 
          right="8px"
          opacity={isHovered && !isEditing ? 1 : 0}
          transition="opacity 0.2s"
          pointerEvents={isHovered && !isEditing ? "auto" : "none"}
          zIndex={10}
        >
          <HStack spacing={1} bg="rgba(20, 20, 20, 0.9)" borderRadius="md" p={1}>
            {/* Emoji Picker */}
            <EmojiPicker
              isOpen={isEmojiPickerOpen}
              onClose={closeEmojiPicker}
              onEmojiSelect={(emoji) => onAddReaction?.(message.id, emoji)}
            >
              <IconButton
                icon={<Smile size={16} />}
                variant="ghost"
                size="sm"
                colorScheme="whiteAlpha"
                onClick={openEmojiPicker}
                cursor="pointer"
                _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                aria-label="Add reaction"
              />
            </EmojiPicker>

            {/* More actions menu */}
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<MoreHorizontal size={16} />}
                variant="ghost"
                size="sm"
                colorScheme="whiteAlpha"
                _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                aria-label="Message options"
              />
              <MenuList bg="gray.800" borderColor="whiteAlpha.200">
                <MenuItem 
                  icon={<Copy size={16} />} 
                  onClick={copyMessageContent}
                  bg="transparent"
                  _hover={{ bg: "whiteAlpha.100" }}
                >
                  Copy Message
                </MenuItem>
                
                {onReply && (
                  <MenuItem 
                    icon={<Reply size={16} />} 
                    onClick={() => onReply(message)}
                    bg="transparent"
                    _hover={{ bg: "whiteAlpha.100" }}
                  >
                    Reply
                  </MenuItem>
                )}
                
                {canEdit && (
                  <MenuItem 
                    icon={<Edit3 size={16} />} 
                    onClick={() => setIsEditing(true)}
                    bg="transparent"
                    _hover={{ bg: "whiteAlpha.100" }}
                  >
                    Edit Message
                  </MenuItem>
                )}
                
                {canDelete && (
                  <MenuItem 
                    icon={<Trash2 size={16} />} 
                    onClick={openDeleteDialog}
                    color="red.400"
                    bg="transparent"
                    _hover={{ bg: "red.900" }}
                  >
                    Delete Message
                  </MenuItem>
                )}
              </MenuList>
            </Menu>
          </HStack>
        </Box>
      </HStack>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeDeleteDialog}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" borderColor="whiteAlpha.200">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Delete Message
            </AlertDialogHeader>

            <AlertDialogBody color="whiteAlpha.800">
              Are you sure you want to delete this message? This action cannot be undone.
              <Box 
                mt={3} 
                p={3} 
                bg="rgba(255, 255, 255, 0.05)" 
                borderRadius="md"
                borderLeft="3px solid"
                borderLeftColor="red.400"
              >
                <Text fontSize="sm" color="whiteAlpha.700" fontStyle="italic">
                  "{message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content}"
                </Text>
              </Box>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button 
                ref={cancelRef} 
                onClick={closeDeleteDialog}
                isDisabled={isDeleteLoading}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDelete}
                ml={3}
                isLoading={isDeleteLoading}
                loadingText="Deleting"
                bg="red.600"
                _hover={{ bg: "red.700" }}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </MotionBox>
  );
};

export default ChatMessage;