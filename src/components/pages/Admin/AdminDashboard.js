import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  VStack,
  Heading,
  Text,
  HStack,
  IconButton,
  useBreakpointValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useDisclosure,
  Divider
} from '@chakra-ui/react';
import {
  LayoutDashboard,
  Users,
  Webhook,
  BarChart2,
  Settings,
  ShieldCheck,
  Menu as MenuIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Admin navigation link component
const NavItem = ({ icon, label, active, onClick }) => {
  const Icon = icon;
  
  return (
    <Flex
      align="center"
      p={3}
      mb={2}
      borderRadius="md"
      cursor="pointer"
      bg={active ? "rgba(0, 198, 224, 0.1)" : "transparent"}
      color={active ? "#00C6E0" : "white"}
      _hover={{ bg: "rgba(0, 198, 224, 0.05)" }}
      onClick={onClick}
    >
      <Icon size={18} />
      <Text ml={3} fontWeight={active ? "semibold" : "normal"}>
        {label}
      </Text>
    </Flex>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Determine active route
  const getActiveRoute = () => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/webhooks')) return 'webhooks';
    if (path.includes('/admin/analytics')) return 'analytics';
    if (path.includes('/admin/roles')) return 'roles';
    if (path.includes('/admin/settings')) return 'settings';
    return 'overview';
  };
  
  const activeRoute = getActiveRoute();
  
  // Navigation items
  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', route: 'overview' },
    { icon: Users, label: 'Users', route: 'users' },
    { icon: Webhook, label: 'Webhooks', route: 'webhooks' },
    { icon: BarChart2, label: 'Analytics', route: 'analytics' },
    { icon: ShieldCheck, label: 'Roles', route: 'roles' },
    { icon: Settings, label: 'Settings', route: 'settings' }
  ];
  
  // Handle navigation
  const handleNavigation = (route) => {
    navigate(`/admin/${route}`);
    if (isOpen) onClose();
  };
  
  // Responsive adjustments
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const sidebarWidth = useBreakpointValue({ base: "full", md: "280px" });
  
  // Sidebar content (used in both desktop and mobile views)
  const SidebarContent = () => (
    <VStack spacing={4} align="stretch" py={6} px={4} w="full">
      <Heading size="md" color="white" mb={4}>Admin Dashboard</Heading>
      
      {user && (
        <Box mb={6}>
          <Text fontSize="sm" color="whiteAlpha.600">Logged in as</Text>
          <Text color="white" fontWeight="medium">{user.username || user.email}</Text>
        </Box>
      )}
      
      <Divider mb={4} borderColor="whiteAlpha.200" />
      
      {navItems.map((item) => (
        <NavItem
          key={item.route}
          icon={item.icon}
          label={item.label}
          active={activeRoute === item.route}
          onClick={() => handleNavigation(item.route)}
        />
      ))}
    </VStack>
  );
  
  return (
    <Flex
      minH="100vh"
      bg="background"
      color="text.primary"
      fontFamily="body"
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Box
          w="280px"
          h="100vh"
          bg="rgba(0, 0, 0, 0.8)"
          backdropFilter="blur(10px)"
          position="fixed"
          left={0}
          top={0}
          boxShadow="lg"
          borderRight="1px solid"
          borderColor="whiteAlpha.200"
          overflowY="auto"
        >
          <SidebarContent />
        </Box>
      )}
      
      {/* Mobile Drawer */}
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        size="full"
      >
        <DrawerOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
        <DrawerContent bg="rgba(0, 0, 0, 0.9)" backdropFilter="blur(10px)">
          <DrawerCloseButton color="white" />
          <DrawerBody p={0}>
            <SidebarContent />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      
      {/* Main Content */}
      <Box
        flex="1"
        ml={{ base: 0, lg: "280px" }}
        transition="all 0.3s"
      >
        {/* Mobile Header */}
        {isMobile && (
          <Flex
            w="full"
            h="64px"
            bg="rgba(0, 0, 0, 0.8)"
            backdropFilter="blur(10px)"
            borderBottom="1px solid"
            borderColor="whiteAlpha.200"
            align="center"
            px={4}
            position="sticky"
            top={0}
            zIndex={10}
          >
            <IconButton
              icon={<MenuIcon size={24} />}
              variant="ghost"
              color="white"
              onClick={onOpen}
              aria-label="Open Menu"
            />
            <Heading size="md" ml={4} color="white">Admin</Heading>
          </Flex>
        )}
        
        {/* Page Content */}
        <Box p={{ base: 4, md: 6 }} pt={{ base: 4, md: 6 }}>
          <Outlet />
        </Box>
      </Box>
    </Flex>
  );
};

export default AdminDashboard;