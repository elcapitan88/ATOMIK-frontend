import React from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  useToast
} from '@chakra-ui/react';
import {
  MoreVertical,
  Eye,
  Edit,
  Shield,
  TestTube,
  Mail,
  UserX,
  UserCheck,
  Settings
} from 'lucide-react';

const QuickActionsMenu = ({
  user,
  availableRoles,
  hasBetaAccess,
  onRoleAssignment,
  onRoleRemoval,
  onBetaToggle,
  onViewDetails
}) => {
  const toast = useToast();

  // Handle role assignment
  const handleRoleAssignment = (roleName) => {
    const roleColors = {
      'Admin': '#FF6B35',
      'Manager': '#F7931E',
      'Support': '#9932CC',
      'Beta Tester': '#4CAF50',
      'User': '#6B7280'
    };

    onRoleAssignment(user.id, {
      role_name: roleName,
      role_color: roleColors[roleName] || '#6B7280',
      role_priority: roleName === 'Admin' ? 10 : roleName === 'Manager' ? 8 : 5
    });
  };

  // Handle role removal
  const handleRoleRemoval = (roleName) => {
    onRoleRemoval(user.id, roleName);
  };

  // Handle beta toggle
  const handleBetaToggle = () => {
    onBetaToggle(user.id, !hasBetaAccess);
  };

  // Handle status toggle
  const handleStatusToggle = () => {
    // This would need to be implemented in the parent component
    toast({
      title: 'Coming Soon',
      description: 'User status toggle will be implemented',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // Handle email user
  const handleEmailUser = () => {
    toast({
      title: 'Coming Soon',
      description: 'Email functionality will be implemented',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        icon={<MoreVertical size={16} />}
        variant="ghost"
        color="white"
        size="sm"
        _hover={{ bg: "whiteAlpha.100" }}
        aria-label="Quick actions"
      />
      <MenuList 
        bg="rgba(0, 0, 0, 0.9)" 
        borderColor="whiteAlpha.200"
        boxShadow="lg"
      >
        {/* View Details */}
        <MenuItem 
          icon={<Eye size={14} />} 
          onClick={onViewDetails}
          _hover={{ bg: "whiteAlpha.100" }}
          bg="transparent"
          color="white"
        >
          View Details
        </MenuItem>

        {/* Edit User */}
        <MenuItem 
          icon={<Edit size={14} />}
          _hover={{ bg: "whiteAlpha.100" }}
          bg="transparent"
          color="white"
        >
          Edit User
        </MenuItem>

        <MenuDivider borderColor="whiteAlpha.200" />

        {/* Role Management */}
        <MenuItem 
          icon={<Shield size={14} />}
          _hover={{ bg: "whiteAlpha.100" }}
          bg="transparent"
          color="#F7931E"
          isDisabled
        >
          Assign Role →
        </MenuItem>

        {/* Quick role assignments for common roles */}
        {!user.roles.includes('Admin') && !user.is_superuser && (
          <MenuItem 
            pl={8}
            fontSize="sm"
            onClick={() => handleRoleAssignment('Admin')}
            _hover={{ bg: "whiteAlpha.100" }}
            bg="transparent"
            color="white"
          >
            Make Admin
          </MenuItem>
        )}

        {!user.roles.includes('Manager') && (
          <MenuItem 
            pl={8}
            fontSize="sm"
            onClick={() => handleRoleAssignment('Manager')}
            _hover={{ bg: "whiteAlpha.100" }}
            bg="transparent"
            color="white"
          >
            Make Manager
          </MenuItem>
        )}

        {!user.roles.includes('Support') && (
          <MenuItem 
            pl={8}
            fontSize="sm"
            onClick={() => handleRoleAssignment('Support')}
            _hover={{ bg: "whiteAlpha.100" }}
            bg="transparent"
            color="white"
          >
            Make Support
          </MenuItem>
        )}

        {/* Role removal options */}
        {user.roles.length > 0 && user.roles.some(role => role !== 'User') && (
          <>
            <MenuDivider borderColor="whiteAlpha.200" />
            <MenuItem 
              icon={<UserX size={14} />}
              _hover={{ bg: "whiteAlpha.100" }}
              bg="transparent"
              color="#FF6B6B"
              isDisabled
            >
              Remove Role →
            </MenuItem>
            
            {user.roles.filter(role => role !== 'User').map(role => (
              <MenuItem 
                key={role}
                pl={8}
                fontSize="sm"
                onClick={() => handleRoleRemoval(role)}
                _hover={{ bg: "whiteAlpha.100" }}
                bg="transparent"
                color="#FF6B6B"
              >
                Remove {role}
              </MenuItem>
            ))}
          </>
        )}

        <MenuDivider borderColor="whiteAlpha.200" />

        {/* Beta Access Toggle */}
        <MenuItem 
          icon={<TestTube size={14} />}
          onClick={handleBetaToggle}
          _hover={{ bg: "whiteAlpha.100" }}
          bg="transparent"
          color={hasBetaAccess ? "#FF6B6B" : "#4CAF50"}
        >
          {hasBetaAccess ? 'Remove Beta Access' : 'Grant Beta Access'}
        </MenuItem>

        <MenuDivider borderColor="whiteAlpha.200" />

        {/* Status Toggle */}
        <MenuItem 
          icon={user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
          onClick={handleStatusToggle}
          _hover={{ bg: "whiteAlpha.100" }}
          bg="transparent"
          color={user.is_active ? "#FF6B6B" : "#4CAF50"}
        >
          {user.is_active ? 'Deactivate User' : 'Activate User'}
        </MenuItem>

        {/* Email User */}
        <MenuItem 
          icon={<Mail size={14} />}
          onClick={handleEmailUser}
          _hover={{ bg: "whiteAlpha.100" }}
          bg="transparent"
          color="white"
        >
          Email User
        </MenuItem>

        <MenuDivider borderColor="whiteAlpha.200" />

        {/* Advanced Settings */}
        <MenuItem 
          icon={<Settings size={14} />}
          _hover={{ bg: "whiteAlpha.100" }}
          bg="transparent"
          color="whiteAlpha.600"
        >
          Advanced Settings
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default QuickActionsMenu;