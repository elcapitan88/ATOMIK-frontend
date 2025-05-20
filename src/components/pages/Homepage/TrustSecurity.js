import React from 'react';
import { Box, Container, SimpleGrid, Heading, Text, VStack, Icon, List, ListItem, ListIcon } from '@chakra-ui/react';
import { Shield, Lock, Server, CheckCircle, Key, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const SecurityFeature = ({ title, description, items }) => (
  <VStack
    align="flex-start"
    spacing={4}
    p={6}
    bg="rgba(255, 255, 255, 0.1)"
    backdropFilter="blur(10px)"
    borderRadius="xl"
    border="1px solid rgba(255, 255, 255, 0.18)"
  >
    <Box
      p={2}
      bg="rgba(0, 198, 224, 0.1)"
      borderRadius="lg"
      color="rgba(0, 198, 224, 1)"
    >
      <Icon as={Shield} boxSize={6} />
    </Box>
    <Heading size="md" color="white">
      {title}
    </Heading>
    <Text color="whiteAlpha.800" fontSize="sm">
      {description}
    </Text>
    <List spacing={3}>
      {items.map((item, index) => (
        <ListItem
          key={index}
          color="whiteAlpha.900"
          fontSize="sm"
          display="flex"
          alignItems="center"
        >
          <ListIcon as={CheckCircle} color="rgba(0, 198, 224, 1)" />
          {item}
        </ListItem>
      ))}
    </List>
  </VStack>
);

const TrustSecurity = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: 'Data Encryption',
      description: 'Enterprise-grade security for your trading data and personal information.',
      items: [
        'Bank-level AES-256 encryption',
        'End-to-end data encryption',
        'Secure API endpoints',
        'Regular security audits'
      ]
    },
    {
      icon: Key,
      title: 'Access Control',
      description: 'Multi-layered authentication and authorization systems.',
      items: [
        'Two-factor authentication',
        'IP whitelisting',
        'Role-based access control',
        'Session management'
      ]
    },
    {
      icon: Server,
      title: 'Infrastructure Security',
      description: 'Robust and reliable infrastructure with multiple safeguards.',
      items: [
        'DDoS protection',
        'Load balancing',
        'Real-time monitoring',
        'Automated backups'
      ]
    },
    {
      icon: Eye,
      title: 'Transparency',
      description: 'Clear visibility into system operations and security measures.',
      items: [
        'Security audit logs',
        'Real-time status updates',
        'Incident reporting',
        'Compliance documentation'
      ]
    }
  ];

  return (
    <Box
      id="security"
      py={20}
      bg="black"
      position="relative"
      overflow="hidden"
    >
      {/* Background Gradient */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,198,224,0.05) 100%)"
        pointerEvents="none"
      />

      <Container maxW="7xl" px={{ base: 4, md: 8 }}>
        <VStack spacing={12}>
          <VStack spacing={4} textAlign="center" maxW="800px">
            <Heading
              as="h2"
              size="2xl"
              color="white"
              fontWeight="bold"
            >
              Enterprise-Grade
              <Text
                as="span"
                bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                bgClip="text"
                px={2}
              >
                Security
              </Text>
            </Heading>
            <Text color="whiteAlpha.800" fontSize="lg">
              Your trading operations secured with military-grade encryption and multiple layers of protection
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full">
            {securityFeatures.map((feature, index) => (
              <MotionBox
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <SecurityFeature {...feature} />
              </MotionBox>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default TrustSecurity;