// Temporary debug version of MemberChat to isolate issues
import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  IconButton
} from '@chakra-ui/react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

// Logging control - set to false to disable all chat logs
const ENABLE_CHAT_LOGS = false;

const DebugMemberChat = ({ isOpen, onClose }) => {
  if (ENABLE_CHAT_LOGS) {
    console.log('DebugMemberChat render:', { isOpen });
  }

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
            bg="rgba(0, 0, 0, 0.5)"
            zIndex={200}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          
          {/* Chat panel */}
          <MotionBox
            position="fixed"
            top={0}
            right={0}
            bottom={0}
            width={{ base: "100vw", md: "450px" }}
            maxWidth="90vw"
            bg="rgba(20, 20, 20, 0.95)"
            border="1px solid rgba(255, 255, 255, 0.2)"
            borderRight="none"
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
              borderBottom="1px solid rgba(255, 255, 255, 0.1)"
              bg="rgba(30, 30, 30, 0.9)"
              justify="space-between"
              align="center"
              minH="60px"
            >
              <Text 
                fontSize="md" 
                fontWeight="semibold" 
                color="white"
              >
                Debug Chat
              </Text>
              
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

            {/* Content */}
            <VStack 
              flex={1} 
              p={4}
              justify="center"
              align="center"
              spacing={4}
            >
              <Text color="white" fontSize="lg">
                🎉 Chat is working!
              </Text>
              <Text color="gray.400" textAlign="center">
                This is a debug version to test if the chat panel is visible and functioning.
                The white screen issue should be resolved now.
              </Text>
              <Box
                p={4}
                bg="rgba(0, 198, 224, 0.1)"
                borderRadius="md"
                border="1px solid rgba(0, 198, 224, 0.3)"
              >
                <Text color="#00C6E0" fontSize="sm">
                  ✓ Animation working<br/>
                  ✓ Styling working<br/>
                  ✓ Backdrop working<br/>
                  ✓ Close button working
                </Text>
              </Box>
            </VStack>
          </MotionBox>
        </>
      )}
    </AnimatePresence>
  );
};

export default DebugMemberChat;