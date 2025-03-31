import React, { useState, memo, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  Text,
  Flex,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  useToast,
  useDisclosure,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Settings,
  HelpCircle,
  LifeBuoy,
  LogOut,
  ChevronDown,
  User,
  LayoutDashboard,
  Wand2,
  Store,
  Menu as MenuIcon,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SupportModal from '../../common/Modal/SupportModal';

const MenuItem = memo(({ icon: Icon, item, isSelected, onClick, isExpanded }) => (
  <Tooltip label={!isExpanded ? item : ""} placement="right" hasArrow isDisabled={isExpanded}>
    <Flex
      py={2}
      px={3}
      bg={isSelected ? 'rgba(0, 198, 224, 0.1)' : 'transparent'}
      borderLeft="2px solid"
      borderColor={isSelected ? "#00C6E0" : "transparent"}
      borderRadius="md"
      onClick={(e) => {
        e.stopPropagation(); // Prevent menu toggle
        onClick(item);
      }}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        bg: 'rgba(0, 198, 224, 0.05)',
        borderColor: isSelected ? "#00C6E0" : "rgba(0, 198, 224, 0.3)"
      }}
      align="center"
      gap={3}
      mb={2}
      justify={isExpanded ? "flex-start" : "center"}
      data-nav-item="true" // Add a data attribute to identify nav items
    >
      {Icon && <Icon size={16} color="#00C6E0" />}
      {isExpanded && <Text color="white" fontSize="sm">{item}</Text>}
    </Flex>
  </Tooltip>
));

MenuItem.displayName = 'MenuItem';

const Menu = ({ onSelectItem }) => {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState('Dashboard');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isOpen: isSupportOpen, onOpen: onSupportOpen, onClose: onSupportClose } = useDisclosure();
  const menuRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user, logout, isAuthenticated } = useAuth();

  // Define menu items with their actions
  const menuItems = [
    { 
      name: 'Dashboard', 
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    { 
      name: 'Strategy Builder', 
      icon: Wand2,
      path: '/strategy-builder'
    },
    { 
      name: 'Marketplace', 
      icon: Store,
      path: '/marketplace'
    }
  ];

  const toggleMenu = (e) => {
    // Only toggle if clicking the menu background (not on a menu item or user profile)
    if (e) {
      // Get the element that was actually clicked
      const clickedElement = e.target;
      
      // Check if the click was on or inside an element with certain data attributes
      // that should not trigger the toggle
      const isNavItem = clickedElement.closest('[data-nav-item="true"]');
      const isUserMenu = clickedElement.closest('[data-user-menu="true"]');
      const isToggleButton = clickedElement.closest('[data-toggle-button="true"]');
      
      // If clicked on a menu item or user menu, don't toggle
      if (isNavItem || isUserMenu) {
        return;
      }
      
      // If it's a toggle button click, let the handler complete without return
    }
    
    setIsMenuExpanded(!isMenuExpanded);
  };

  const handleItemClick = (item) => {
    const menuItem = menuItems.find(i => i.name === item);
    if (menuItem) {
      setSelectedItem(item);
      if (onSelectItem) onSelectItem(item);
      navigate(menuItem.path);
    }
  };

  // Update selected item based on current location
  useEffect(() => {
    const path = location.pathname;
    const menuItem = menuItems.find(item => item.path === path);
    if (menuItem) {
      setSelectedItem(menuItem.name);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSupportClick = () => {
    setIsUserMenuOpen(false);
    onSupportOpen();
  };

  const handleUserMenuClick = (e) => {
    e.stopPropagation(); // Prevent menu toggle
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Function to handle opening Help Center - fixed to not rely on event parameter
  const openHelpCenter = () => {
    // Open help center URL in a new tab
    window.open('https://docs.atomiktrading.io', '_blank');
    // Close the user menu after clicking
    setIsUserMenuOpen(false);
  };

  return (
    <>
      <Flex
        position="fixed"
        left={0}
        top={0}
        h="100vh"
        w={isMenuExpanded ? "200px" : "64px"}
        transition="all 0.3s ease-in-out"
        borderRightRadius="lg"
        flexDirection="column"
        zIndex={1000}
        bg="rgba(0, 0, 0, 0.75)"
        backdropFilter="blur(10px)"
        boxShadow="0 0 20px rgba(0, 198, 224, 0.15)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        role="navigation"
        aria-label="Main Navigation"
        px={3}
        py={4}
        onClick={toggleMenu}
        ref={menuRef}
        cursor="pointer"
      >
        {/* Menu toggle button - visible but functionality handled by container */}
        <Flex justify="flex-end" mb={6}>
          <IconButton
            aria-label={isMenuExpanded ? "Collapse menu" : "Expand menu"}
            icon={isMenuExpanded ? <ChevronLeft size={16} /> : <MenuIcon size={16} />}
            variant="ghost"
            color="#00C6E0"
            _hover={{ bg: "rgba(0, 198, 224, 0.1)" }}
            // We'll keep the onClick handler here for UX clarity, but it's redundant
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu();
            }}
            size="sm"
            data-toggle-button="true"
          />
        </Flex>

        {/* Menu Items */}
        <VStack spacing={1} align="stretch" mt={2}>
          {menuItems.map(({ name, icon }) => (
            <MenuItem
              key={name}
              icon={icon}
              item={name}
              isSelected={selectedItem === name}
              onClick={handleItemClick}
              isExpanded={isMenuExpanded}
            />
          ))}
        </VStack>

        {/* User Profile Section */}
        {isAuthenticated && (
          <Box mt="auto" width="100%" px={1}>
            <Popover 
              placement="top-start" 
              isLazy 
              isOpen={isUserMenuOpen}
              onClose={() => setIsUserMenuOpen(false)}
              closeOnBlur={true}
            >
              <PopoverTrigger>
                <Flex
                  p={3}
                  borderRadius="md"
                  cursor="pointer"
                  align="center"
                  bg="rgba(0, 0, 0, 0.4)"
                  _hover={{ bg: "rgba(0, 0, 0, 0.6)" }}
                  // No border here
                  onClick={handleUserMenuClick}
                  height="48px"
                  position="relative"
                  role="button"
                  aria-label="User Menu"
                  justify={isMenuExpanded ? "space-between" : "center"}
                  data-user-menu="true"
                >
                  <Flex align="center">
                    <Flex
                      w="32px"
                      h="32px"
                      borderRadius="full"
                      bg="rgba(0, 198, 224, 0.2)"
                      border="2px solid rgba(0, 198, 224, 0.5)"
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      <User size={16} color="rgba(0, 198, 224, 1)" />
                    </Flex>
                    
                    {isMenuExpanded && (
                      <Box ml={3} maxW="100px">
                        <Text fontSize="xs" color="white" noOfLines={1}>
                          {user?.username || 'User'}
                        </Text>
                      </Box>
                    )}
                  </Flex>
                  
                  {isMenuExpanded && (
                    <ChevronDown 
                      size={16} 
                      color="white" 
                      style={{ 
                        opacity: 0.6,
                        transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                  )}
                </Flex>
              </PopoverTrigger>

              <PopoverContent
                bg="rgba(0, 0, 0, 0.8)"
                borderColor="rgba(255, 255, 255, 0.1)"
                backdropFilter="blur(10px)"
                boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.2)"
                _focus={{ boxShadow: "none" }}
                width="200px"
                onClick={(e) => e.stopPropagation()} // Prevent menu toggle
              >
                <PopoverHeader borderBottomWidth="1px" borderColor="whiteAlpha.200" p={3}>
                  <Text 
                    fontSize="xs" 
                    color="whiteAlpha.600" 
                    textAlign="center"
                  >
                    Pro plan
                  </Text>
                </PopoverHeader>
                <PopoverBody p={2}>
                  <VStack spacing={1} align="stretch">
                    <MenuItem 
                      icon={Settings} 
                      item="Settings" 
                      onClick={() => navigate('/settings')} 
                      isExpanded={true}
                    />
                    <MenuItem 
                      icon={HelpCircle} 
                      item="Help Center" 
                      onClick={openHelpCenter} 
                      isExpanded={true}
                    />
                    <MenuItem 
                      icon={LifeBuoy} 
                      item="Get Support" 
                      onClick={handleSupportClick} 
                      isExpanded={true}
                    />
                    <Box my={2} h="1px" bg="whiteAlpha.200" />
                    <MenuItem 
                      icon={LogOut} 
                      item="Log Out" 
                      onClick={handleLogout} 
                      isExpanded={true}
                    />
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </Box>
        )}
      </Flex>

      {/* Support Modal */}
      <SupportModal isOpen={isSupportOpen} onClose={onSupportClose} />
    </>
  );
};

export default memo(Menu);