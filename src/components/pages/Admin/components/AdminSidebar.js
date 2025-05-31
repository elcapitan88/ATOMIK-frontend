// frontend/src/components/pages/Admin/components/AdminSidebar.js
import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Divider,
  Badge,
  Collapse,
  useDisclosure
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  BarChart3,
  Settings,
  Shield,
  Webhook,
  TestTube,
  ChevronDown,
  ChevronRight,
  Activity,
  TrendingUp,
  MessageSquare,
  CreditCard,
  Flag
} from 'lucide-react';

// Sidebar navigation items
const navigationItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Home,
    path: '/admin',
    exact: true
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    path: '/admin/users',
    badge: { count: 1254, color: 'blue' }
  },
  {
    id: 'beta-testers',
    label: 'Beta Testers',
    icon: TestTube,
    path: '/admin/beta-testers',
    badge: { count: 45, color: 'purple' },
    isNew: true
  },
  {
    id: 'feature-flags',
    label: 'Feature Flags',
    icon: Flag,
    path: '/admin/feature-flags',
    badge: { count: 8, color: 'orange' },
    isNew: true
  },
  {
    id: 'roles',
    label: 'Roles & Permissions',
    icon: Shield,
    path: '/admin/roles'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    submenu: [
      {
        id: 'overview-analytics',
        label: 'Overview',
        icon: Activity,
        path: '/admin/analytics/overview'
      },
      {
        id: 'user-growth',
        label: 'User Growth',
        icon: TrendingUp,
        path: '/admin/analytics/users'
      },
      {
        id: 'retention',
        label: 'Retention',
        icon: Users,
        path: '/admin/analytics/retention'
      }
    ]
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    icon: Webhook,
    path: '/admin/webhooks',
    badge: { count: 12, color: 'green' }
  },
  {
    id: 'billing',
    label: 'Billing & Subscriptions',
    icon: CreditCard,
    path: '/admin/billing'
  },
  {
    id: 'support',
    label: 'Support',
    icon: MessageSquare,
    path: '/admin/support',
    badge: { count: 3, color: 'red' }
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/admin/settings'
  }
];

// Sidebar Item Component
const SidebarItem = ({ item, isActive, onClick, level = 0 }) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });
  const hasSubmenu = item.submenu && item.submenu.length > 0;
  const paddingLeft = level * 4 + 4;

  const handleClick = () => {
    if (hasSubmenu) {
      onToggle();
    } else {
      onClick(item.path);
    }
  };

  return (
    <Box>
      <HStack
        w="full"
        px={paddingLeft}
        py={3}
        cursor="pointer"
        onClick={handleClick}
        bg={isActive ? "rgba(0, 198, 224, 0.15)" : "transparent"}
        borderLeft={isActive ? "3px solid #00C6E0" : "3px solid transparent"}
        _hover={{ 
          bg: isActive ? "rgba(0, 198, 224, 0.15)" : "rgba(255, 255, 255, 0.05)" 
        }}
        transition="all 0.2s"
        role="group"
      >
        <Icon 
          as={item.icon} 
          boxSize={5} 
          color={isActive ? "#00C6E0" : "whiteAlpha.700"}
          _groupHover={{ color: isActive ? "#00C6E0" : "white" }}
        />
        
        <Text
          flex={1}
          color={isActive ? "#00C6E0" : "whiteAlpha.800"}
          fontWeight={isActive ? "semibold" : "normal"}
          fontSize="sm"
          _groupHover={{ color: isActive ? "#00C6E0" : "white" }}
        >
          {item.label}
        </Text>

        {/* New Badge */}
        {item.isNew && (
          <Badge colorScheme="green" variant="solid" fontSize="xs" px={2}>
            NEW
          </Badge>
        )}

        {/* Count Badge */}
        {item.badge && (
          <Badge colorScheme={item.badge.color} variant="subtle" fontSize="xs">
            {item.badge.count}
          </Badge>
        )}

        {/* Submenu Chevron */}
        {hasSubmenu && (
          <Icon
            as={isOpen ? ChevronDown : ChevronRight}
            boxSize={4}
            color="whiteAlpha.600"
            _groupHover={{ color: "white" }}
          />
        )}
      </HStack>

      {/* Submenu */}
      {hasSubmenu && (
        <Collapse in={isOpen} animateOpacity>
          <VStack spacing={0} align="stretch">
            {item.submenu.map(subItem => (
              <SidebarItem
                key={subItem.id}
                item={subItem}
                isActive={window.location.pathname === subItem.path}
                onClick={onClick}
                level={level + 1}
              />
            ))}
          </VStack>
        </Collapse>
      )}
    </Box>
  );
};

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isItemActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <Box
      w="280px"
      h="100vh"
      bg="rgba(0, 0, 0, 0.4)"
      borderRight="1px solid"
      borderColor="whiteAlpha.200"
      overflowY="auto"
      position="sticky"
      top={0}
    >
      {/* Sidebar Header */}
      <Box p={6} borderBottom="1px solid" borderColor="whiteAlpha.200">
        <HStack spacing={3}>
          <Box
            w={10}
            h={10}
            bg="linear-gradient(135deg, #00C6E0 0%, #0099B8 100%)"
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Shield size={20} color="white" />
          </Box>
          <VStack align="start" spacing={0}>
            <Text color="white" fontWeight="bold" fontSize="lg">
              Admin Panel
            </Text>
            <Text color="whiteAlpha.600" fontSize="sm">
              System Management
            </Text>
          </VStack>
        </HStack>
      </Box>

      {/* Navigation */}
      <VStack spacing={0} align="stretch" py={4}>
        {navigationItems.map((item, index) => (
          <React.Fragment key={item.id}>
            <SidebarItem
              item={item}
              isActive={isItemActive(item)}
              onClick={handleNavigation}
            />
            
            {/* Add divider after certain sections */}
            {(index === 3 || index === 5 || index === 7) && (
              <Box px={4} py={2}>
                <Divider borderColor="whiteAlpha.200" />
              </Box>
            )}
          </React.Fragment>
        ))}
      </VStack>

      {/* Footer */}
      <Box p={4} mt="auto" borderTop="1px solid" borderColor="whiteAlpha.200">
        <Text color="whiteAlpha.500" fontSize="xs" textAlign="center">
          Atomik Trading Admin v2.1.0
        </Text>
      </Box>
    </Box>
  );
};

export default AdminSidebar;