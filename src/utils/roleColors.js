// frontend/src/utils/roleColors.js

// Role color mapping - matches backend ROLE_COLORS
export const ROLE_COLORS = {
  'Admin': '#FF0000',
  'Moderator': '#FFA500',
  'Beta Tester': '#9932CC',  // Purple for beta testers
  'Legacy Free': '#808080',  // For grandfathered free users
  'Starter': '#FFFFFF',      // New display name for Pro tier
  'Pro': '#00C6E0',         // New display name for Elite tier
  'VIP': '#FFD700',         // For special users
};

// Role priority mapping - matches backend ROLE_PRIORITIES
export const ROLE_PRIORITIES = {
  'Admin': 100,
  'Moderator': 90,
  'Beta Tester': 80,
  'VIP': 85,
  'Pro': 70,
  'Starter': 60,
  'Legacy Free': 50,
};

/**
 * Get the color for a user's highest priority role
 * @param {Array} roles - Array of user roles
 * @returns {string} - Hex color code
 */
export const getUserRoleColor = (roles) => {
  if (!roles || roles.length === 0) {
    return ROLE_COLORS['Legacy Free'];
  }

  // Sort roles by priority (highest first)
  const sortedRoles = roles.sort((a, b) => {
    const priorityA = ROLE_PRIORITIES[a.role_name] || 0;
    const priorityB = ROLE_PRIORITIES[b.role_name] || 0;
    return priorityB - priorityA;
  });

  // Return the color of the highest priority role
  const topRole = sortedRoles[0];
  return ROLE_COLORS[topRole.role_name] || ROLE_COLORS['Legacy Free'];
};

/**
 * Get the highest priority role name for a user
 * @param {Array} roles - Array of user roles
 * @returns {string} - Role name
 */
export const getUserPrimaryRole = (roles) => {
  if (!roles || roles.length === 0) {
    return 'Legacy Free';
  }

  // Sort roles by priority (highest first)
  const sortedRoles = roles.sort((a, b) => {
    const priorityA = ROLE_PRIORITIES[a.role_name] || 0;
    const priorityB = ROLE_PRIORITIES[b.role_name] || 0;
    return priorityB - priorityA;
  });

  return sortedRoles[0].role_name;
};

/**
 * Check if user has a specific role
 * @param {Array} roles - Array of user roles
 * @param {string} roleName - Role name to check for
 * @returns {boolean}
 */
export const hasRole = (roles, roleName) => {
  if (!roles || roles.length === 0) {
    return false;
  }

  return roles.some(role => role.role_name === roleName && role.is_active);
};

/**
 * Check if user is admin
 * @param {Array} roles - Array of user roles
 * @returns {boolean}
 */
export const isAdmin = (roles) => {
  return hasRole(roles, 'Admin');
};

/**
 * Check if user is moderator
 * @param {Array} roles - Array of user roles
 * @returns {boolean}
 */
export const isModerator = (roles) => {
  return hasRole(roles, 'Moderator');
};

/**
 * Check if user is staff (admin or moderator)
 * @param {Array} roles - Array of user roles
 * @returns {boolean}
 */
export const isStaff = (roles) => {
  return isAdmin(roles) || isModerator(roles);
};

/**
 * Check if user has VIP role
 * @param {Array} roles - Array of user roles
 * @returns {boolean}
 */
export const isVip = (roles) => {
  return hasRole(roles, 'VIP');
};

/**
 * Check if user is beta tester
 * @param {Array} roles - Array of user roles
 * @returns {boolean}
 */
export const isBetaTester = (roles) => {
  return hasRole(roles, 'Beta Tester');
};

/**
 * Get role badge color scheme for Chakra UI
 * @param {string} roleName - Role name
 * @returns {string} - Chakra UI color scheme
 */
export const getRoleBadgeColorScheme = (roleName) => {
  switch (roleName) {
    case 'Admin':
      return 'red';
    case 'Moderator':
      return 'orange';
    case 'Beta Tester':
      return 'purple';
    case 'VIP':
      return 'yellow';
    case 'Pro':
      return 'cyan';
    case 'Starter':
      return 'gray';
    case 'Legacy Free':
      return 'gray';
    default:
      return 'gray';
  }
};

/**
 * Get all role badges for a user
 * @param {Array} roles - Array of user roles
 * @returns {Array} - Array of role objects with display info
 */
export const getUserRoleBadges = (roles) => {
  if (!roles || roles.length === 0) {
    return [{
      name: 'Legacy Free',
      color: ROLE_COLORS['Legacy Free'],
      colorScheme: 'gray',
      priority: ROLE_PRIORITIES['Legacy Free']
    }];
  }

  return roles
    .filter(role => role.is_active)
    .map(role => ({
      name: role.role_name,
      color: ROLE_COLORS[role.role_name] || ROLE_COLORS['Legacy Free'],
      colorScheme: getRoleBadgeColorScheme(role.role_name),
      priority: ROLE_PRIORITIES[role.role_name] || 0
    }))
    .sort((a, b) => b.priority - a.priority);
};

/**
 * Convert subscription tier to role name
 * @param {string} tier - Subscription tier
 * @returns {string} - Role name
 */
export const subscriptionTierToRole = (tier) => {
  const mapping = {
    'starter': 'Legacy Free',
    'pro': 'Starter',
    'elite': 'Pro'
  };
  
  return mapping[tier] || 'Legacy Free';
};

/**
 * Get role display name with proper formatting
 * @param {string} roleName - Role name
 * @returns {string} - Formatted role name
 */
export const formatRoleName = (roleName) => {
  if (!roleName) return 'Member';
  
  // Handle special cases
  if (roleName === 'Legacy Free') return 'Free';
  
  return roleName;
};

/**
 * Check if a role has special permissions
 * @param {string} roleName - Role name
 * @returns {object} - Permission object
 */
export const getRolePermissions = (roleName) => {
  const basePermissions = {
    canSendMessages: true,
    canReact: true,
    canReply: true,
    canEdit: false,
    canDelete: false,
    canManageChannels: false,
    canManageUsers: false,
    canManageRoles: false,
    canAccessBetaFeatures: false,
    canSubmitBetaFeedback: false
  };

  switch (roleName) {
    case 'Admin':
      return {
        ...basePermissions,
        canEdit: true,
        canDelete: true,
        canManageChannels: true,
        canManageUsers: true,
        canManageRoles: true,
        canAccessBetaFeatures: true,
        canSubmitBetaFeedback: true
      };
    
    case 'Moderator':
      return {
        ...basePermissions,
        canEdit: true,
        canDelete: true,
        canManageChannels: true,
        canAccessBetaFeatures: true,
        canSubmitBetaFeedback: true
      };
    
    case 'Beta Tester':
      return {
        ...basePermissions,
        canAccessBetaFeatures: true,
        canSubmitBetaFeedback: true
      };
    
    case 'VIP':
      return {
        ...basePermissions,
        canEdit: true
      };
    
    default:
      return basePermissions;
  }
};