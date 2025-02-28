import React, { useState, memo, useEffect } from 'react';
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
  Store
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SupportModal from '../modals/SupportModal';

const MenuItem = memo(({ icon: Icon, item, isSelected, onClick }) => (
  <Flex
    py={2}
    px={3}
    bg={isSelected ? 'whiteAlpha.200' : 'transparent'}
    borderRadius="md"
    onClick={() => onClick(item)}
    cursor="pointer"
    transition="all 0.2s"
    _hover={{
      bg: isSelected ? 'whiteAlpha.200' : 'whiteAlpha.100'
    }}
    align="center"
    gap={3}
  >
    {Icon && <Icon size={16} color="white" />}
    <Text color="white" fontSize="sm">{item}</Text>
  </Flex>
));

MenuItem.displayName = 'MenuItem';

const Menu = ({ onSelectItem }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState('Dashboard');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isOpen: isSupportOpen, onOpen: onSupportOpen, onClose: onSupportClose } = useDisclosure();
  
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

  const handleItemClick = (item) => {
    const menuItem = menuItems.find(i => i.name === item);
    if (menuItem) {
      setSelectedItem(item);
      if (onSelectItem) onSelectItem(item);
      navigate(menuItem.path);
    }
  };

  const handleMouseLeave = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
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

  return (
    <>
      <Flex
        position="fixed"
        left={0}
        top={0}
        h="100vh"
        w={isMenuOpen || isUserMenuOpen ? "56" : "16"}
        transition="all 0.3s ease-in-out"
        borderRightRadius="2xl"
        overflow="visible"
        flexDirection="column"
        zIndex={1000}
        bg={isMenuOpen || isUserMenuOpen ? "rgba(255, 255, 255, 0.1)" : "transparent"}
        backdropFilter={isMenuOpen || isUserMenuOpen ? "blur(10px)" : "none"}
        borderRight={(isMenuOpen || isUserMenuOpen) ? "1px solid rgba(255, 255, 255, 0.18)" : "none"}
        onMouseEnter={() => setIsMenuOpen(true)}
        onMouseLeave={handleMouseLeave}
        role="navigation"
        aria-label="Main Navigation"
      >
        <VStack 
          spacing={3} 
          align="stretch" 
          mt={6} 
          p={3}
          opacity={isMenuOpen ? 1 : 0}
          transition="opacity 0.3s ease-in-out"
          visibility={isMenuOpen ? "visible" : "hidden"}
        >
          {menuItems.map(({ name, icon }) => (
            <MenuItem
              key={name}
              icon={icon}
              item={name}
              isSelected={selectedItem === name}
              onClick={handleItemClick}
            />
          ))}
        </VStack>

        {isAuthenticated && (
          <Box position="absolute" bottom="32px" width="100%" px={3}>
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
                  bg={isMenuOpen || isUserMenuOpen ? "whiteAlpha.100" : "transparent"}
                  _hover={{ bg: isMenuOpen || isUserMenuOpen ? "whiteAlpha.200" : "transparent" }}
                  border={isMenuOpen || isUserMenuOpen ? "1px solid" : "none"}
                  borderColor="whiteAlpha.200"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  height="48px"
                  position="relative"
                  role="button"
                  aria-label="User Menu"
                >
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
                  <Box 
                    ml={3} 
                    flex={1}
                    opacity={isMenuOpen || isUserMenuOpen ? 1 : 0}
                    transition="opacity 0.3s ease-in-out"
                    display={isMenuOpen || isUserMenuOpen ? "block" : "none"}
                  >
                    <Text fontSize="xs" color="white">
                      {user?.username || 'Loading...'}
                    </Text>
                  </Box>
                  {(isMenuOpen || isUserMenuOpen) && (
                    <ChevronDown 
                      size={16} 
                      color="white" 
                      style={{ 
                        marginLeft: '8px',
                        opacity: 0.6,
                        transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                  )}
                </Flex>
              </PopoverTrigger>

              <PopoverContent
                bg="rgba(255, 255, 255, 0.1)"
                borderColor="rgba(255, 255, 255, 0.18)"
                backdropFilter="blur(10px)"
                boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
                _focus={{ boxShadow: "none" }}
                width="200px"
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
                    <MenuItem icon={Settings} item="Settings" onClick={() => navigate('/settings')} />
                    <MenuItem icon={HelpCircle} item="Help Center" onClick={() => {}} />
                    <MenuItem icon={LifeBuoy} item="Get Support" onClick={handleSupportClick} />
                    <Box my={2} h="1px" bg="whiteAlpha.200" />
                    <MenuItem icon={LogOut} item="Log Out" onClick={handleLogout} />
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