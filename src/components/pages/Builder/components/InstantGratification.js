import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  VStack, 
  HStack,
  Text, 
  Button,
  Flex, 
  Badge,
  Icon,
  Tooltip,
  SimpleGrid,
  Divider
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Download,
  Play,
  Share,
  Bookmark,
  Calendar,
  BarChart3,
  Zap,
  CheckCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

// Motion components
const MotionBox = motion(Box);
const MotionButton = motion(Button);

const InstantGratification = ({ 
  strategy, 
  isVisible = false, 
  onDownload = null,
  onShare = null,
  onSave = null,
  onContinueBuilding = null
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [celebrationPhase, setCelebrationPhase] = useState('analyzing');
  const [chartData, setChartData] = useState([]);
  const canvasRef = useRef(null);

  // Mock strategy results for the celebration
  const strategyResults = {
    name: strategy?.name || "Your Strategy",
    symbol: strategy?.symbol || "SPY",
    timeframe: strategy?.timeframe || "1 Hour",
    performance: {
      totalReturn: 156.7,
      annualReturn: 23.4,
      winRate: 67.3,
      maxDrawdown: -8.2,
      sharpeRatio: 1.84,
      totalTrades: 247,
      avgWin: 2.1,
      avgLoss: -1.2,
      profitFactor: 2.1
    },
    timeInMarket: "42%",
    bestMonth: "March 2023 (+11.2%)",
    worstMonth: "October 2022 (-4.1%)"
  };

  // Celebration steps
  const celebrationSteps = [
    {
      phase: 'analyzing',
      title: 'Analyzing Strategy',
      subtitle: 'Running comprehensive backtests...',
      duration: 2000
    },
    {
      phase: 'results',
      title: 'Results Ready!',
      subtitle: 'Your strategy looks promising',
      duration: 1500
    },
    {
      phase: 'celebration',
      title: '🎉 Strategy Created!',
      subtitle: 'Ready to take it to the next level?',
      duration: null
    }
  ];

  // Generate mock chart data for performance visualization
  useEffect(() => {
    const generateChartData = () => {
      const data = [];
      let currentValue = 10000; // Starting capital
      const volatility = 0.02;
      const drift = 0.001; // Daily drift
      
      for (let i = 0; i < 252; i++) { // 1 year of trading days
        const randomChange = (Math.random() - 0.5) * volatility + drift;
        currentValue *= (1 + randomChange);
        data.push({
          day: i,
          value: currentValue,
          return: ((currentValue - 10000) / 10000) * 100
        });
      }
      return data;
    };

    setChartData(generateChartData());
  }, []);

  // Draw performance chart on canvas
  useEffect(() => {
    if (!canvasRef.current || chartData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up chart parameters
    const padding = 20;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Find min/max values
    const values = chartData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw performance line
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.beginPath();

    chartData.forEach((point, index) => {
      const x = padding + (chartWidth / (chartData.length - 1)) * index;
      const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Add glow effect
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

  }, [chartData, celebrationPhase]);

  // Handle celebration sequence
  useEffect(() => {
    if (!isVisible) return;

    const runCelebrationSequence = async () => {
      for (let i = 0; i < celebrationSteps.length; i++) {
        setCurrentStep(i);
        setCelebrationPhase(celebrationSteps[i].phase);
        
        if (celebrationSteps[i].duration) {
          await new Promise(resolve => setTimeout(resolve, celebrationSteps[i].duration));
        } else {
          break; // Stop at the final step
        }
      }
    };

    runCelebrationSequence();
  }, [isVisible]);

  if (!isVisible) return null;

  const renderAnalyzing = () => (
    <MotionBox
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      textAlign="center"
      py={8}
    >
      <VStack spacing={6}>
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity }
          }}
        >
          <Icon as={Zap} boxSize={16} color="#00C6E0" />
        </motion.div>
        
        <VStack spacing={3}>
          <Text fontSize="2xl" fontWeight="bold" color="white">
            {celebrationSteps[currentStep]?.title}
          </Text>
          <Text fontSize="md" color="whiteAlpha.700">
            {celebrationSteps[currentStep]?.subtitle}
          </Text>
        </VStack>

        <VStack spacing={2} w="100%">
          <Text fontSize="sm" color="whiteAlpha.600">Processing...</Text>
          <Box w="200px" h="2px" bg="whiteAlpha.200" borderRadius="full" overflow="hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #00C6E0, #10B981)",
                borderRadius: "full"
              }}
            />
          </Box>
        </VStack>
      </VStack>
    </MotionBox>
  );

  const renderResults = () => (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      textAlign="center"
    >
      <VStack spacing={4}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
        >
          <Icon as={CheckCircle} boxSize={12} color="#10B981" />
        </motion.div>
        
        <VStack spacing={2}>
          <Text fontSize="2xl" fontWeight="bold" color="white">
            Analysis Complete!
          </Text>
          <Text fontSize="md" color="whiteAlpha.700">
            Your strategy shows strong potential
          </Text>
        </VStack>

        {/* Quick preview of key metrics */}
        <HStack spacing={6} mt={4}>
          <VStack>
            <Text fontSize="lg" fontWeight="bold" color="#10B981">
              +{strategyResults.performance.totalReturn}%
            </Text>
            <Text fontSize="xs" color="whiteAlpha.600">Total Return</Text>
          </VStack>
          <VStack>
            <Text fontSize="lg" fontWeight="bold" color="#00C6E0">
              {strategyResults.performance.winRate}%
            </Text>
            <Text fontSize="xs" color="whiteAlpha.600">Win Rate</Text>
          </VStack>
          <VStack>
            <Text fontSize="lg" fontWeight="bold" color="#8B5CF6">
              {strategyResults.performance.sharpeRatio}
            </Text>
            <Text fontSize="xs" color="whiteAlpha.600">Sharpe Ratio</Text>
          </VStack>
        </HStack>
      </VStack>
    </MotionBox>
  );

  const renderCelebration = () => (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      w="100%"
    >
      <VStack spacing={6}>
        {/* Celebration header */}
        <MotionBox
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          textAlign="center"
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 0.6,
              repeat: 2
            }}
          >
            <Text fontSize="3xl" fontWeight="bold" color="white" mb={2}>
              🎉 Strategy Created Successfully! 🎉
            </Text>
          </motion.div>
          
          <Badge 
            bg="linear-gradient(135deg, #10B981, #00C6E0)" 
            color="white" 
            px={4} 
            py={2} 
            borderRadius="full"
            fontSize="sm"
          >
            <HStack spacing={2}>
              <Icon as={Sparkles} boxSize={4} />
              <Text>{strategyResults.name}</Text>
            </HStack>
          </Badge>
        </MotionBox>

        {/* Performance chart */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          w="100%"
          bg="rgba(0, 0, 0, 0.3)"
          borderRadius="lg"
          p={4}
          border="1px solid rgba(255, 255, 255, 0.1)"
        >
          <VStack spacing={3}>
            <HStack justify="space-between" w="100%">
              <Text fontSize="sm" fontWeight="semibold" color="white">
                Backtest Performance
              </Text>
              <HStack spacing={2}>
                <Icon as={TrendingUp} boxSize={4} color="#10B981" />
                <Text fontSize="sm" color="#10B981" fontWeight="bold">
                  +{strategyResults.performance.totalReturn}%
                </Text>
              </HStack>
            </HStack>
            
            <Box w="100%" h="120px" position="relative">
              <canvas
                ref={canvasRef}
                width={300}
                height={120}
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
          </VStack>
        </MotionBox>

        {/* Key metrics grid */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          w="100%"
        >
          <SimpleGrid columns={2} spacing={3}>
            <Box 
              bg="rgba(16, 185, 129, 0.1)" 
              border="1px solid rgba(16, 185, 129, 0.3)"
              borderRadius="lg" 
              p={3}
              textAlign="center"
            >
              <Text fontSize="lg" fontWeight="bold" color="#10B981">
                {strategyResults.performance.annualReturn}%
              </Text>
              <Text fontSize="xs" color="whiteAlpha.700">Annual Return</Text>
            </Box>
            
            <Box 
              bg="rgba(0, 198, 224, 0.1)" 
              border="1px solid rgba(0, 198, 224, 0.3)"
              borderRadius="lg" 
              p={3}
              textAlign="center"
            >
              <Text fontSize="lg" fontWeight="bold" color="#00C6E0">
                {strategyResults.performance.totalTrades}
              </Text>
              <Text fontSize="xs" color="whiteAlpha.700">Total Trades</Text>
            </Box>
          </SimpleGrid>
        </MotionBox>

        <Divider borderColor="whiteAlpha.200" />

        {/* Action buttons */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          w="100%"
        >
          <VStack spacing={3}>
            <Text fontSize="sm" color="whiteAlpha.700" textAlign="center">
              What would you like to do next?
            </Text>
            
            <VStack spacing={3} w="100%">
              <MotionButton
                onClick={onDownload}
                w="100%"
                bg="#10B981"
                color="white"
                _hover={{ bg: "#059669", transform: "translateY(-1px)" }}
                _active={{ bg: "#047857" }}
                leftIcon={<Download size={16} />}
                rightIcon={<ArrowRight size={16} />}
                size="lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Download Strategy Code
              </MotionButton>
              
              <HStack spacing={3} w="100%">
                <Button
                  onClick={onSave}
                  flex={1}
                  variant="outline"
                  borderColor="whiteAlpha.300"
                  color="white"
                  _hover={{ borderColor: "#00C6E0", color: "#00C6E0" }}
                  leftIcon={<Bookmark size={16} />}
                  size="md"
                >
                  Save Strategy
                </Button>
                
                <Button
                  onClick={onShare}
                  flex={1}
                  variant="outline"
                  borderColor="whiteAlpha.300"
                  color="white"
                  _hover={{ borderColor: "#8B5CF6", color: "#8B5CF6" }}
                  leftIcon={<Share size={16} />}
                  size="md"
                >
                  Share
                </Button>
              </HStack>
              
              <Button
                onClick={onContinueBuilding}
                w="100%"
                variant="ghost"
                color="whiteAlpha.700"
                _hover={{ color: "white", bg: "whiteAlpha.100" }}
                size="sm"
              >
                Continue building strategy
              </Button>
            </VStack>
          </VStack>
        </MotionBox>
      </VStack>
    </MotionBox>
  );

  return (
    <Box
      position="fixed"
      inset={0}
      bg="rgba(0, 0, 0, 0.8)"
      backdropFilter="blur(10px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1000}
      p={4}
    >
      <MotionBox
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        bg="rgba(0, 0, 0, 0.9)"
        border="2px solid rgba(255, 255, 255, 0.1)"
        borderRadius="2xl"
        p={8}
        maxW="500px"
        w="100%"
        maxH="90vh"
        overflowY="auto"
      >
        <AnimatePresence mode="wait">
          {celebrationPhase === 'analyzing' && renderAnalyzing()}
          {celebrationPhase === 'results' && renderResults()}
          {celebrationPhase === 'celebration' && renderCelebration()}
        </AnimatePresence>
      </MotionBox>
    </Box>
  );
};

export default InstantGratification;