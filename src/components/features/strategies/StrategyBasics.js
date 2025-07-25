// frontend/src/components/features/strategies/StrategyBasics.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  Select,
  Button,
  Alert,
  AlertIcon,
  Flex,
  Badge,
  Icon,
  Tooltip,
  IconButton,
  Divider,
  Code,
  useClipboard
} from '@chakra-ui/react';
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Target,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
  Activity
} from 'lucide-react';

const STRATEGY_TYPES = [
  { 
    value: 'momentum', 
    label: 'Momentum Trading', 
    icon: TrendingUp,
    description: 'Follows price trends and market momentum',
    color: 'green'
  },
  { 
    value: 'mean_reversion', 
    label: 'Mean Reversion', 
    icon: TrendingDown,
    description: 'Trades against short-term price movements',
    color: 'blue'
  },
  { 
    value: 'breakout', 
    label: 'Breakout Strategy', 
    icon: BarChart3,
    description: 'Captures price movements beyond key levels',
    color: 'purple'
  },
  { 
    value: 'scalping', 
    label: 'Scalping', 
    icon: Zap,
    description: 'High-frequency short-term trades',
    color: 'yellow'
  },
  { 
    value: 'arbitrage', 
    label: 'Arbitrage', 
    icon: Target,
    description: 'Exploits price differences across markets',
    color: 'orange'
  }
];

const SOURCE_TYPES = [
  { 
    value: 'tradingview', 
    label: 'TradingView Pine Script',
    description: 'Automated signals from TradingView alerts',
    popular: true
  },
  { 
    value: 'custom', 
    label: 'Custom Implementation',
    description: 'Your own trading bot or signal service'
  }
];

const StrategyTypeCard = ({ type, isSelected, onClick }) => {
  const IconComponent = type.icon;
  
  return (
    <Box
      p={3}
      borderRadius="md"
      border="1px solid"
      borderColor={isSelected ? "#00C6E0" : "rgba(255, 255, 255, 0.15)"}
      bg={isSelected ? "rgba(0, 198, 224, 0.08)" : "rgba(255, 255, 255, 0.02)"}
      cursor="pointer"
      transition="all 0.2s ease"
      _hover={{
        borderColor: isSelected ? "#00C6E0" : "rgba(0, 198, 224, 0.4)",
        bg: isSelected ? "rgba(0, 198, 224, 0.12)" : "rgba(255, 255, 255, 0.05)"
      }}
      onClick={() => onClick(type.value)}
    >
      <HStack spacing={3}>
        <Box
          p={2}
          borderRadius="md"
          bg={`${type.color}.500`}
          opacity={0.8}
        >
          <Icon as={IconComponent} size="16px" color="white" />
        </Box>
        <Box flex="1">
          <Text color="white" fontWeight="medium" fontSize="sm">
            {type.label}
          </Text>
          <Text color="rgba(255, 255, 255, 0.6)" fontSize="xs">
            {type.description}
          </Text>
        </Box>
      </HStack>
    </Box>
  );
};

const StrategyBasics = ({ 
  formData, 
  onFormChange, 
  validationErrors = {},
  webhookUrl = null,
  intent = 'personal'
}) => {
  const [generatedUrl, setGeneratedUrl] = useState('');
  const { hasCopied, onCopy } = useClipboard(generatedUrl);

  // Generate webhook URL preview when name changes
  useEffect(() => {
    if (formData.name) {
      // Simple URL generation for preview
      const baseUrl = window.location.origin;
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const mockToken = 'wh_' + Math.random().toString(36).substring(2, 15);
      setGeneratedUrl(`${baseUrl}/api/v1/webhooks/${mockToken}/trigger`);
    } else {
      setGeneratedUrl('');
    }
  }, [formData.name]);

  const handleInputChange = (field, value) => {
    onFormChange({
      ...formData,
      [field]: value
    });
  };

  const getSamplePayload = () => {
    switch (formData.source_type) {
      case 'tradingview':
        return {
          "action": "{{strategy.order.action}}",
          "symbol": "{{ticker}}",
          "price": "{{close}}",
          "strategy": "{{strategy.order.id}}"
        };
      default:
        return {
          "action": "BUY",
          "symbol": "AAPL",
          "quantity": 100,
          "price": 150.50
        };
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Box>
        <Text fontSize="lg" fontWeight="bold" color="white" mb={2}>
          Strategy Configuration
        </Text>
        <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)">
          Set up the basic details and configuration for your trading strategy.
        </Text>
      </Box>

      {/* Strategy Name */}
      <Box>
        <Flex justify="space-between" align="center" mb={2}>
          <Text color="white" fontWeight="medium">
            Strategy Name *
          </Text>
          {validationErrors.name && (
            <Text color="red.300" fontSize="sm">
              {validationErrors.name}
            </Text>
          )}
        </Flex>
        <Input
          placeholder="Enter a descriptive name for your strategy"
          value={formData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          isInvalid={!!validationErrors.name}
          bg="rgba(255, 255, 255, 0.05)"
          borderColor="rgba(255, 255, 255, 0.15)"
          color="white"
          _placeholder={{ color: 'rgba(255, 255, 255, 0.5)' }}
          _hover={{ borderColor: "rgba(0, 198, 224, 0.4)" }}
          _focus={{ 
            borderColor: "#00C6E0",
            boxShadow: "0 0 0 1px #00C6E0"
          }}
        />
      </Box>

      {/* Strategy Type Selection */}
      <Box>
        <Flex justify="space-between" align="center" mb={3}>
          <Text color="white" fontWeight="medium">
            Strategy Type
          </Text>
          <Tooltip label="Choose the trading style that best describes your strategy">
            <IconButton
              icon={<HelpCircle size={16} />}
              variant="ghost"
              size="sm"
              color="rgba(255, 255, 255, 0.6)"
            />
          </Tooltip>
        </Flex>
        <VStack spacing={2}>
          {STRATEGY_TYPES.map(type => (
            <StrategyTypeCard
              key={type.value}
              type={type}
              isSelected={formData.strategy_type === type.value}
              onClick={(value) => handleInputChange('strategy_type', value)}
            />
          ))}
        </VStack>
      </Box>

      {/* Source Type */}
      <Box>
        <Text color="white" fontWeight="medium" mb={3}>
          Signal Source
        </Text>
        <VStack spacing={2}>
          {SOURCE_TYPES.map(source => (
            <Box
              key={source.value}
              p={3}
              borderRadius="md"
              border="1px solid"
              borderColor={formData.source_type === source.value ? "#00C6E0" : "rgba(255, 255, 255, 0.15)"}
              bg={formData.source_type === source.value ? "rgba(0, 198, 224, 0.08)" : "rgba(255, 255, 255, 0.02)"}
              cursor="pointer"
              transition="all 0.2s ease"
              _hover={{
                borderColor: formData.source_type === source.value ? "#00C6E0" : "rgba(0, 198, 224, 0.4)",
                bg: formData.source_type === source.value ? "rgba(0, 198, 224, 0.12)" : "rgba(255, 255, 255, 0.05)"
              }}
              onClick={() => handleInputChange('source_type', source.value)}
              w="full"
            >
              <HStack justify="space-between">
                <Box>
                  <HStack spacing={2}>
                    <Text color="white" fontWeight="medium">
                      {source.label}
                    </Text>
                    {source.popular && (
                      <Badge colorScheme="green" size="sm">
                        Popular
                      </Badge>
                    )}
                  </HStack>
                  <Text color="rgba(255, 255, 255, 0.6)" fontSize="sm" mt={1}>
                    {source.description}
                  </Text>
                </Box>
                {formData.source_type === source.value && (
                  <Icon as={Check} color="#00C6E0" size="20px" />
                )}
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Description */}
      <Box>
        <Flex justify="space-between" align="center" mb={2}>
          <Text color="white" fontWeight="medium">
            Strategy Description
          </Text>
          {formData.source_type === 'custom' && validationErrors.details && (
            <Text color="red.300" fontSize="sm">
              {validationErrors.details}
            </Text>
          )}
        </Flex>
        <Textarea
          placeholder={
            formData.source_type === 'custom' 
              ? "Describe your strategy logic, entry/exit rules, and any special requirements..."
              : "Describe your strategy (optional) - helps other users understand your approach..."
          }
          value={formData.details || ''}
          onChange={(e) => handleInputChange('details', e.target.value)}
          isInvalid={formData.source_type === 'custom' && !!validationErrors.details}
          bg="rgba(255, 255, 255, 0.05)"
          borderColor="rgba(255, 255, 255, 0.15)"
          color="white"
          _placeholder={{ color: 'rgba(255, 255, 255, 0.5)' }}
          _hover={{ borderColor: "rgba(0, 198, 224, 0.4)" }}
          _focus={{ 
            borderColor: "#00C6E0",
            boxShadow: "0 0 0 1px #00C6E0"
          }}
          rows={4}
          resize="vertical"
        />
        {formData.source_type === 'custom' && (
          <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)" mt={1}>
            Required for custom implementations
          </Text>
        )}
      </Box>

      <Divider borderColor="rgba(255, 255, 255, 0.1)" />

      {/* Webhook URL Preview */}
      {generatedUrl && (
        <Box>
          <Text color="white" fontWeight="medium" mb={3}>
            Webhook URL Preview
          </Text>
          <Box
            p={3}
            bg="rgba(255, 255, 255, 0.05)"
            borderRadius="md"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <HStack spacing={2} mb={2}>
              <Activity size={16} color="#00C6E0" />
              <Text fontSize="sm" color="#00C6E0" fontWeight="medium">
                Your webhook will be accessible at:
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Code
                bg="rgba(0, 0, 0, 0.3)"
                color="white"
                fontSize="xs"
                p={2}
                borderRadius="md"
                flex="1"
                wordBreak="break-all"
              >
                {generatedUrl}
              </Code>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCopy}
                leftIcon={hasCopied ? <Check size={14} /> : <Copy size={14} />}
                color={hasCopied ? "green.300" : "rgba(255, 255, 255, 0.7)"}
              >
                {hasCopied ? 'Copied!' : 'Copy'}
              </Button>
            </HStack>
            <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)" mt={2}>
              * This is a preview. The actual URL will be generated when you create the strategy.
            </Text>
          </Box>
        </Box>
      )}

      {/* Expected Payload Format */}
      <Box>
        <HStack justify="space-between" mb={3}>
          <Text color="white" fontWeight="medium">
            Expected Payload Format
          </Text>
          <Tooltip label="This is the JSON structure your webhook should send">
            <IconButton
              icon={<HelpCircle size={16} />}
              variant="ghost"
              size="sm"
              color="rgba(255, 255, 255, 0.6)"
            />
          </Tooltip>
        </HStack>
        <Box
          bg="rgba(0, 0, 0, 0.3)"
          p={4}
          borderRadius="md"
          border="1px solid rgba(255, 255, 255, 0.1)"
        >
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)">
              Sample JSON payload:
            </Text>
            {formData.source_type === 'tradingview' && (
              <Button
                size="xs"
                variant="ghost"
                color="#00C6E0"
                rightIcon={<ExternalLink size={12} />}
                onClick={() => window.open('https://www.tradingview.com/support/solutions/43000529348-about-webhooks/', '_blank')}
              >
                TradingView Docs
              </Button>
            )}
          </HStack>
          <Code
            display="block"
            bg="rgba(0, 0, 0, 0.5)"
            color="white"
            fontSize="xs"
            p={3}
            borderRadius="md"
            fontFamily="mono"
            whiteSpace="pre"
            overflowX="auto"
          >
            {JSON.stringify(getSamplePayload(), null, 2)}
          </Code>
        </Box>
      </Box>

      {/* Intent-specific messaging */}
      {intent === 'monetize' && (
        <Alert
          status="info"
          bg="rgba(0, 198, 224, 0.1)"
          border="1px solid rgba(0, 198, 224, 0.3)"
          borderRadius="md"
        >
          <AlertIcon color="#00C6E0" />
          <Box>
            <Text color="white" fontWeight="medium" fontSize="sm">
              Monetization Ready
            </Text>
            <Text color="rgba(255, 255, 255, 0.8)" fontSize="xs">
              After creating your strategy, you'll set up pricing and payment options.
            </Text>
          </Box>
        </Alert>
      )}

      {intent === 'share_free' && (
        <Alert
          status="success"
          bg="rgba(72, 187, 120, 0.1)"
          border="1px solid rgba(72, 187, 120, 0.3)"
          borderRadius="md"
        >
          <AlertIcon color="green.300" />
          <Box>
            <Text color="white" fontWeight="medium" fontSize="sm">
              Community Sharing
            </Text>
            <Text color="rgba(255, 255, 255, 0.8)" fontSize="xs">
              Your strategy will be publicly available for free once created.
            </Text>
          </Box>
        </Alert>
      )}
    </VStack>
  );
};

export default StrategyBasics;