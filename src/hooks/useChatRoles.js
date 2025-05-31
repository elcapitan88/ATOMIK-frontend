// frontend/src/hooks/useChatRoles.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosConfig from '../services/axiosConfig';

export const useChatRoles = () => {
  const [userRoles, setUserRoles] = useState({}); // Map of user_id -> roles array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch roles for specific users
  const fetchUserRoles = useCallback(async (userIds) => {
    if (!userIds || userIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch roles for each user (in a real app, you'd want to batch this)
      const rolePromises = userIds.map(async (userId) => {
        try {
          const response = await axiosConfig.get(`/api/v1/chat/admin/users/${userId}/roles`);
          return { userId, roles: response.data };
        } catch (err) {
          // If we can't fetch roles (permission denied, etc), return empty array
          console.warn(`Could not fetch roles for user ${userId}:`, err);
          return { userId, roles: [] };
        }
      });

      const results = await Promise.all(rolePromises);
      
      // Update userRoles state
      setUserRoles(prev => {
        const newRoles = { ...prev };
        results.forEach(({ userId, roles }) => {
          newRoles[userId] = roles;
        });
        return newRoles;
      });

    } catch (err) {
      console.error('Error fetching user roles:', err);
      setError('Failed to fetch user roles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync current user's subscription role
  const syncCurrentUserRole = useCallback(async () => {
    if (!user?.id) return;

    try {
      await axiosConfig.post(`/api/v1/chat/admin/users/${user.id}/sync-subscription-role`);
      // Refresh current user's roles
      await fetchUserRoles([user.id]);
    } catch (err) {
      console.warn('Could not sync current user role:', err);
    }
  }, [user?.id, fetchUserRoles]);

  // Assign admin role (superuser only)
  const assignAdminRole = useCallback(async (userId) => {
    try {
      await axiosConfig.post(`/api/v1/chat/admin/users/${userId}/roles/admin`);
      // Refresh roles for this user
      await fetchUserRoles([userId]);
      return true;
    } catch (err) {
      console.error('Error assigning admin role:', err);
      throw err;
    }
  }, [fetchUserRoles]);

  // Assign moderator role
  const assignModeratorRole = useCallback(async (userId) => {
    try {
      await axiosConfig.post(`/api/v1/chat/admin/users/${userId}/roles/moderator`);
      // Refresh roles for this user
      await fetchUserRoles([userId]);
      return true;
    } catch (err) {
      console.error('Error assigning moderator role:', err);
      throw err;
    }
  }, [fetchUserRoles]);

  // Assign VIP role
  const assignVipRole = useCallback(async (userId) => {
    try {
      await axiosConfig.post(`/api/v1/chat/admin/users/${userId}/roles/vip`);
      // Refresh roles for this user
      await fetchUserRoles([userId]);
      return true;
    } catch (err) {
      console.error('Error assigning VIP role:', err);
      throw err;
    }
  }, [fetchUserRoles]);

  // Remove admin role
  const removeAdminRole = useCallback(async (userId) => {
    try {
      await axiosConfig.delete(`/api/v1/chat/admin/users/${userId}/roles/admin`);
      // Refresh roles for this user
      await fetchUserRoles([userId]);
      return true;
    } catch (err) {
      console.error('Error removing admin role:', err);
      throw err;
    }
  }, [fetchUserRoles]);

  // Remove moderator role
  const removeModeratorRole = useCallback(async (userId) => {
    try {
      await axiosConfig.delete(`/api/v1/chat/admin/users/${userId}/roles/moderator`);
      // Refresh roles for this user
      await fetchUserRoles([userId]);
      return true;
    } catch (err) {
      console.error('Error removing moderator role:', err);
      throw err;
    }
  }, [fetchUserRoles]);

  // Remove VIP role
  const removeVipRole = useCallback(async (userId) => {
    try {
      await axiosConfig.delete(`/api/v1/chat/admin/users/${userId}/roles/vip`);
      // Refresh roles for this user
      await fetchUserRoles([userId]);
      return true;
    } catch (err) {
      console.error('Error removing VIP role:', err);
      throw err;
    }
  }, [fetchUserRoles]);

  // Get all admins
  const getAllAdmins = useCallback(async () => {
    try {
      const response = await axiosConfig.get('/api/v1/chat/admin/roles/admins');
      return response.data.admins;
    } catch (err) {
      console.error('Error fetching admins:', err);
      throw err;
    }
  }, []);

  // Get all moderators
  const getAllModerators = useCallback(async () => {
    try {
      const response = await axiosConfig.get('/api/v1/chat/admin/roles/moderators');
      return response.data.moderators;
    } catch (err) {
      console.error('Error fetching moderators:', err);
      throw err;
    }
  }, []);

  // Auto-sync current user role on mount and subscription changes
  useEffect(() => {
    if (user?.id) {
      syncCurrentUserRole();
    }
  }, [user?.subscription?.tier, syncCurrentUserRole]);

  return {
    userRoles,
    loading,
    error,
    fetchUserRoles,
    syncCurrentUserRole,
    assignAdminRole,
    assignModeratorRole,
    assignVipRole,
    removeAdminRole,
    removeModeratorRole,
    removeVipRole,
    getAllAdmins,
    getAllModerators
  };
};