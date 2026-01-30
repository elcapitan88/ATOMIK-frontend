import React from 'react';
import {
  Box,
  Container,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Icon,
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

const FooterLink = ({ label, href }) => (
  <Box
    as="a"
    href={href}
    color="whiteAlpha.600"
    _hover={{ color: "rgba(0, 198, 224, 1)" }}
    fontSize="sm"
    transition="color 0.2s"
    py={1}
  >
    {label}
  </Box>
);

const Footer = () => {
  const allLinks = [
    { label: "How to Automate Trading", href: "#how-to-use", group: "Automation" },
    { label: "TradingView Integration", href: "#features", group: "Automation" },
    { label: "Beginner's Guide", href: "https://atomiktrading.io/docs/blog/automated-trading-beginners-guide", group: "Automation" },
    { label: "Prop Trading Support", href: "#features", group: "Automation" },
    { label: "Pricing", href: "/pricing", group: "Product" },
    { label: "Security", href: "#security", group: "Product" },
    { label: "Contact", href: `mailto:${encodeURIComponent('support@atomiktrading.io')}?subject=${encodeURIComponent('[AtomikTrading Support]')}`, group: "Company" },
    { label: "Documentation", href: "https://atomiktrading.io/docs/", group: "Company" },
    { label: "Privacy Policy", href: "https://atomiktrading.io/docs/legal/privacy-policy", group: "Legal" },
    { label: "Terms of Service", href: "https://atomiktrading.io/docs/legal/terms-of-service", group: "Legal" }
  ];

  const socialLinks = [
    { label: 'X.com', icon: XIcon, href: 'https://x.com/atomiktrades' },
    { label: 'YouTube', icon: Youtube, href: 'https://www.youtube.com/@AtomikTrading' },
    { label: 'TikTok', icon: TikTokIcon, href: 'https://www.tiktok.com/@atomiktrading' },
    { label: 'Email', icon: Mail, href: `mailto:${encodeURIComponent('support@atomiktrading.io')}?subject=${encodeURIComponent('[AtomikTrading Support]')}` },
  ];

  const groups = ['Automation', 'Product', 'Company', 'Legal'];
  const groupLabels = {
    Automation: 'Automated Trading',
    Product: 'Product',
    Company: 'Company',
    Legal: 'Legal'
  };

  return (
    <Box
      as="footer"
      bg="black"
      color="white"
      borderTop="1px solid rgba(255, 255, 255, 0.06)"
      position="relative"
    >
      {/* Background */}
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(180deg, rgba(0,198,224,0.02) 0%, transparent 100%)"
        pointerEvents="none"
      />

      <Container maxW="7xl" py={{ base: 10, md: 16 }} px={{ base: 4, md: 8 }}>
        {/* Main Footer Content */}
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          mb={{ base: 8, md: 12 }}
        >
          {/* Brand Column */}
          <Box
            mb={{ base: 8, md: 0 }}
            maxW={{ base: "full", md: "280px" }}
            textAlign={{ base: "center", md: "left" }}
          >
            <RouterLink to="/">
              <Box mb={4} display="flex" justifyContent={{ base: "center", md: "flex-start" }}>
                <Image
                  src="/logos/atomik-logo.svg"
                  alt="Atomik Trading"
                  height="32px"
                  width="160px"
                  maxWidth="160px"
                  objectFit="contain"
                  transition="opacity 0.2s"
                  _hover={{ opacity: 0.8 }}
                />
              </Box>
            </RouterLink>
            <Text color="whiteAlpha.500" mb={5} fontSize="sm" lineHeight="1.7">
              Automated trading for every trader. No code required.
            </Text>

            {/* Social Icons */}
            <HStack
              spacing={3}
              justify={{ base: "center", md: "flex-start" }}
            >
              {socialLinks.map((social) => (
                <Box
                  key={social.label}
                  as="a"
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  w="36px"
                  h="36px"
                  borderRadius="lg"
                  bg="rgba(255, 255, 255, 0.04)"
                  border="1px solid rgba(255, 255, 255, 0.08)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="whiteAlpha.600"
                  transition="all 0.2s"
                  _hover={{
                    color: 'rgba(0, 198, 224, 1)',
                    bg: 'rgba(0, 198, 224, 0.08)',
                    borderColor: 'rgba(0, 198, 224, 0.2)',
                  }}
                  aria-label={social.label}
                >
                  <Icon as={social.icon} boxSize={4} />
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
            {groups.map((group) => (
              <VStack key={group} align="flex-start" spacing={3}>
                <Text
                  fontWeight="500"
                  fontSize="sm"
                  color="whiteAlpha.500"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  mb={1}
                >
                  {groupLabels[group]}
                </Text>
                {allLinks.filter(link => link.group === group).map(link => (
                  <FooterLink key={link.label} {...link} />
                ))}
              </VStack>
            ))}
          </SimpleGrid>

          {/* Mobile Footer Links */}
          <VStack
            display={{ base: 'flex', md: 'none' }}
            spacing={6}
            w="full"
          >
            {groups.map((group) => (
              <VStack key={group} spacing={2} w="full" align="center">
                <Text
                  fontWeight="500"
                  fontSize="xs"
                  color="whiteAlpha.400"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                >
                  {groupLabels[group]}
                </Text>
                <HStack spacing={4} flexWrap="wrap" justify="center">
                  {allLinks.filter(link => link.group === group).map(link => (
                    <FooterLink key={link.label} {...link} />
                  ))}
                </HStack>
              </VStack>
            ))}
          </VStack>
        </Flex>

        {/* Divider */}
        <Box h="1px" bg="rgba(255, 255, 255, 0.06)" mb={6} />

        {/* Risk Disclaimer */}
        <Box mb={6} px={{ base: 0, md: 4 }}>
          <VStack spacing={2}>
            <Text
              color="whiteAlpha.500"
              fontSize="xs"
              textAlign="center"
              lineHeight="1.8"
            >
              Atomik Trading is a trade automation platform that enables users to connect alerts from TradingView and other signal sources to their brokerage or exchange accounts. Atomik Trading does not generate signals, provide research or analysis, or offer trading advice of any kind. Our platform is built to help traders execute their own strategies using their own alerts — we do not recommend any securities, manage portfolios, or make trading decisions on your behalf.
            </Text>
            <Text
              color="whiteAlpha.500"
              fontSize="xs"
              textAlign="center"
              lineHeight="1.8"
            >
              Trading futures, options, cryptocurrency, and other leveraged products involves substantial risk of loss and is not appropriate for everyone. Past performance is not indicative of future results. All platform features, tools, and capabilities are provided as-is and without warranty. Only trade with capital you are prepared to lose. Consult a qualified financial advisor before making any investment decisions.
            </Text>
          </VStack>
        </Box>

        {/* Trademark Attributions */}
        <Box mt={4} mb={6} px={{ base: 0, md: 4 }}>
          <VStack spacing={1}>
            <Text color="whiteAlpha.300" fontSize="10px" textAlign="center" lineHeight="1.7">
              Tradovate, the Tradovate logo, and Tradovate.com are registered trademarks and/or properties of Tradovate Holdings LLC, Tradovate Technologies LLC, Tradovate LLC, and/or their affiliates.
            </Text>
            <Text color="whiteAlpha.300" fontSize="10px" textAlign="center" lineHeight="1.7">
              NinjaTrader, NinjaTrader.com, and associated names are registered trademarks and property of NinjaTrader Group, LLC, NinjaTrader Clearing, LLC, and/or their affiliates.
            </Text>
            <Text color="whiteAlpha.300" fontSize="10px" textAlign="center" lineHeight="1.7">
              TradingView and the TradingView logo are registered trademarks of TradingView, Inc. and/or MultiCharts LLC.
            </Text>
            <Text color="whiteAlpha.300" fontSize="10px" textAlign="center" lineHeight="1.7">
              Binance, the Binance logo, and Binance.com are registered trademarks of Binance Holdings Ltd. and/or its affiliates.
            </Text>
            <Text color="whiteAlpha.300" fontSize="10px" textAlign="center" lineHeight="1.7">
              Apex Trader Funding and the Apex logo are trademarks of Apex Trader Funding, LLC and/or its affiliates.
            </Text>
            <Text color="whiteAlpha.300" fontSize="10px" textAlign="center" lineHeight="1.7" pt={1}>
              All other trademarks, logos, and brand names are the property of their respective owners. Atomik Trading is not affiliated with, endorsed by, or sponsored by any of the above entities.
            </Text>
          </VStack>
        </Box>

        {/* Bottom Bar */}
        <Box h="1px" bg="rgba(255, 255, 255, 0.04)" mb={5} />

        <Flex
          direction={{ base: 'column', sm: 'row' }}
          justify="space-between"
          align="center"
          gap={4}
        >
          <Text
            color="whiteAlpha.400"
            fontSize="xs"
            textAlign={{ base: 'center', sm: 'left' }}
            order={{ base: 2, sm: 1 }}
          >
            &copy; {new Date().getFullYear()} Atomik Trading. All rights reserved.
          </Text>

          {/* Status Badge */}
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
