import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Button, VStack, HStack, Badge, Icon, Divider } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Check, CircleDotDashed, ExternalLink } from 'lucide-react';
import { useDemoAnimation } from '../DemoController';

const BrokerConnect = () => {
  // Get animation state from context
  const { isAnimating, animationProgress, typingText } = useDemoAnimation();
  
  // Local state for animation stages
  const [connectionState, setConnectionState] = useState('initial');
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  
  // Reset and coordinate animations when this step becomes active
  useEffect(() => {
    if (isAnimating) {
      // Reset state
      setConnectionState('initial');
      setConnectedAccounts([]);
      
      // After delay, show connection modal
      const timer1 = setTimeout(() => {
        setConnectionState('connecting');
      }, 1500);
      
      // After connecting, show success
      const timer2 = setTimeout(() => {
        setConnectionState('success');
        
        // Add first account
        setConnectedAccounts([
          {
            id: 'account1',
            name: 'Trading Account 1',
            broker: 'tradovate',
            environment: 'demo',
            active: true
          }
        ]);
        
        // Add second account with delay
        setTimeout(() => {
          setConnectedAccounts(prev => [
            ...prev,
            {
              id: 'account2',
              name: 'Trading Account 2',
              broker: 'tradovate',
              environment: 'live',
              active: true
            }
          ]);
        }, 800);
      }, 3500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isAnimating]);
  
  return (
    <Flex direction="column" h="100%" p={2}>
      {/* Header with action button */}
      <Flex justify="space-between" align="center" mb={4} px={2}>
        <Text color="white" fontSize="lg" fontWeight="bold">
          Trading Accounts
        </Text>
        
        <Button
          as={motion.button}
          size="sm"
          bg={connectionState === 'initial' ? "rgba(0, 198, 224, 0.2)" : "transparent"}
          color="white"
          borderWidth="1px"
          borderColor="rgba(0, 198, 224, 0.6)"
          _hover={{ bg: "rgba(0, 198, 224, 0.3)" }}
          fontSize="sm"
          px={3}
          animate={{
            scale: connectionState === 'initial' ? [1, 1.05, 1] : 1,
            boxShadow: connectionState === 'initial' ? 
              ["0 0 0px rgba(0, 198, 224, 0)", "0 0 10px rgba(0, 198, 224, 0.5)", "0 0 0px rgba(0, 198, 224, 0)"] : 
              "0 0 0px rgba(0, 198, 224, 0)"
          }}
          transition={{ repeat: connectionState === 'initial' ? Infinity : 0, repeatDelay: 3 }}
        >
          Connect Account
        </Button>
      </Flex>
      
      {/* Connected accounts list */}
      <Box 
        flex="1" 
        overflowY="auto" 
        bg="rgba(30, 30, 30, 0.3)" 
        borderRadius="lg"
        borderWidth="1px"
        borderColor="rgba(255, 255, 255, 0.1)"
        p={2}
      >
        <VStack spacing={2} align="stretch">
          {connectedAccounts.length === 0 ? (
            <Flex 
              direction="column" 
              align="center" 
              justify="center" 
              py={10}
              opacity={0.7}
            >
              <Icon as={CircleDotDashed} boxSize={10} color="whiteAlpha.400" mb={3} />
              <Text color="whiteAlpha.600" fontSize="sm">
                No connected accounts
              </Text>
              <Text color="whiteAlpha.500" fontSize="xs" mt={1}>
                Connect your first trading account to get started
              </Text>
            </Flex>
          ) : (
            connectedAccounts.map((account, index) => (
              <AccountItem
                key={account.id}
                account={account}
                index={index}
                isNew={connectionState === 'success' && index === connectedAccounts.length - 1}
              />
            ))
          )}
        </VStack>
      </Box>
      
      {/* Connection modal - appears during connection process */}
      {connectionState === 'connecting' && (
        <ConnectionModal onSuccess={() => setConnectionState('success')} />
      )}
    </Flex>
  );
};

// Account list item component
const AccountItem = ({ account, index, isNew }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <Box
      as={motion.div}
      bg="rgba(40, 40, 40, 0.5)"
      borderRadius="md"
      overflow="hidden"
      initial={isNew ? { opacity: 0, y: 20 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Account header */}
      <Flex 
        p={3} 
        justify="space-between" 
        align="center"
        borderLeft="3px solid"
        borderColor={account.environment === 'demo' ? "purple.400" : "cyan.400"}
      >
        <HStack spacing={3}>
          <Box bg="whiteAlpha.200" borderRadius="md" p={1.5} fontSize="lg" fontWeight="bold" color="whiteAlpha.800">
            {account.name.substr(0, 2).toUpperCase()}
          </Box>
          
          <VStack spacing={0} align="flex-start">
            <Text color="white" fontWeight="medium" fontSize="sm">
              {account.name}
            </Text>
            <HStack>
              <Text color="whiteAlpha.600" fontSize="xs">
                {account.broker}
              </Text>
              <Badge
                colorScheme={account.environment === 'demo' ? "purple" : "cyan"}
                variant="subtle"
                fontSize="xx-small"
              >
                {account.environment}
              </Badge>
            </HStack>
          </VStack>
        </HStack>
        
        <HStack>
          <Box 
            as="button"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Icon 
              as={isExpanded ? ChevronDown : ChevronRight} 
              boxSize={4} 
              color="whiteAlpha.600" 
            />
          </Box>
        </HStack>
      </Flex>
      
      {/* Expanded content */}
      {isExpanded && (
        <Box p={3} bg="rgba(30, 30, 30, 0.5)" borderTop="1px solid" borderColor="whiteAlpha.100">
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <Text color="whiteAlpha.600" fontSize="xs">Status</Text>
              <HStack>
                <Box w="6px" h="6px" borderRadius="full" bg="green.400" />
                <Text color="green.400" fontSize="xs">Connected</Text>
              </HStack>
            </HStack>
            
            <HStack justify="space-between">
              <Text color="whiteAlpha.600" fontSize="xs">Environment</Text>
              <Text color="white" fontSize="xs">{account.environment}</Text>
            </HStack>
            
            <HStack justify="space-between">
              <Text color="whiteAlpha.600" fontSize="xs">Last Sync</Text>
              <Text color="white" fontSize="xs">Just now</Text>
            </HStack>
            
            <Button
              size="xs"
              variant="outline"
              borderColor="rgba(0, 198, 224, 0.4)"
              color="rgba(0, 198, 224, 0.9)"
              fontSize="xs"
              rightIcon={<ExternalLink size={12} />}
            >
              Open in Broker
            </Button>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

// Connection modal component
const ConnectionModal = ({ onSuccess }) => {
  const [stage, setStage] = useState('authorizing');
  
  // Progress through connection stages
  useEffect(() => {
    const timer = setTimeout(() => {
      setStage('connecting');
      
      setTimeout(() => {
        setStage('success');
        
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 800);
      }, 1200);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [onSuccess]);
  
  return (
    <Box
      as={motion.div}
      position="absolute"
      top="50%"
      left="50%"
      transform="translate(-50%, -50%)"
      w="80%"
      maxW="350px"
      bg="rgba(30, 30, 30, 0.95)"
      borderRadius="xl"
      p={4}
      boxShadow="0 8px 32px rgba(0, 0, 0, 0.3)"
      border="1px solid rgba(255, 255, 255, 0.1)"
      zIndex={10}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <VStack spacing={4}>
        <Text color="white" fontWeight="bold">
          Connecting to Tradovate
        </Text>
        
        <Divider borderColor="whiteAlpha.200" />
        
        <VStack py={4} spacing={3}>
          <ConnectionStage
            label="Authenticating"
            status={stage === 'authorizing' ? 'active' : 'complete'}
          />
          
          <ConnectionStage
            label="Establishing Connection"
            status={stage === 'connecting' ? 'active' : (stage === 'success' ? 'complete' : 'pending')}
          />
          
          <ConnectionStage
            label="Account Verified"
            status={stage === 'success' ? 'complete' : 'pending'}
          />
        </VStack>
      </VStack>
    </Box>
  );
};

// Connection stage indicator
const ConnectionStage = ({ label, status }) => {
  return (
    <HStack w="full" spacing={4}>
      <Box
        w="24px"
        h="24px"
        borderRadius="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg={
          status === 'active' ? "blue.500" :
          status === 'complete' ? "green.500" :
          "whiteAlpha.200"
        }
      >
        {status === 'complete' ? (
          <Check size={14} color="white" />
        ) : (
          status === 'active' && (
            <Box
              as={motion.div}
              w="8px"
              h="8px"
              borderRadius="full"
              bg="white"
              animate={{ 
                opacity: [1, 0.5, 1] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5 
              }}
            />
          )
        )}
      </Box>
      
      <Text 
        color={
          status === 'active' ? "white" :
          status === 'complete' ? "green.400" :
          "whiteAlpha.500"
        }
        fontSize="sm"
      >
        {label}
      </Text>
    </HStack>
  );
};

export default BrokerConnect;