import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Button, 
  Flex, 
  Heading,
  HStack,
  Tag,
  Image,
  useToast
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle,
  TrendingUp, 
  ArrowRight,
  Zap,
  BookOpen,
  Webhook,
  LineChart,
  Activity,
  Target
} from 'lucide-react';

// Motion components
const MotionBox = motion(Box);
const MotionButton = motion(Button);

const EntryExperience = ({ onPathSelect, onOpenChat }) => {
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const toast = useToast();

  // The magic question that appears character by character - Atomik brand voice
  const magicQuestion = "What's your next precision trade?";

  // Type writer effect for the main question
  useEffect(() => {
    setIsTyping(true);
    let currentIndex = 0;
    const typeTimer = setInterval(() => {
      setCurrentQuestion(magicQuestion.slice(0, currentIndex + 1));
      currentIndex++;
      
      if (currentIndex >= magicQuestion.length) {
        clearInterval(typeTimer);
        setIsTyping(false);
        // Show paths after typing completes
        setTimeout(() => setShowPaths(true), 500);
      }
    }, 80);

    return () => clearInterval(typeTimer);
  }, []);

  const handlePathSelection = (path) => {
    setSelectedPath(path);
    
    // Add a brief delay for the selection animation
    setTimeout(() => {
      if (path.id === 'idea') {
        onOpenChat();
      } else {
        onPathSelect(path);
      }
    }, 200);
  };

  const paths = [
    {
      id: 'idea',
      title: 'I have a strategy',
      subtitle: 'Build it with precision',
      description: 'Describe your trading concept and our AI will architect it with enterprise-grade reliability',
      icon: Zap,
      color: '#00C6E0',
      gradient: 'linear(135deg, #00C6E0, rgba(0,198,224,0.6))',
      examples: ['Momentum breakout on TSLA', 'Mean reversion with RSI signals', 'Webhook-triggered SPY scalping']
    },
    {
      id: 'popular',
      title: 'Proven strategies',
      subtitle: 'Battle-tested precision',
      description: 'Explore professionally-engineered strategies with verified performance metrics',
      icon: LineChart,
      color: '#10B981',
      gradient: 'linear(135deg, #10B981, rgba(16,185,129,0.6))',
      stats: ['2,847 active traders', 'Enterprise-grade execution', 'Precision automation']
    },
    {
      id: 'learn',
      title: 'Master the craft',
      subtitle: 'Precision training',
      description: 'Learn systematic trading through our precision-engineered curriculum',
      icon: Target,
      color: '#00C6E0',
      gradient: 'linear(135deg, rgba(0,198,224,0.8), rgba(0,198,224,0.4))',
      features: ['Systematic approach', 'Enterprise methodologies', 'Precision mindset']
    }
  ];

  // Floating background elements - Atomik style
  const FloatingElements = () => (
    <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none">
      {/* Atomik's signature radial gradients */}
      <MotionBox
        position="absolute"
        top="20%"
        left="10%"
        width="25%"
        height="25%"
        bgGradient="radial(circle, rgba(0,198,224,0.15) 0%, rgba(0,0,0,0) 70%)"
        filter="blur(60px)"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <MotionBox
        position="absolute"
        bottom="15%"
        right="15%"
        width="30%"
        height="30%"
        bgGradient="radial(circle, rgba(0,198,224,0.08) 0%, rgba(0,0,0,0) 70%)"
        filter="blur(80px)"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.08, 0.15, 0.08]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4
        }}
      />

      {/* Floating precision-themed icons */}
      {[Webhook, Activity, LineChart, Target].map((Icon, index) => (
        <MotionBox
          key={index}
          position="absolute"
          initial={{ 
            opacity: 0,
            x: Math.random() * 800 - 400,
            y: Math.random() * 600 - 300,
            rotate: Math.random() * 360
          }}
          animate={{ 
            opacity: [0, 0.08, 0],
            y: [null, null, -200],
            rotate: [null, null, 360]
          }}
          transition={{ 
            duration: 10 + Math.random() * 4,
            repeat: Infinity,
            delay: index * 3
          }}
        >
          <Icon size={28} color="rgba(0, 198, 224, 0.2)" />
        </MotionBox>
      ))}
    </Box>
  );

  return (
    <Box position="relative" w="100%" h="100%" overflow="hidden">
      <FloatingElements />
      
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        h="100%" 
        maxW="900px" 
        mx="auto" 
        px={8}
        position="relative"
        zIndex={1}
      >
        {/* Atomik Brand Header */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          textAlign="center"
          mb={8}
        >
          <Image
            src="/logos/atomik-logo.svg"
            alt="AtomikTrading"
            height="32px"
            width="160px"
            mx="auto"
            mb={6}
            opacity={0.9}
            fallback={
              <Text fontSize="lg" fontWeight="bold" color="#00C6E0" mb={6}>
                AtomikTrading
              </Text>
            }
          />
        </MotionBox>

        {/* Magic Question */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          textAlign="center"
          mb={10}
        >
          <Heading 
            size="2xl" 
            color="white" 
            mb={4}
            fontWeight="300"
            letterSpacing="tight"
          >
            {currentQuestion}
            {isTyping && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ color: '#00C6E0' }}
              >
                |
              </motion.span>
            )}
          </Heading>
          
          <Text 
            color="whiteAlpha.700" 
            fontSize="lg"
            maxW="520px"
            mx="auto"
            lineHeight="tall"
          >
            Architect your strategy with enterprise-grade precision. Choose your approach.
          </Text>
        </MotionBox>

        {/* Path Selection */}
        <AnimatePresence>
          {showPaths && (
            <MotionBox
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, staggerChildren: 0.1 }}
              w="100%"
            >
              <VStack spacing={4} w="100%">
                {paths.map((path, index) => (
                  <MotionBox
                    key={path.id}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    w="100%"
                  >
                    <MotionButton
                      onClick={() => handlePathSelection(path)}
                      w="100%"
                      h="auto"
                      p={6}
                      bg="rgba(255, 255, 255, 0.05)"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      borderRadius="xl"
                      backdropFilter="blur(10px)"
                      _hover={{
                        bg: "rgba(255, 255, 255, 0.1)",
                        borderColor: path.color,
                        transform: "translateY(-2px)",
                        boxShadow: `0 8px 25px rgba(${path.color === '#00C6E0' ? '0, 198, 224' : 
                                    path.color === '#10B981' ? '16, 185, 129' : '139, 92, 246'}, 0.3)`
                      }}
                      _active={{
                        transform: "translateY(0px)"
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition="all 0.2s"
                      isLoading={selectedPath?.id === path.id}
                      loadingText=""
                    >
                      <HStack spacing={6} w="100%" align="flex-start">
                        {/* Icon */}
                        <Box
                          bg={`linear-gradient(135deg, ${path.color}, ${path.color}dd)`}
                          p={3}
                          borderRadius="lg"
                          flexShrink={0}
                        >
                          <path.icon size={24} color="white" />
                        </Box>
                        
                        {/* Content */}
                        <VStack align="flex-start" spacing={2} flex={1}>
                          <Text 
                            fontSize="lg" 
                            fontWeight="semibold" 
                            color="white"
                            textAlign="left"
                          >
                            {path.title}
                          </Text>
                          
                          <Text 
                            fontSize="sm" 
                            color="whiteAlpha.700"
                            textAlign="left"
                          >
                            {path.description}
                          </Text>
                          
                          {/* Examples or stats */}
                          <HStack spacing={2} flexWrap="wrap">
                            {path.examples?.map((example, i) => (
                              <Tag 
                                key={i}
                                size="sm" 
                                bg="whiteAlpha.100" 
                                color="whiteAlpha.800"
                                fontSize="xs"
                              >
                                {example}
                              </Tag>
                            )) || path.stats?.map((stat, i) => (
                              <Tag 
                                key={i}
                                size="sm" 
                                bg="whiteAlpha.100" 
                                color="whiteAlpha.800"
                                fontSize="xs"
                              >
                                {stat}
                              </Tag>
                            )) || path.features?.map((feature, i) => (
                              <Tag 
                                key={i}
                                size="sm" 
                                bg="whiteAlpha.100" 
                                color="whiteAlpha.800"
                                fontSize="xs"
                              >
                                {feature}
                              </Tag>
                            ))}
                          </HStack>
                        </VStack>
                        
                        {/* Arrow */}
                        <Box color={path.color} flexShrink={0}>
                          <ArrowRight size={20} />
                        </Box>
                      </HStack>
                    </MotionButton>
                  </MotionBox>
                ))}
              </VStack>
            </MotionBox>
          )}
        </AnimatePresence>

        {/* Atomik brand footer */}
        <AnimatePresence>
          {showPaths && (
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              mt={8}
            >
              <Text 
                color="whiteAlpha.500" 
                fontSize="xs" 
                textAlign="center"
                fontStyle="italic"
              >
                Precision engineering. Enterprise reliability. Atomik results.
              </Text>
            </MotionBox>
          )}
        </AnimatePresence>
      </Flex>
    </Box>
  );
};

export default EntryExperience;