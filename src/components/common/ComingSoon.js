import React from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Button, 
  Icon, 
  Flex, 
  Heading,
  Badge,
  HStack
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Wand2, 
  TrendingUp,
  Zap,
  Calendar,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const ComingSoon = ({ 
  title = "Strategy Builder", 
  subtitle = "Advanced Trading Strategy Creation",
  description = "Build sophisticated trading strategies with our intuitive drag-and-drop interface. Define entry and exit conditions, risk management rules, and automated execution parameters.",
  estimatedLaunch = "Q2 2025"
}) => {
  const navigate = useNavigate();

  // Decorative elements for the visual design
  const DecorativeIcons = () => (
    <MotionFlex
      justify="center"
      align="center"
      position="relative"
      w="100%"
      h="150px"
      mb={6}
    >
      {/* Central wand icon */}
      <MotionBox
        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        position="relative"
        zIndex={2}
      >
        <Icon 
          as={Wand2} 
          boxSize={20} 
          color="#00C6E0" 
          opacity={0.9}
        />
      </MotionBox>
      
      {/* Decorative icons around the central icon */}
      {[TrendingUp, Zap, Clock].map((IconComponent, index) => {
        const positions = [
          { x: -60, y: -30 },
          { x: 60, y: -30 },
          { x: 0, y: 50 }
        ];
        
        return (
          <MotionBox
            key={index}
            initial={{ 
              opacity: 0, 
              x: 0, 
              y: 0,
              scale: 0.5
            }}
            animate={{ 
              opacity: 0.4, 
              x: positions[index].x, 
              y: positions[index].y,
              scale: 1
            }}
            transition={{ 
              delay: 0.4 + (index * 0.1), 
              duration: 0.5,
              type: "spring",
              stiffness: 100
            }}
            position="absolute"
          >
            <Icon 
              as={IconComponent} 
              boxSize={8} 
              color="whiteAlpha.600" 
            />
          </MotionBox>
        );
      })}
      
      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <MotionBox
          key={`particle-${i}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.6, 0], 
            scale: [0, 1, 0],
            y: [-20, -40, -60]
          }}
          transition={{ 
            delay: 1 + (i * 0.2), 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
          position="absolute"
          left={`${20 + (i * 10)}%`}
          top="20%"
        >
          <Box
            w="4px"
            h="4px"
            bg="#00C6E0"
            borderRadius="full"
            opacity={0.6}
          />
        </MotionBox>
      ))}
    </MotionFlex>
  );

  return (
    <Box
      minH="100vh"
      bg="linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
      py={8}
    >
      <MotionBox
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        maxW="700px"
        w="100%"
        textAlign="center"
        p={8}
        bg="rgba(0, 0, 0, 0.4)"
        borderRadius="2xl"
        backdropFilter="blur(10px)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        boxShadow="0 25px 50px rgba(0, 0, 0, 0.5)"
      >
        <VStack spacing={6}>
          <DecorativeIcons />
          
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Badge
              bg="rgba(0, 198, 224, 0.15)"
              color="#00C6E0"
              px={4}
              py={2}
              borderRadius="full"
              fontSize="sm"
              fontWeight="medium"
              mb={4}
              border="1px solid rgba(0, 198, 224, 0.3)"
            >
              <HStack spacing={2}>
                <Icon as={Clock} boxSize={4} />
                <Text>Coming Soon</Text>
              </HStack>
            </Badge>
            
            <Heading size="2xl" color="white" mb={3} fontWeight="bold">
              {title}
            </Heading>
            
            <Text color="#00C6E0" fontSize="lg" fontWeight="medium" mb={4}>
              {subtitle}
            </Text>
            
            <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.6" maxW="500px" mx="auto">
              {description}
            </Text>
          </MotionBox>
          
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            mt={6}
          >
            <VStack spacing={4}>
              <HStack spacing={4} align="center" justify="center">
                <Icon as={Calendar} color="whiteAlpha.600" boxSize={5} />
                <Text color="whiteAlpha.700" fontSize="md">
                  Expected Launch: <Text as="span" color="#00C6E0" fontWeight="medium">{estimatedLaunch}</Text>
                </Text>
              </HStack>
              
              <HStack spacing={3} mt={6}>
                <Button
                  onClick={() => navigate('/dashboard')}
                  bg="rgba(0, 198, 224, 0.15)"
                  color="#00C6E0"
                  border="1px solid rgba(0, 198, 224, 0.3)"
                  _hover={{ 
                    bg: "rgba(0, 198, 224, 0.25)", 
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 25px rgba(0, 198, 224, 0.2)"
                  }}
                  _active={{ bg: "rgba(0, 198, 224, 0.2)" }}
                  size="lg"
                  borderRadius="xl"
                  transition="all 0.3s"
                >
                  Return to Dashboard
                </Button>
                
                <Button
                  onClick={() => navigate('/marketplace')}
                  bg="#00C6E0"
                  color="black"
                  _hover={{ 
                    bg: "#00D7F2", 
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 25px rgba(0, 198, 224, 0.4)"
                  }}
                  _active={{ bg: "#00B4CC" }}
                  size="lg"
                  borderRadius="xl"
                  boxShadow="0 4px 14px rgba(0, 198, 224, 0.3)"
                  transition="all 0.3s"
                  rightIcon={<Icon as={Bell} boxSize={4} />}
                >
                  Browse Strategies
                </Button>
              </HStack>
              
              <Text color="whiteAlpha.500" fontSize="sm" mt={4} fontStyle="italic">
                Get notified when this feature launches by following us on our social channels
              </Text>
            </VStack>
          </MotionBox>
        </VStack>
      </MotionBox>
    </Box>
  );
};

export default ComingSoon;