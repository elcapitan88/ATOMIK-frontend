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
  useBreakpointValue,
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

// Simplified MenuItem with fewer conditionals
const MenuItem = memo(({ icon, item, isSelected, onClick, isExpanded }) => {
  const IconComponent = icon;
  
  return (
    <Flex
      py={2}
      px={3}
      bg={isSelected ? 'rgba(0, 198, 224, 0.1)' : 'transparent'}
      borderLeft="2px solid"
      borderColor={isSelected ? "#00C6E0" : "transparent"}
      borderRadius="md"
      onClick={(e) => {
        e.stopPropagation();
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
      data-nav-item="true"
    >
      {IconComponent && <IconComponent size={16} color="#00C6E0" />}
      {isExpanded && <Text color="white" fontSize="sm">{item}</Text>}
    </Flex>
  );
});

MenuItem.displayName = 'MenuItem';

// Mobile menu item for bottom navigation
const MobileMenuItem = memo(({ icon, item, isSelected, onClick }) => {
  const IconComponent = icon;
  
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      py={1}
      px={2}
      flex="1"
      borderBottom={isSelected ? "2px solid" : "none"}
      borderColor={isSelected ? "#00C6E0" : "transparent"}
      onClick={(e) => {
        e.stopPropagation();
        onClick(item);
      }}
      cursor="pointer"
      data-nav-item="true"
    >
      {IconComponent && <IconComponent size={20} color="#00C6E0" />}
      <Text color="white" fontSize="xs" mt={1}>
        {item}
      </Text>
    </Flex>
  );
});

MobileMenuItem.displayName = 'MobileMenuItem';

const Menu = ({ onSelectItem }) => {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState('Dashboard');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState('User');
  const { isOpen: isSupportOpen, onOpen: onSupportOpen, onClose: onSupportClose } = useDisclosure();
  const menuRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user, logout, isAuthenticated } = useAuth();

  // Use Chakra's breakpoint hook
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    if (user) {
      if (user.username) {
        setDisplayName(user.username);
      } else if (user.full_name) {
        setDisplayName(user.full_name);
      } else if (user.email) {
        const emailName = user.email.split('@')[0];
        setDisplayName(emailName);
      }
    }
  }, [user]);

  // Define menu items
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
    if (e) {
      const clickedElement = e.target;
      const isNavItem = clickedElement.closest('[data-nav-item="true"]');
      const isUserMenu = clickedElement.closest('[data-user-menu="true"]');
      
      if (isNavItem || isUserMenu) {
        return;
      }
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
    e.stopPropagation();
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const openHelpCenter = () => {
    window.open('https://docs.atomiktrading.io', '_blank');
    setIsUserMenuOpen(false);
  };

  const handleSettingsClick = (e) => {
    e.stopPropagation();
    navigate('/settings');
  };

  return (
    <>
      {/* Mobile Menu (Bottom Navigation) */}
      {isMobile && (
        <Flex
          position="fixed"
          left={0}
          bottom={0}
          h="64px"
          w="100%"
          bg="rgba(0, 0, 0, 0.75)"
          backdropFilter="blur(10px)"
          borderTopRadius="xl"
          boxShadow="0 -2px 10px rgba(0, 0, 0, 0.2)"
          zIndex={1000}
          px={2}
          py={1}
          justifyContent="space-between"
          alignItems="center"
        >
          {menuItems.map(({ name, icon }) => (
            <MobileMenuItem
              key={name}
              icon={icon}
              item={name}
              isSelected={selectedItem === name}
              onClick={handleItemClick}
            />
          ))}
          
          <MobileMenuItem
            icon={Settings}
            item="Settings"
            isSelected={location.pathname === '/settings'}
            onClick={handleSettingsClick}
          />
        </Flex>
      )}

      {/* Desktop Menu (Sidebar) */}
      {!isMobile && (
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
          {/* Toggle Button */}
          <Flex justify="flex-end" mb={6}>
            <IconButton
              aria-label={isMenuExpanded ? "Collapse menu" : "Expand menu"}
              icon={isMenuExpanded ? <ChevronLeft size={16} /> : <MenuIcon size={16} />}
              variant="ghost"
              color="#00C6E0"
              _hover={{ bg: "rgba(0, 198, 224, 0.1)" }}
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

          {/* User Profile */}
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
                            {displayName}
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
      )}

      {/* Support Modal */}
      <SupportModal isOpen={isSupportOpen} onClose={onSupportClose} />
    </>
  );
};

export default memo(Menu);