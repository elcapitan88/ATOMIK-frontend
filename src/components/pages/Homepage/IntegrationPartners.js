import React from 'react';
import { Box, Container, SimpleGrid, Heading, Text, VStack, Image, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const PartnerLogo = ({ name }) => (
  <MotionBox
    whileHover={{ scale: 1.05 }}
    transition="all 0.3s"
    p={{ base: 4, md: 8 }}
    bg="rgba(255, 255, 255, 0.1)"
    backdropFilter="blur(10px)"
    borderRadius="xl"
    border="1px solid rgba(255, 255, 255, 0.18)"
    display="flex"
    alignItems="center"
    justifyContent="center"
    height={{ base: "80px", md: "100px" }}
  >
    {/* Replace with actual broker logos */}
    <Text 
      color="white" 
      fontSize={{ base: "md", md: "xl" }} 
      fontWeight="bold"
      textAlign="center"
    >
      {name}
    </Text>
  </MotionBox>
);

const IntegrationPartners = () => {
  const partners = [
    { name: 'Tradovate' },
    { name: 'NinjaTrader' }, // Future integration
    { name: 'Interactive Brokers**' }, // Future integration
    { name: 'TopStep' }, // Future integration
    { name: 'TakeProfit' }, // Future integration
    { name: 'Coinbase**' }, // Future integration
  ];

  return (
    <Box
      py={{ base: 12, md: 20 }}
      bg="black"
      position="relative"
      overflow="hidden"
    >
      {/* Background Elements */}
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
        <VStack spacing={{ base: 8, md: 12 }}>
          <VStack spacing={4} textAlign="center" maxW="800px">
            <Heading
              as="h2"
              size={{ base: "xl", md: "2xl" }}
              color="white"
              fontWeight="bold"
            >
              Integration
              <Text
                as="span"
                bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                bgClip="text"
                px={2}
              >
                Partners
              </Text>
            </Heading>
            <Text 
              color="whiteAlpha.800" 
              fontSize={{ base: "md", md: "lg" }}
              px={{ base: 2, md: 0 }}
            >
              Seamlessly connect with leading trading platforms and expand your trading capabilities
            </Text>
          </VStack>

          {/* Mobile-optimized grid */}
          <SimpleGrid
            columns={{ base: 1, sm: 2, md: 3 }}
            spacing={{ base: 4, md: 8 }}
            w="full"
          >
            {partners.map((partner, index) => (
              <MotionBox
                key={partner.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PartnerLogo {...partner} />
              </MotionBox>
            ))}
          </SimpleGrid>

          {/* Coming Soon Box */}
          <MotionFlex
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            mt={{ base: 4, md: 8 }}
            p={{ base: 4, md: 6 }}
            bg="rgba(255, 255, 255, 0.05)"
            borderRadius="xl"
            border="1px dashed rgba(0, 198, 224, 0.3)"
            direction="column"
            align="center"
            justify="center"
            w="full"
            maxW={{ base: "full", md: "md" }}
            mx="auto"
          >
            <Text 
              color="whiteAlpha.800" 
              fontSize={{ base: "xs", md: "sm" }}
              textAlign="center"
            >
              More coming soon! We're continuously expanding our integration partners.
            </Text>
          </MotionFlex>
        </VStack>
      </Container>
    </Box>
  );
};

export default IntegrationPartners;