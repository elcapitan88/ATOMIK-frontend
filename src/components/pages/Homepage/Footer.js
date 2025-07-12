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
  Divider,
  Flex,
  Image
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

// A simple footer link component
const FooterLink = ({ label, href }) => (
  <Box
    as="a"
    href={href}
    color="whiteAlpha.800"
    _hover={{ color: "rgba(0, 198, 224, 1)" }}
    fontSize={{ base: "xs", md: "sm" }}
    transition="color 0.2s"
    py={{ base: 1, md: 1.5 }}
  >
    {label}
  </Box>
);

const Footer = () => {
  // Organize all links into a single array for mobile
  const allLinks = [
    { 
      label: "How to Automate Trading", 
      href: "#how-to-use", 
      group: "Automation" 
    },
    { 
      label: "TradingView Integration", 
      href: "#features", 
      group: "Automation" 
    },
    { 
      label: "Beginner's Guide", 
      href: "https://atomiktrading.io/docs/blog/automated-trading-beginners-guide", 
      group: "Automation" 
    },
    { 
      label: "Prop Trading Support", 
      href: "#features", 
      group: "Automation" 
    },
    { 
      label: "Pricing", 
      href: "/pricing", 
      group: "Product" 
    },
    { 
      label: "Security", 
      href: "#security", 
      group: "Product" 
    },
    { 
      label: "Contact", 
      href: `mailto:${encodeURIComponent('support@atomiktrading.io')}?subject=${encodeURIComponent('[AtomikTrading Support]')}`,
      group: "Company"
    },
    { 
      label: "Documentation", 
      href: "https://atomiktrading.io/docs/", 
      group: "Company" 
    },
    { 
      label: "Privacy Policy", 
      href: "https://atomiktrading.io/docs/legal/privacy-policy", 
      group: "Legal" 
    },
    { 
      label: "Terms of Service", 
      href: "https://atomiktrading.io/docs/legal/terms-of-service", 
      group: "Legal" 
    }
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

      <Container maxW="7xl" py={{ base: 10, md: 16 }} px={{ base: 4, md: 8 }}>
        {/* Main Footer Content */}
        <Flex 
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          mb={{ base: 8, md: 12 }}
        >
          {/* Company Info */}
          <Box 
            mb={{ base: 8, md: 0 }} 
            maxW={{ base: "full", md: "350px" }}
            textAlign={{ base: "center", md: "left" }}
          >
            <RouterLink to="/">
              <Text fontSize="2xl" fontWeight="bold" mb={3}>
                AtomikTrading
              </Text>
            </RouterLink>
            <Text color="whiteAlpha.800" mb={4} fontSize={{ base: "sm", md: "md" }}>
              Learn how to automate your trading with TradingView alerts. Perfect for beginners and prop traders. No coding required - start your automated trading journey today.
            </Text>
            
            {/* Social Links */}
            <HStack 
              spacing={4} 
              mb={{ base: 2, md: 0 }}
              justify={{ base: "center", md: "flex-start" }}
            >
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
          </Box>

          {/* Desktop Footer Links */}
          <SimpleGrid 
            display={{ base: 'none', md: 'grid' }}
            columns={4} 
            spacing={8}
          >
            {/* Automation Links */}
            <VStack align="flex-start" spacing={3}>
              <Text fontWeight="medium" fontSize="md" mb={1} color="rgba(0, 198, 224, 1)">
                Automated Trading
              </Text>
              {allLinks.filter(link => link.group === "Automation").map(link => (
                <FooterLink key={link.label} {...link} />
              ))}
            </VStack>

            {/* Product Links */}
            <VStack align="flex-start" spacing={3}>
              <Text fontWeight="medium" fontSize="md" mb={1}>
                Product
              </Text>
              {allLinks.filter(link => link.group === "Product").map(link => (
                <FooterLink key={link.label} {...link} />
              ))}
            </VStack>

            {/* Company Links */}
            <VStack align="flex-start" spacing={3}>
              <Text fontWeight="medium" fontSize="md" mb={1}>
                Company
              </Text>
              {allLinks.filter(link => link.group === "Company").map(link => (
                <FooterLink key={link.label} {...link} />
              ))}
            </VStack>

            {/* Legal Links */}
            <VStack align="flex-start" spacing={3}>
              <Text fontWeight="medium" fontSize="md" mb={1}>
                Legal
              </Text>
              {allLinks.filter(link => link.group === "Legal").map(link => (
                <FooterLink key={link.label} {...link} />
              ))}
            </VStack>
          </SimpleGrid>

          {/* Mobile Footer Links - Simple 2-column grid without collapsible sections */}
          <SimpleGrid 
            display={{ base: 'grid', md: 'none' }}
            columns={2} 
            spacing={3}
            w="full"
            justifyItems="center"
            textAlign="center"
          >
            {allLinks.map(link => (
              <FooterLink key={link.label} {...link} />
            ))}
          </SimpleGrid>
        </Flex>

        {/* Divider */}
        <Divider borderColor="whiteAlpha.200" mb={6} />

        {/* Bottom Bar - Simple layout with status badge */}
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          justify="space-between"
          align={{ base: 'center', sm: 'center' }}
          wrap="wrap"
          gap={4}
        >
          <Text 
            color="whiteAlpha.600" 
            fontSize="xs" 
            textAlign={{ base: 'center', sm: 'left' }}
            order={{ base: 2, sm: 1 }}
          >
            © {new Date().getFullYear()} AtomikTrading. All rights reserved.
          </Text>

          {/* Status Badge - Hidden on very small screens */}
          <Box 
            order={{ base: 1, sm: 2 }}
            maxW={{ base: "200px", sm: "250px" }}
            h="30px"
            overflow="hidden"
          >
            <iframe 
              src="https://status.atomiktrading.io/badge?theme=dark" 
              width="100%" 
              height="30" 
              frameBorder="0" 
              scrolling="no" 
              title="Service Status"
            />
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default Footer;