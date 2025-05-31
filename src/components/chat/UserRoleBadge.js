// frontend/src/components/chat/UserRoleBadge.js
import React from 'react';
import {
  Badge,
  HStack,
  Tooltip,
  Text
} from '@chakra-ui/react';
import { 
  getUserRoleBadges, 
  getUserPrimaryRole,
  formatRoleName,
  isAdmin,
  isModerator,
  isVip
} from '../../utils/roleColors';
import { Crown, Shield, Star } from 'lucide-react';

const UserRoleBadge = ({ 
  roles, 
  showAll = false, 
  showIcon = true, 
  size = 'sm',
  variant = 'subtle' 
}) => {
  if (!roles || roles.length === 0) {
    return null;
  }

  const roleBadges = getUserRoleBadges(roles);
  const primaryRole = getUserPrimaryRole(roles);
  
  // Get the appropriate icon for the primary role
  const getRoleIcon = (roleName) => {
    if (isAdmin(roles)) {
      return <Crown size={12} />;
    } else if (isModerator(roles)) {
      return <Shield size={12} />;
    } else if (isVip(roles)) {
      return <Star size={12} />;
    }
    return null;
  };

  if (showAll) {
    // Show all roles as separate badges
    return (
      <HStack spacing={1}>
        {roleBadges.map((role, index) => (
          <Tooltip
            key={index}
            label={`${role.name} role`}
            placement="top"
            hasArrow
          >
            <Badge
              colorScheme={role.colorScheme}
              variant={variant}
              size={size}
              display="flex"
              alignItems="center"
              gap={1}
              px={2}
              borderRadius="full"
              style={{ backgroundColor: `${role.color}20`, borderColor: role.color }}
            >
              {showIcon && getRoleIcon(role.name)}
              <Text fontSize={size === 'sm' ? 'xs' : 'sm'}>
                {formatRoleName(role.name)}
              </Text>
            </Badge>
          </Tooltip>
        ))}
      </HStack>
    );
  } else {
    // Show only the highest priority role
    const topRole = roleBadges[0];
    if (!topRole) return null;

    return (
      <Tooltip
        label={`${topRole.name} role`}
        placement="top"
        hasArrow
      >
        <Badge
          colorScheme={topRole.colorScheme}
          variant={variant}
          size={size}
          display="flex"
          alignItems="center"
          gap={1}
          px={2}
          borderRadius="full"
          style={{ backgroundColor: `${topRole.color}20`, borderColor: topRole.color }}
        >
          {showIcon && getRoleIcon(topRole.name)}
          <Text fontSize={size === 'sm' ? 'xs' : 'sm'}>
            {formatRoleName(topRole.name)}
          </Text>
        </Badge>
      </Tooltip>
    );
  }
};

export default UserRoleBadge;