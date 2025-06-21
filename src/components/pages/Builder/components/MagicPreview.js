import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  HStack,
  Text, 
  Flex, 
  Badge,
  Icon,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  Shield,
  Calendar,
  BarChart3,
  Zap
} from 'lucide-react';

// Motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const MagicPreview = ({ 
  strategy, 
  isVisible = false, 
  onComplete = null,
  previewType = 'performance' // 'performance', 'logic', 'risk', 'backtest'
}) => {
  const [currentMetric, setCurrentMetric] = useState(0);
  const [animationPhase, setAnimationPhase] = useState('loading');
  const [displayedReturn, setDisplayedReturn] = useState(0);

  // Mock performance data - in real implementation, this would come from backtesting
  const mockPerformanceData = {
    annualReturn: 23.4,
    winRate: 67.3,
    maxDrawdown: -8.2,
    sharpeRatio: 1.84,
    totalTrades: 247,
    profitFactor: 2.1,
    avgTradeDuration: '2.3 days',
    bestTrade: 8.7,
    worstTrade: -3.1
  };

  const metrics = [
    {
      label: 'Annual Return',
      value: mockPerformanceData.annualReturn,
      format: 'percentage',
      icon: TrendingUp,
      color: '#10B981',
      description: 'Based on historical data analysis'
    },
    {
      label: 'Win Rate',
      value: mockPerformanceData.winRate,
      format: 'percentage',
      icon: Target,
      color: '#00C6E0',
      description: 'Successful trades vs total trades'
    },
    {
      label: 'Max Drawdown',
      value: Math.abs(mockPerformanceData.maxDrawdown),
      format: 'percentage',
      icon: Shield,
      color: '#F59E0B',
      description: 'Largest peak-to-trough decline',
      isNegative: true
    },
    {
      label: 'Sharpe Ratio',
      value: mockPerformanceData.sharpeRatio,
      format: 'decimal',
      icon: Activity,
      color: '#8B5CF6',
      description: 'Risk-adjusted returns'
    }
  ];

  // Animated counter effect
  useEffect(() => {
    if (!isVisible) return;

    const animateMetrics = async () => {
      setAnimationPhase('loading');
      
      // Simulate analysis time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAnimationPhase('revealing');
      
      // Animate through each metric
      for (let i = 0; i < metrics.length; i++) {
        setCurrentMetric(i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      setAnimationPhase('complete');
      
      // Trigger completion callback if provided
      if (onComplete) {
        setTimeout(() => onComplete(), 500);
      }
    };

    animateMetrics();
  }, [isVisible]);

  // Animate the main return percentage
  useEffect(() => {
    if (animationPhase === 'revealing' && currentMetric === 0) {
      let current = 0;
      const target = mockPerformanceData.annualReturn;
      const increment = target / 50; // 50 steps for smooth animation
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setDisplayedReturn(current);
      }, 20);

      return () => clearInterval(timer);
    }
  }, [animationPhase, currentMetric]);

  if (!isVisible) return null;

  const renderLoadingState = () => (
    <MotionBox
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      textAlign="center"
      py={8}
    >
      <VStack spacing={6}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Icon as={Zap} boxSize={12} color="#00C6E0" />
        </motion.div>
        
        <VStack spacing={2}>
          <Text fontSize="lg" fontWeight="semibold" color="white">
            Analyzing Strategy...
          </Text>
          <Text fontSize="sm" color="whiteAlpha.700">
            Running backtests and calculating performance metrics
          </Text>
        </VStack>

        <Progress 
          value={85} 
          size="sm" 
          colorScheme="cyan" 
          bg="whiteAlpha.200"
          borderRadius="full"
          w="200px"
        />
      </VStack>
    </MotionBox>
  );

  const renderMetricCard = (metric, index, isActive) => (
    <MotionBox
      key={metric.label}
      initial={{ opacity: 0, x: 50 }}
      animate={{ 
        opacity: isActive ? 1 : 0.4,
        x: 0,
        scale: isActive ? 1.05 : 1
      }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      bg={isActive ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.05)"}
      border={isActive ? `2px solid ${metric.color}` : "1px solid rgba(255, 255, 255, 0.1)"}
      borderRadius="lg"
      p={4}
      position="relative"
      overflow="hidden"
    >
      {/* Animated background glow for active metric */}
      <AnimatePresence>
        {isActive && (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            position="absolute"
            inset={0}
            bg={metric.color}
            borderRadius="lg"
          />
        )}
      </AnimatePresence>

      <HStack spacing={3} position="relative" zIndex={1}>
        <Box
          bg={metric.color}
          p={2}
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={metric.icon} boxSize={5} color="white" />
        </Box>
        
        <VStack align="flex-start" spacing={1} flex={1}>
          <Text fontSize="sm" color="whiteAlpha.700" fontWeight="medium">
            {metric.label}
          </Text>
          
          <HStack>
            <Text 
              fontSize="xl" 
              fontWeight="bold" 
              color="white"
            >
              {metric.isNegative ? '-' : ''}
              {index === 0 && isActive 
                ? displayedReturn.toFixed(1)
                : metric.value
              }
              {metric.format === 'percentage' ? '%' : ''}
            </Text>
            
            {metric.isNegative ? (
              <StatArrow type="decrease" />
            ) : (
              <StatArrow type="increase" />
            )}
          </HStack>
          
          <Text fontSize="xs" color="whiteAlpha.600">
            {metric.description}
          </Text>
        </VStack>
      </HStack>
    </MotionBox>
  );

  const renderCompleteState = () => (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <VStack spacing={6}>
        {/* Hero metric */}
        <MotionBox
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          textAlign="center"
          bg="rgba(16, 185, 129, 0.1)"
          border="2px solid #10B981"
          borderRadius="xl"
          p={6}
          w="100%"
        >
          <HStack justify="center" spacing={2} mb={2}>
            <Icon as={DollarSign} boxSize={6} color="#10B981" />
            <Text fontSize="sm" color="whiteAlpha.700" fontWeight="semibold">
              PROJECTED ANNUAL RETURN
            </Text>
          </HStack>
          
          <Text fontSize="4xl" fontWeight="bold" color="#10B981">
            +{mockPerformanceData.annualReturn}%
          </Text>
          
          <Text fontSize="sm" color="whiteAlpha.600" mt={2}>
            Based on 3 years of historical backtesting
          </Text>
        </MotionBox>

        {/* Additional insights */}
        <HStack spacing={4} w="100%">
          <VStack 
            flex={1} 
            bg="rgba(0, 198, 224, 0.1)" 
            border="1px solid rgba(0, 198, 224, 0.3)"
            borderRadius="lg" 
            p={4}
            spacing={1}
          >
            <Icon as={Target} boxSize={5} color="#00C6E0" />
            <Text fontSize="lg" fontWeight="bold" color="white">
              {mockPerformanceData.totalTrades}
            </Text>
            <Text fontSize="xs" color="whiteAlpha.700" textAlign="center">
              Total Trades
            </Text>
          </VStack>
          
          <VStack 
            flex={1} 
            bg="rgba(139, 92, 246, 0.1)" 
            border="1px solid rgba(139, 92, 246, 0.3)"
            borderRadius="lg" 
            p={4}
            spacing={1}
          >
            <Icon as={Activity} boxSize={5} color="#8B5CF6" />
            <Text fontSize="lg" fontWeight="bold" color="white">
              {mockPerformanceData.avgTradeDuration}
            </Text>
            <Text fontSize="xs" color="whiteAlpha.700" textAlign="center">
              Avg Duration
            </Text>
          </VStack>
          
          <VStack 
            flex={1} 
            bg="rgba(245, 158, 11, 0.1)" 
            border="1px solid rgba(245, 158, 11, 0.3)"
            borderRadius="lg" 
            p={4}
            spacing={1}
          >
            <Icon as={Shield} boxSize={5} color="#F59E0B" />
            <Text fontSize="lg" fontWeight="bold" color="white">
              {mockPerformanceData.profitFactor}x
            </Text>
            <Text fontSize="xs" color="whiteAlpha.700" textAlign="center">
              Profit Factor
            </Text>
          </VStack>
        </HStack>

        {/* Call to action hint */}
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          textAlign="center"
          mt={4}
        >
          <Badge 
            bg="rgba(16, 185, 129, 0.2)" 
            color="#10B981" 
            px={3} 
            py={1} 
            borderRadius="full"
            fontSize="xs"
          >
            ✨ Ready to build this strategy?
          </Badge>
        </MotionBox>
      </VStack>
    </MotionBox>
  );

  return (
    <Box
      bg="rgba(0, 0, 0, 0.4)"
      backdropFilter="blur(10px)"
      border="1px solid rgba(255, 255, 255, 0.1)"
      borderRadius="xl"
      p={6}
      w="100%"
      maxW="400px"
    >
      {animationPhase === 'loading' && renderLoadingState()}
      
      {animationPhase === 'revealing' && (
        <VStack spacing={4}>
          <Text fontSize="lg" fontWeight="semibold" color="white" textAlign="center" mb={2}>
            Strategy Performance Preview
          </Text>
          
          {metrics.map((metric, index) => 
            renderMetricCard(metric, index, index <= currentMetric)
          )}
        </VStack>
      )}
      
      {animationPhase === 'complete' && renderCompleteState()}
    </Box>
  );
};

export default MagicPreview;