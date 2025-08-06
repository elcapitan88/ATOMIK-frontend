import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Spinner,
  useToast,
  Flex,
  Container,
  Badge,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { ArrowLeft, Users, Shield, CheckCircle2, Crown } from 'lucide-react';
import Menu from '../layout/Sidebar/Menu';
import StrategyPurchaseModal from '../features/marketplace/components/StrategyPurchaseModal';

const StrategyPurchasePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [strategy, setStrategy] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Fetch strategy details and pricing
  useEffect(() => {
    const fetchStrategyData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch strategy details from shared strategies endpoint
        const strategiesResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/webhooks/shared`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        
        if (!strategiesResponse.ok) {
          throw new Error('Failed to fetch strategies');
        }
        
        const strategies = await strategiesResponse.json();
        const currentStrategy = strategies.find(s => s.token === token);
        
        if (!currentStrategy) {
          throw new Error('Strategy not found');
        }
        
        setStrategy(currentStrategy);
        
        // Fetch pricing information if monetized
        if (currentStrategy.is_monetized) {
          const pricingResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/strategy-monetization/${token}/pricing`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          });
          
          if (pricingResponse.ok) {
            const pricingData = await pricingResponse.json();
            setPricing(pricingData);
          }
        }
        
      } catch (error) {
        console.error('Error fetching strategy data:', error);
        toast({
          title: "Error Loading Strategy",
          description: error.message || "Failed to load strategy details",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        // Redirect back to marketplace after error
        setTimeout(() => navigate('/marketplace'), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchStrategyData();
    }
  }, [token, navigate, toast]);

  // Handle purchase completion
  const handlePurchaseSuccess = () => {
    toast({
      title: "🎉 Purchase Successful!",
      description: "You now have access to this strategy",
      status: "success",
      duration: 4000,
      isClosable: true,
    });
    
    // Redirect to marketplace or strategy details
    navigate('/marketplace');
  };

  // Loading state
  if (isLoading) {
    return (
      <Flex minH="100vh" bg="background" color="text.primary">
        <Menu onSelectItem={() => {}} />
        <Flex 
          flexGrow={1} 
          ml={{ base: 0, md: 16 }}
          justify="center" 
          align="center"
        >
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text color="whiteAlpha.900">Loading strategy details...</Text>
          </VStack>
        </Flex>
      </Flex>
    );
  }

  // Error state - strategy not found
  if (!strategy) {
    return (
      <Flex minH="100vh" bg="background" color="text.primary">
        <Menu onSelectItem={() => {}} />
        <Flex 
          flexGrow={1} 
          ml={{ base: 0, md: 16 }}
          justify="center" 
          align="center"
        >
          <VStack spacing={4} textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="white">
              Strategy Not Found
            </Text>
            <Text color="whiteAlpha.700">
              The strategy you're looking for could not be found.
            </Text>
            <Button 
              onClick={() => navigate('/marketplace')}
              leftIcon={<ArrowLeft size={16} />}
            >
              Back to Marketplace
            </Button>
          </VStack>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg="background" color="text.primary" fontFamily="body">
      <Menu onSelectItem={() => {}} />
      
      <Box 
        flexGrow={1} 
        ml={{ base: 0, md: 16 }}
        mb={{ base: "70px", md: 0 }}
      >
        <Box h="100vh" w="full" overflow="hidden" position="relative">
          {/* Background Effects */}
          <Box 
            position="absolute" 
            inset={0} 
            bgGradient="linear(to-br, blackAlpha.400, blackAlpha.200, blackAlpha.400)" 
            pointerEvents="none" 
          />
          <Box 
            position="absolute" 
            inset={0} 
            backdropFilter="blur(16px)" 
            bg="blackAlpha.300" 
          />
          
          {/* Content */}
          <Box 
            position="relative" 
            h="full" 
            zIndex={1} 
            overflowY="auto"
            p={4}
          >
            <Container maxW="container.lg" py={4}>
              {/* Header */}
              <Flex 
                direction={{ base: 'column', md: 'row' }} 
                justify="space-between" 
                align={{ base: 'stretch', md: 'center' }}
                gap={4}
                mb={6}
              >
                <VStack align="flex-start" spacing={1}>
                  <HStack spacing={2}>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<ArrowLeft size={16} />}
                      onClick={() => navigate('/marketplace')}
                      color="whiteAlpha.700"
                    >
                      Back to Marketplace
                    </Button>
                  </HStack>
                  <Text 
                    fontSize="2xl" 
                    fontWeight="bold" 
                    color="white"
                    textShadow="0 0 10px rgba(0, 198, 224, 0.3)"
                  >
                    Purchase Strategy
                  </Text>
                </VStack>
              </Flex>

              {/* Strategy Details Card */}
              <Box
                bg="rgba(255, 255, 255, 0.1)"
                backdropFilter="blur(15px)"
                borderWidth="1px"
                borderColor="whiteAlpha.200"
                borderRadius="xl"
                p={8}
                mb={6}
              >
                <VStack spacing={6} align="stretch">
                  {/* Header */}
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={2}>
                      <HStack spacing={3} align="center">
                        <Text fontSize="3xl" fontWeight="bold" color="white">
                          {strategy.name}
                        </Text>
                        {strategy.is_monetized && (
                          <Badge 
                            colorScheme="purple" 
                            size="lg"
                            variant="solid"
                            px={3}
                            py={1}
                          >
                            <HStack spacing={1}>
                              <Crown size={14} />
                              <Text>PREMIUM</Text>
                            </HStack>
                          </Badge>
                        )}
                      </HStack>
                      <Text fontSize="lg" color="whiteAlpha.700">
                        Created by {strategy.username}
                      </Text>
                      <Badge
                        colorScheme="blue"
                        bg="rgba(0, 198, 224, 0.2)"
                        color="white"
                        borderRadius="full"
                        px={3}
                        py={1}
                      >
                        {strategy.strategy_type}
                      </Badge>
                    </VStack>
                  </HStack>

                  <Divider borderColor="whiteAlpha.200" />

                  {/* Description */}
                  <VStack align="start" spacing={3}>
                    <Text fontSize="xl" fontWeight="semibold" color="white">
                      Strategy Description
                    </Text>
                    <Text fontSize="md" color="whiteAlpha.800" lineHeight="1.6">
                      {strategy.details || 'No description provided'}
                    </Text>
                  </VStack>

                  {/* Stats */}
                  <HStack justify="space-between" align="center" wrap="wrap" spacing={4}>
                    <HStack spacing={2} color="whiteAlpha.700">
                      <Icon as={Users} size={20} />
                      <Text fontSize="md" fontWeight="medium">
                        {strategy.subscriber_count || 0} subscribers
                      </Text>
                    </HStack>
                    
                    <HStack spacing={2} color="green.300">
                      <Icon as={Shield} size={20} />
                      <Text fontSize="md" fontWeight="medium">
                        Secure Payment
                      </Text>
                    </HStack>
                    
                    <HStack spacing={2} color="blue.300">
                      <Icon as={CheckCircle2} size={20} />
                      <Text fontSize="md" fontWeight="medium">
                        Instant Access
                      </Text>
                    </HStack>
                  </HStack>

                  <Divider borderColor="whiteAlpha.200" />

                  {/* Purchase Button */}
                  <VStack spacing={4}>
                    {strategy.is_monetized ? (
                      <Button
                        size="lg"
                        w="full"
                        h="14"
                        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        color="white"
                        fontWeight="bold"
                        fontSize="lg"
                        onClick={() => setIsPurchaseModalOpen(true)}
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 25px rgba(102, 126, 234, 0.4)"
                        }}
                        _active={{
                          transform: "translateY(0px)"
                        }}
                      >
                        💳 View Pricing Options
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        w="full"
                        h="14"
                        bg="linear-gradient(135deg, #4299e1 0%, #3182ce 100%)"
                        color="white"
                        fontWeight="bold"
                        fontSize="lg"
                        onClick={() => {
                          // Handle free strategy subscription
                          toast({
                            title: "Free Strategy",
                            description: "This strategy is available for free!",
                            status: "info",
                            duration: 3000,
                            isClosable: true,
                          });
                          navigate('/marketplace');
                        }}
                      >
                        Subscribe for Free
                      </Button>
                    )}
                    
                    <Text fontSize="sm" color="whiteAlpha.600" textAlign="center">
                      Secure payment powered by Stripe • Cancel anytime
                    </Text>
                  </VStack>
                </VStack>
              </Box>
            </Container>
          </Box>
        </Box>
      </Box>

      {/* Purchase Modal */}
      {isPurchaseModalOpen && pricing && (
        <StrategyPurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          strategy={strategy}
          pricing={pricing}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </Flex>
  );
};

export default StrategyPurchasePage;