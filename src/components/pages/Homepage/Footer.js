import React from 'react';
import {
  Box,
  Container,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { Mail, Youtube } from 'lucide-react';

// Custom X (formerly Twitter) icon component
const XIcon = ({ size = 24, ...props }) => (
  <Icon viewBox="0 0 24 24" width={size} height={size} {...props}>
    <path
      fill="currentColor"
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
    />
  </Icon>
);

// Custom TikTok icon component
const TikTokIcon = ({ size = 24, ...props }) => (
  <Icon viewBox="0 0 24 24" width={size} height={size} {...props}>
    <path
      fill="currentColor"
      d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64c0 3.33 2.76 5.7 5.69 5.7c3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"
    />
  </Icon>
);

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
    { label: 'Privacy Policy', href: 'https://atomiktrading.io/docs/legal/privacy-policy' },
    { label: 'Terms of Service', href: 'https://atomiktrading.io/docs/legal/terms-of-service' },
    { label: 'Cookie Policy', href: 'https://atomiktrading.io/docs/legal/cookie-policy' },
    { label: 'Data Protection', href: '/data-protection' },
  ];

  const socialLinks = [
    { label: 'X.com', icon: XIcon, href: 'https://x.com/atomiktrades' },
    { label: 'YouTube', icon: Youtube, href: 'https://www.youtube.com/@AtomikTrading' },
    { label: 'TikTok', icon: TikTokIcon, href: 'https://www.tiktok.com/@atomiktrading' },
    { label: 'Email', icon: Mail, href: `mailto:${encodeURIComponent('support@atomiktrading.io')}?subject=${encodeURIComponent('[AtomikTrading Support]')}`},
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
          {/* Company Info */}
          <VStack align="flex-start" spacing={6}>
            <RouterLink to="/">
              <Text fontSize="2xl" fontWeight="bold">
                AtomikTrading
              </Text>
            </RouterLink>
            <Text color="whiteAlpha.800">
              Professional-grade webhook-based trading automation platform. Connect your favorite broker and automate your trading strategies with ease.
            </Text>
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

        <Box 
          borderTop="1px solid" 
          borderColor="whiteAlpha.200" 
          pt={8}
        >
          {/* Bottom Bar */}
          <Stack
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align="center"
            spacing={4}
          >
            <Text color="whiteAlpha.600" fontSize="sm">
              © {new Date().getFullYear()} AtomikTrading. All rights reserved.
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
                  transition="color 0.2s"
                >
                  <Icon as={social.icon} boxSize={5} />
                </Box>
              ))}
            </HStack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;