import React, { useState, useEffect } from 'react';
import { Box, VStack, Text, Flex, Link, Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverBody, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Settings, HelpCircle, Download, LogOut, ChevronDown, User } from 'lucide-react';
import axios from '@/services/axiosConfig';

const MenuItem = ({ icon: Icon, children, onClick, external }) => (
  <Flex
    align="center"
    p={2}
    cursor="pointer"
    _hover={{ bg: "whiteAlpha.200" }}
    borderRadius="md"
    onClick={onClick}
  >
    <Icon size={16} className="mr-2" />
    <Text fontSize="sm">{children}</Text>
    {external && (
      <Box ml="auto">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 2.5V9.5H9.5V6M9.5 2.5H6" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6 6L9.5 2.5" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      </Box>
    )}
  </Flex>
);

const Menu = ({ onSelectItem }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState('Dashboard');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const menuItems = ['Dashboard', 'Strategies'];
  
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        setUserEmail(payload.email);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    onSelectItem(item);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout/');
      localStorage.removeItem('access_token');
      toast({
        title: "Logged out successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate('/auth');
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

  const handleMouseLeave = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  return (
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
        {menuItems.map((item) => (
          <Box
            key={item}
            py={2}
            px={3}
            bg={selectedItem === item ? 'whiteAlpha.200' : 'transparent'}
            borderRadius="md"
            onClick={() => handleItemClick(item)}
            cursor="pointer"
          >
            <Text color="white" fontSize="sm">{item}</Text>
          </Box>
        ))}
      </VStack>

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
                <Text fontSize="xs" color="white">{userEmail || 'Loading...'}</Text>
                <Text fontSize="xs" color="whiteAlpha.600">Pro plan</Text>
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
              <Text fontSize="xs" color="whiteAlpha.900">{userEmail || 'Loading...'}</Text>
              <Text fontSize="xs" color="whiteAlpha.600">Pro plan</Text>
            </PopoverHeader>
            <PopoverBody p={2}>
              <VStack spacing={1} align="stretch">
                <MenuItem icon={Settings} onClick={() => navigate('/settings')}>Settings</MenuItem>
                <MenuItem icon={HelpCircle} onClick={() => {}}>Help Center</MenuItem>
                <MenuItem icon={Download} onClick={() => {}}>Download Apps</MenuItem>
                <Box my={2} h="1px" bg="whiteAlpha.200" />
                <MenuItem icon={LogOut} onClick={handleLogout}>Log Out</MenuItem>
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Box>
    </Flex>
  );
};

export default Menu;