import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Button,
  VStack,
  Text,
  Flex,
  useDisclosure,
  Portal,
  Tooltip
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  TrendingUp,
  LogOut, 
  BellRing,
  ArrowDownCircle,
  GaugeCircle,
  Sliders,
  PanelRight
} from 'lucide-react';
import useStrategyBuilder from '@/hooks/useStrategyBuilder';

// Motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

// Component type definitions
const componentTypes = [
  {
    id: 'entry',
    name: 'Entry Condition',
    description: 'Define when to enter a trade',
    icon: TrendingUp,
    color: '#00C6E0' // Cyan - Primary Atomik color
  },
  {
    id: 'exit',
    name: 'Exit Condition',
    description: 'Define when to exit a trade',
    icon: LogOut,
    color: '#9932CC' // Purple
  },
  {
    id: 'stop_loss',
    name: 'Stop Loss',
    description: 'Define stop loss parameters',
    icon: ArrowDownCircle,
    color: '#F56565' // Red
  },
  {
    id: 'take_profit',
    name: 'Take Profit',
    description: 'Define take profit targets',
    icon: BellRing,
    color: '#48BB78' // Green
  },
  {
    id: 'risk_management',
    name: 'Risk Management',
    description: 'Define position sizing and risk rules',
    icon: GaugeCircle,
    color: '#ECC94B' // Yellow
  },
  {
    id: 'custom',
    name: 'Custom Rule',
    description: 'Create a custom strategy component',
    icon: Sliders,
    color: '#805AD5' // Purple
  }
];

const CreateStrategyButton = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { createComponentWithDefaultTitle, COMPONENT_TYPES } = useStrategyBuilder();
  const [isHovered, setIsHovered] = useState(false);

  // Handle component type selection
  const handleCreateComponent = (typeId) => {
    createComponentWithDefaultTitle(typeId);
    onClose();
  };

  return (
    <Box position="fixed" bottom="32px" right="32px" zIndex={10}>
      <Popover
        isOpen={isOpen}
        onClose={onClose}
        placement="top-end"
        autoFocus={false}
        isLazy
      >
        <PopoverTrigger>
          <MotionBox
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 15 
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <IconButton
              icon={<Plus size={24} />}
              aria-label="Create new strategy component"
              onClick={isOpen ? onClose : onOpen}
              size="lg"
              isRound
              bg="#00C6E0"
              color="black"
              _hover={{ bg: "#00D7F2" }}
              boxShadow={isHovered ? "0 0 20px rgba(0, 198, 224, 0.5)" : "0 0 10px rgba(0, 198, 224, 0.3)"}
              h="60px"
              w="60px"
              transition="all 0.2s"
            />
          </MotionBox>
        </PopoverTrigger>
        
        <Portal>
          <PopoverContent
            bg="rgba(0, 0, 0, 0.9)"
            backdropFilter="blur(10px)"
            borderColor="rgba(255, 255, 255, 0.1)"
            borderRadius="xl"
            boxShadow="0 8px 32px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 198, 224, 0.2)"
            p={2}
            maxW="320px"
          >
            <PopoverBody>
              <Text 
                fontWeight="medium" 
                color="white" 
                mb={3} 
                textAlign="center"
              >
                Create Strategy Component
              </Text>
              
              <AnimatePresence>
                <VStack spacing={2} align="stretch">
                  {componentTypes.map((type, index) => (
                    <MotionFlex
                      key={type.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleCreateComponent(type.id)}
                      align="center"
                      p={3}
                      borderRadius="md"
                      cursor="pointer"
                      bg="transparent"
                      _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
                      role="group"
                    >
                      <Flex
                        justify="center"
                        align="center"
                        borderRadius="md"
                        bg={`${type.color}20`} // 12% opacity
                        color={type.color}
                        p={2}
                        mr={3}
                        transition="all 0.2s"
                        _groupHover={{ bg: `${type.color}40` }} // 25% opacity on hover
                      >
                        <type.icon size={18} />
                      </Flex>
                      
                      <Box flex="1">
                        <Text 
                          color="white" 
                          fontWeight="medium" 
                          fontSize="sm"
                        >
                          {type.name}
                        </Text>
                        <Text 
                          color="whiteAlpha.700" 
                          fontSize="xs"
                        >
                          {type.description}
                        </Text>
                      </Box>
                    </MotionFlex>
                  ))}
                </VStack>
              </AnimatePresence>
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>
      
      {/* Tooltip when button is hovered but popover is closed */}
      {isHovered && !isOpen && (
        <Box
          position="absolute"
          bottom="70px"
          right="0"
          bg="rgba(0, 0, 0, 0.8)"
          color="white"
          px={3}
          py={2}
          borderRadius="md"
          fontSize="sm"
          whiteSpace="nowrap"
          pointerEvents="none"
        >
          Create Strategy Component
        </Box>
      )}
    </Box>
  );
};

export default CreateStrategyButton;