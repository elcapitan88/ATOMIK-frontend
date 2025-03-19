import React, { useState, useEffect } from 'react';
import { Box, Flex, Button, IconButton, useDisclosure, VStack, HStack, Text, Link, Image } from '@chakra-ui/react';
import { Menu, X } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { isOpen, onToggle } = useDisclosure();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-to-use' },
    { label: 'Security', href: '#security' },
    { label: 'Pricing', href: '/pricing' },
  ];

  return (
    <Box
      as="nav"
      position="fixed"
      w="full"
      zIndex={1000}
      transition="all 0.3s"
      bg={scrolled ? "rgba(0, 0, 0, 0.8)" : "transparent"}
      backdropFilter={scrolled ? "blur(10px)" : "none"}
      borderBottom={scrolled ? "1px solid rgba(255, 255, 255, 0.1)" : "none"}
    >
      <Flex
        maxW="7xl"
        mx="auto"
        px={4}
        py={4}
        align="center"
        justify="space-between"
      >
        {/* Logo */}
        <RouterLink to="/">
          <Image
            src="/logos/atomik-logo.svg" 
            alt="AtomikTrading Logo"
            height="36px"
            maxWidth="180px"
            objectFit="contain"
            transition="transform 0.2s"
            _hover={{ transform: "scale(1.05)" }}
            fallback={<Text fontSize="xl" fontWeight="bold" color="white">AtomikTrading</Text>}
          />
        </RouterLink>

        {/* Desktop Navigation */}
        <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              color="whiteAlpha.900"
              fontSize="sm"
              fontWeight="medium"
              _hover={{ color: "rgba(0, 198, 224, 1)" }}
              transition="color 0.2s"
            >
              {item.label}
            </Link>
          ))}
        </HStack>

        {/* CTA Buttons */}
        <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
          <RouterLink to="/auth">
            <Button
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
            >
              Sign In
            </Button>
          </RouterLink>
          <RouterLink to="/pricing">
            <Button
              bg="transparent"
              color="white"
              fontWeight="medium"
              borderWidth={1}
              borderColor="rgba(0, 198, 224, 1)"
              _hover={{ bg: 'whiteAlpha.100' }}
            >
              Get Started
            </Button>
          </RouterLink>
        </HStack>

        {/* Mobile Menu Button */}
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onToggle}
          icon={isOpen ? <X size={24} /> : <Menu size={24} />}
          variant="ghost"
          color="white"
          _hover={{ bg: 'whiteAlpha.200' }}
          aria-label="Toggle Menu"
        />
      </Flex>

      {/* Mobile Menu */}
      <MotionBox
        display={{ base: 'block', md: 'none' }}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={{
          open: { opacity: 1, height: 'auto' },
          closed: { opacity: 0, height: 0 }
        }}
        transition={{ duration: 0.2 }}
        bg="rgba(0, 0, 0, 0.95)"
        backdropFilter="blur(10px)"
        overflow="hidden"
      >
        <VStack spacing={4} p={4}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              w="full"
              textAlign="center"
              py={2}
              color="white"
              fontSize="sm"
              fontWeight="medium"
              _hover={{ color: "rgba(0, 198, 224, 1)" }}
              onClick={onToggle}
            >
              {item.label}
            </Link>
          ))}
          <VStack spacing={2} w="full" pt={4} borderTop="1px solid" borderColor="whiteAlpha.200">
            <RouterLink to="/auth" style={{ width: '100%' }}>
              <Button w="full" variant="ghost" color="white">
                Sign In
              </Button>
            </RouterLink>
            <RouterLink to="/pricing" style={{ width: '100%' }}>
              <Button
                w="full"
                bg="transparent"
                color="white"
                fontWeight="medium"
                borderWidth={1}
                borderColor="rgba(0, 198, 224, 1)"
                _hover={{ bg: 'whiteAlpha.100' }}
              >
                Get Started
              </Button>
            </RouterLink>
          </VStack>
        </VStack>
      </MotionBox>
    </Box>
  );
};

export default Navbar;