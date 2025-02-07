import React from 'react';
import {
  Box,
  Container,
  SimpleGrid,
  Stack,
  Text,
  Input,
  Button,
  VStack,
  HStack,
  Divider,
  Icon,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { Twitter, Github, Linkedin, Mail, Send } from 'lucide-react';

const Footer = () => {
  const productLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Security', href: '#security' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Resources', href: '#resources' },
  ];

  const companyLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Partners', href: '/partners' },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Data Protection', href: '/data-protection' },
  ];

  const socialLinks = [
    { label: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
    { label: 'GitHub', icon: Github, href: 'https://github.com' },
    { label: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
    { label: 'Email', icon: Mail, href: 'mailto:contact@example.com' },
  ];

  return (
    <Box
      as="footer"
      bg="black"
      color="white"
      borderTop="1px solid"
      borderColor="whiteAlpha.200"
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
        bg="linear-gradient(180deg, rgba(0,198,224,0.03) 0%, rgba(0,0,0,0) 100%)"
        pointerEvents="none"
      />

      <Container maxW="7xl" py={16} px={{ base: 4, md: 8 }} position="relative">
        <SimpleGrid
          templateColumns={{ base: '1fr', md: '2fr 1fr 1fr 1fr' }}
          spacing={8}
          mb={12}
        >
          {/* Company Info & Newsletter */}
          <VStack align="flex-start" spacing={6}>
            <RouterLink to="/">
              <Text fontSize="2xl" fontWeight="bold">
                AutoTrade
              </Text>
            </RouterLink>
            <Text color="whiteAlpha.800">
              Professional-grade webhook-based trading automation platform. Connect your favorite broker and automate your trading strategies with ease.
            </Text>
            <VStack align="flex-start" spacing={4} w="full">
              <Text fontWeight="medium">Subscribe to our newsletter</Text>
              <HStack w="full">
                <Input
                  placeholder="Enter your email"
                  bg="whiteAlpha.100"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  _hover={{ borderColor: "whiteAlpha.300" }}
                  _focus={{
                    borderColor: "rgba(0, 198, 224, 0.6)",
                    boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
                  }}
                />
                <Button
                  bg="rgba(0, 198, 224, 1)"
                  _hover={{ bg: "rgba(0, 198, 224, 0.8)" }}
                  leftIcon={<Send size={16} />}
                >
                  Subscribe
                </Button>
              </HStack>
            </VStack>
          </VStack>

          {/* Product Links */}
          <VStack align="flex-start" spacing={4}>
            <Text fontWeight="medium" fontSize="lg">Product</Text>
            {productLinks.map((link) => (
              <Box
                key={link.label}
                as="a"
                href={link.href}
                color="whiteAlpha.800"
                _hover={{ color: "rgba(0, 198, 224, 1)" }}
                fontSize="sm"
              >
                {link.label}
              </Box>
            ))}
          </VStack>

          {/* Company Links */}
          <VStack align="flex-start" spacing={4}>
            <Text fontWeight="medium" fontSize="lg">Company</Text>
            {companyLinks.map((link) => (
              <Box
                key={link.label}
                as="a"
                href={link.href}
                color="whiteAlpha.800"
                _hover={{ color: "rgba(0, 198, 224, 1)" }}
                fontSize="sm"
              >
                {link.label}
              </Box>
            ))}
          </VStack>

          {/* Legal Links */}
          <VStack align="flex-start" spacing={4}>
            <Text fontWeight="medium" fontSize="lg">Legal</Text>
            {legalLinks.map((link) => (
              <Box
                key={link.label}
                as="a"
                href={link.href}
                color="whiteAlpha.800"
                _hover={{ color: "rgba(0, 198, 224, 1)" }}
                fontSize="sm"
              >
                {link.label}
              </Box>
            ))}
          </VStack>
        </SimpleGrid>

        <Divider borderColor="whiteAlpha.200" my={8} />

        {/* Bottom Bar */}
        <Stack
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align="center"
          spacing={4}
        >
          <Text color="whiteAlpha.600" fontSize="sm">
            © {new Date().getFullYear()} AutoTrade. All rights reserved.
          </Text>

          <HStack spacing={4}>
            {socialLinks.map((social) => (
              <Box
                key={social.label}
                as="a"
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                color="whiteAlpha.800"
                _hover={{ color: "rgba(0, 198, 224, 1)" }}
              >
                <Icon as={social.icon} boxSize={5} />
              </Box>
            ))}
          </HStack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;