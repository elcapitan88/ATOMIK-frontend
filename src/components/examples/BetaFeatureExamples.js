// frontend/src/components/examples/BetaFeatureExamples.js
// Example component demonstrating beta feature usage

import React from 'react';
import { 
  Box, 
  VStack, 
  HStack,
  Text, 
  Button, 
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Code,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { 
  BetaFeature, 
  BetaBadge, 
  withBetaAccess, 
  useBetaAccess 
} from '../common/beta';

// Example component that's wrapped with HOC
const AdvancedAnalyticsComponent = () => (
  <Card>
    <CardHeader>
      <HStack justify="space-between" align="center">
        <Heading size="md">Advanced Analytics</Heading>
        <BetaBadge animated={true} />
      </HStack>
    </CardHeader>
    <CardBody>
      <Text>This is the advanced analytics dashboard that's only available to beta testers.</Text>
    </CardBody>
  </Card>
);

// Wrap component with HOC
const AdvancedAnalytics = withBetaAccess('advanced-analytics', {
  title: "Advanced Analytics Dashboard",
  description: "Get insights with our next-generation analytics tools.",
  showRequestAccess: true
})(AdvancedAnalyticsComponent);

// Example component using direct wrapper
const ExperimentalTradingTools = () => (
  <BetaFeature 
    featureName="experimental-trading"
    title="Experimental Trading Tools"
    description="Advanced trading algorithms and automation features."
    showRequestAccess={true}
  >
    <Card>
      <CardHeader>
        <HStack justify="space-between" align="center">
          <Heading size="md">Trading Automation</Heading>
          <BetaBadge variant="pill" size="sm" />
        </HStack>
      </CardHeader>
      <CardBody>
        <Text>Advanced trading tools with AI-powered automation.</Text>
        <Button mt={4} colorScheme="blue" size="sm">
          Configure Trading Bot
        </Button>
      </CardBody>
    </Card>
  </BetaFeature>
);

// Component demonstrating hook usage
const BetaStatusComponent = () => {
  const { 
    isBetaTester, 
    betaFeatures, 
    hasFeatureAccess, 
    getAvailableFeatures,
    loading 
  } = useBetaAccess();

  if (loading) {
    return <Text>Loading beta status...</Text>;
  }

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Beta Status Dashboard</Heading>
      </CardHeader>
      <CardBody>
        <VStack align="start" spacing={4}>
          <HStack>
            <Text fontWeight="bold">Beta Tester:</Text>
            <Text color={isBetaTester ? "green.400" : "red.400"}>
              {isBetaTester ? "Yes" : "No"}
            </Text>
            {isBetaTester && <BetaBadge size="sm" variant="subtle" />}
          </HStack>
          
          <Box>
            <Text fontWeight="bold" mb={2}>Available Features:</Text>
            {betaFeatures.length > 0 ? (
              <VStack align="start" spacing={1}>
                {getAvailableFeatures().map(feature => (
                  <HStack key={feature.key}>
                    <Text fontSize="sm">• {feature.name}</Text>
                    <BetaBadge size="sm" variant="outline" label="ACTIVE" />
                  </HStack>
                ))}
              </VStack>
            ) : (
              <Text fontSize="sm" color="gray.500">No beta features available</Text>
            )}
          </Box>
          
          <Divider />
          
          <Box>
            <Text fontWeight="bold" mb={2}>Feature Access Check:</Text>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm">
                Advanced Analytics: {hasFeatureAccess('advanced-analytics') ? '✅' : '❌'}
              </Text>
              <Text fontSize="sm">
                AI Insights: {hasFeatureAccess('ai-insights') ? '✅' : '❌'}
              </Text>
              <Text fontSize="sm">
                New Dashboard: {hasFeatureAccess('new-dashboard') ? '✅' : '❌'}
              </Text>
            </VStack>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

// Component showing different badge variants
const BetaBadgeShowcase = () => (
  <Card>
    <CardHeader>
      <Heading size="md">Beta Badge Variants</Heading>
    </CardHeader>
    <CardBody>
      <VStack spacing={4}>
        <HStack spacing={4} wrap="wrap">
          <BetaBadge variant="solid" />
          <BetaBadge variant="outline" />
          <BetaBadge variant="subtle" />
          <BetaBadge variant="pill" />
        </HStack>
        
        <HStack spacing={4} wrap="wrap">
          <BetaBadge size="sm" label="SMALL" />
          <BetaBadge size="md" label="MEDIUM" />
          <BetaBadge size="lg" label="LARGE" />
        </HStack>
        
        <HStack spacing={4} wrap="wrap">
          <BetaBadge iconType="sparkles" animated={true} />
          <BetaBadge iconType="zap" variant="outline" />
          <BetaBadge iconType="star" variant="pill" />
        </HStack>
      </VStack>
    </CardBody>
  </Card>
);

// Usage examples component
const UsageExamples = () => (
  <Card>
    <CardHeader>
      <Heading size="md">Usage Examples</Heading>
    </CardHeader>
    <CardBody>
      <VStack align="start" spacing={4}>
        <Box>
          <Text fontWeight="bold" mb={2}>HOC Wrapper:</Text>
          <Code p={2} display="block" whiteSpace="pre">
{`const MyComponent = () => <div>Beta content</div>;
export default withBetaAccess('feature-name')(MyComponent);`}
          </Code>
        </Box>
        
        <Box>
          <Text fontWeight="bold" mb={2}>Direct Wrapper:</Text>
          <Code p={2} display="block" whiteSpace="pre">
{`<BetaFeature featureName="advanced-analytics">
  <AdvancedAnalyticsComponent />
</BetaFeature>`}
          </Code>
        </Box>
        
        <Box>
          <Text fontWeight="bold" mb={2}>Hook Usage:</Text>
          <Code p={2} display="block" whiteSpace="pre">
{`const { isBetaTester, hasFeatureAccess } = useBetaAccess();
if (hasFeatureAccess('new-feature')) {
  return <NewFeatureComponent />;
}`}
          </Code>
        </Box>
      </VStack>
    </CardBody>
  </Card>
);

// Main examples component
const BetaFeatureExamples = () => {
  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={2}>Beta Feature System Examples</Heading>
          <Text color="gray.600">
            Demonstrating the beta feature components and utilities
          </Text>
        </Box>
        
        <Alert status="info">
          <AlertIcon />
          <AlertTitle>Note:</AlertTitle>
          <AlertDescription>
            These examples show how beta features work. Access depends on your beta tester status.
          </AlertDescription>
        </Alert>
        
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <BetaStatusComponent />
          <BetaBadgeShowcase />
        </SimpleGrid>
        
        <AdvancedAnalytics />
        <ExperimentalTradingTools />
        <UsageExamples />
      </VStack>
    </Box>
  );
};

export default BetaFeatureExamples;