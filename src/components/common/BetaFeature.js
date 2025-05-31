// frontend/src/components/common/BetaFeature.js
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
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { 
  Lock, 
  Mail, 
  Sparkles, 
  Eye,
  UserPlus,
  TestTube
} from 'lucide-react';
import { useBetaAccess } from '../../hooks/useBetaAccess';
import ComingSoon from './ComingSoon';

// Motion components
const MotionBox = motion(Box);

/**
 * BetaFeature wrapper component that conditionally renders beta features
 * based on user's beta access permissions
 * 
 * @param {string} featureName - The name of the beta feature (must match backend BETA_FEATURES)
 * @param {React.ReactNode} children - The feature content to render if user has access
 * @param {React.ReactNode} fallback - Custom fallback component if access denied
 * @param {boolean} showComingSoon - Whether to show ComingSoon component if no access
 * @param {boolean} showRequestAccess - Whether to show request access option
 * @param {string} title - Title for the access denied message
 * @param {string} description - Description for the access denied message
 * @param {boolean} requireExactFeature - If true, requires exact feature access; if false, any beta access allows entry
 */
const BetaFeature = ({
  featureName,
  children,
  fallback = null,
  showComingSoon = false,
  showRequestAccess = true,
  title,
  description,
  requireExactFeature = true,
  ...props
}) => {
  const { 
    isBetaTester, 
    hasFeatureAccess, 
    loading, 
    error,
    requestBetaAccess,
    BETA_FEATURES 
  } = useBetaAccess();
  
  const toast = useToast();

  // Determine if user has access
  const hasAccess = requireExactFeature 
    ? hasFeatureAccess(featureName)
    : isBetaTester;

  // Handle request access
  const handleRequestAccess = async () => {
    try {
      await requestBetaAccess(featureName);
      toast({
        title: "Request Submitted",
        description: "Your beta access request has been submitted. We'll review it shortly!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Request Failed",
        description: err.message || "Failed to submit beta access request. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <Flex 
        justify="center" 
        align="center" 
        h="200px" 
        direction="column" 
        gap={4}
        {...props}
      >
        <Spinner 
          color="#00C6E0" 
          size="lg" 
          thickness="3px"
        />
        <Text color="whiteAlpha.600">Checking beta access...</Text>
      </Flex>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert 
        status="warning" 
        variant="subtle" 
        flexDirection="column" 
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        height="200px"
        borderRadius="lg"
        bg="rgba(255, 165, 0, 0.1)"
        border="1px solid rgba(255, 165, 0, 0.3)"
        {...props}
      >
        <AlertIcon boxSize="40px" mr={0} color="orange.400" />
        <AlertTitle mt={4} mb={1} fontSize="lg" color="orange.400">
          Access Check Failed
        </AlertTitle>
        <AlertDescription maxWidth="sm" color="whiteAlpha.700">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  // User has access - render the feature
  if (hasAccess) {
    return (
      <Box {...props}>
        {children}
      </Box>
    );
  }

  // Custom fallback provided
  if (fallback) {
    return fallback;
  }

  // Show ComingSoon component
  if (showComingSoon) {
    return (
      <ComingSoon
        title={title || BETA_FEATURES[featureName] || 'Beta Feature'}
        subtitle={description || "This feature is currently in beta testing"}
        description="This feature is available to beta testers. Request access to try the latest experimental features."
        estimatedLaunch="Available to Beta Testers"
      />
    );
  }

  // Default access denied UI
  const featureDisplayName = title || BETA_FEATURES[featureName] || 'Beta Feature';
  const featureDescription = description || `${featureDisplayName} is currently available to beta testers only.`;

  return (
    <Box
      {...props}
      minH="400px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={6}
    >
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        maxW="500px"
        w="100%"
        textAlign="center"
        p={8}
        bg="rgba(0, 0, 0, 0.3)"
        borderRadius="xl"
        border="1px solid rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(10px)"
      >
        <VStack spacing={6}>
          {/* Beta icon with sparkles */}
          <MotionBox
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            position="relative"
          >
            <Flex
              w={20}
              h={20}
              bg="rgba(153, 50, 204, 0.15)"
              borderRadius="full"
              align="center"
              justify="center"
              border="2px solid rgba(153, 50, 204, 0.3)"
              position="relative"
              mx="auto"
            >
              <Icon as={TestTube} boxSize={10} color="#9932CC" />
              
              {/* Sparkles animation */}
              {[...Array(3)].map((_, i) => (
                <MotionBox
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1, 0],
                    x: [0, (i - 1) * 30],
                    y: [0, -20 - (i * 10)]
                  }}
                  transition={{ 
                    delay: 0.5 + (i * 0.2), 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  position="absolute"
                >
                  <Icon as={Sparkles} boxSize={4} color="#9932CC" />
                </MotionBox>
              ))}
            </Flex>
          </MotionBox>

          {/* Beta badge */}
          <Badge
            bg="rgba(153, 50, 204, 0.15)"
            color="#9932CC"
            px={4}
            py={2}
            borderRadius="full"
            fontSize="sm"
            fontWeight="medium"
            border="1px solid rgba(153, 50, 204, 0.3)"
          >
            <HStack spacing={2}>
              <Icon as={Lock} boxSize={4} />
              <Text>Beta Access Required</Text>
            </HStack>
          </Badge>

          {/* Title and description */}
          <VStack spacing={3}>
            <Heading size="lg" color="white" fontWeight="bold">
              {featureDisplayName}
            </Heading>
            <Text color="whiteAlpha.700" fontSize="md" lineHeight="1.6">
              {featureDescription}
            </Text>
          </VStack>

          {/* Action buttons */}
          <VStack spacing={3} mt={4}>
            {showRequestAccess && (
              <Button
                onClick={handleRequestAccess}
                bg="rgba(153, 50, 204, 0.15)"
                color="#9932CC"
                border="1px solid rgba(153, 50, 204, 0.3)"
                _hover={{ 
                  bg: "rgba(153, 50, 204, 0.25)", 
                  transform: "translateY(-1px)" 
                }}
                size="lg"
                borderRadius="lg"
                leftIcon={<Icon as={Mail} boxSize={4} />}
              >
                Request Beta Access
              </Button>
            )}
            
            <Text color="whiteAlpha.500" fontSize="sm" textAlign="center">
              <Icon as={UserPlus} boxSize={4} display="inline" mr={2} />
              Beta testing helps us improve features before general release
            </Text>
          </VStack>

          {/* Info about beta program */}
          <Box
            p={4}
            bg="rgba(0, 198, 224, 0.05)"
            border="1px solid rgba(0, 198, 224, 0.2)"
            borderRadius="lg"
            mt={4}
          >
            <HStack spacing={2} mb={2}>
              <Icon as={Eye} boxSize={4} color="#00C6E0" />
              <Text fontSize="sm" fontWeight="medium" color="#00C6E0">
                About Beta Testing
              </Text>
            </HStack>
            <Text fontSize="xs" color="whiteAlpha.600" lineHeight="1.4">
              Beta testers get early access to experimental features and help shape the future of our platform. 
              Your feedback is invaluable for improving these features before they're released to everyone.
            </Text>
          </Box>
        </VStack>
      </MotionBox>
    </Box>
  );
};

export default BetaFeature;