import { useState, useEffect } from 'react';
import axiosInstance from '@/services/axiosConfig';
import { useAuth } from '@/contexts/AuthContext';

export const useCreatorProfile = (username) => {
  const { user } = useAuth();

  // State management
  const [profile, setProfile] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Fetch creator profile data
  const fetchProfile = async () => {
    if (!username) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch creator profile
      const profileResponse = await axiosInstance.get(`/api/v1/creators/profile/${username}`);
      const profileData = profileResponse.data;

      setProfile(profileData);
      setIsFollowing(profileData.is_following);
      setFollowerCount(profileData.follower_count);

      // Fetch creator's strategies if we have the profile
      if (profileData && profileData.user_id) {
        const strategiesResponse = await axiosInstance.get(
          `/api/v1/creators/${profileData.user_id}/strategies?limit=20`
        );
        setStrategies(strategiesResponse.data.strategies || []);
      }
    } catch (err) {
      console.error('Error fetching creator profile:', err);

      if (err.response?.status === 404) {
        setError('Creator not found');
      } else {
        setError(err.message || 'Failed to load creator profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Follow creator
  const followCreator = async () => {
    if (!profile || !user) {
      throw new Error('Please sign in to follow creators');
    }

    setIsFollowLoading(true);
    try {
      const response = await axiosInstance.post(`/api/v1/creators/${profile.user_id}/follow`);

      setIsFollowing(true);
      setFollowerCount(response.data.follower_count);
    } catch (err) {
      console.error('Error following creator:', err);
      throw new Error(err.response?.data?.detail || 'Failed to follow creator');
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Unfollow creator
  const unfollowCreator = async () => {
    if (!profile || !user) {
      throw new Error('Please sign in to follow creators');
    }

    setIsFollowLoading(true);
    try {
      const response = await axiosInstance.delete(`/api/v1/creators/${profile.user_id}/unfollow`);

      setIsFollowing(false);
      setFollowerCount(response.data.follower_count);
    } catch (err) {
      console.error('Error unfollowing creator:', err);
      throw new Error(err.response?.data?.detail || 'Failed to unfollow creator');
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Load more strategies
  const loadMoreStrategies = async (page = 1, limit = 20) => {
    if (!profile) return;

    try {
      const offset = (page - 1) * limit;
      const response = await axiosInstance.get(
        `/api/v1/creators/${profile.user_id}/strategies?limit=${limit}&offset=${offset}`
      );

      if (page === 1) {
        setStrategies(response.data.strategies || []);
      } else {
        setStrategies(prev => [...prev, ...(response.data.strategies || [])]);
      }

      return response.data;
    } catch (err) {
      console.error('Error loading strategies:', err);
      throw new Error('Failed to load strategies');
    }
  };

  // Refresh profile data
  const refreshProfile = () => {
    fetchProfile();
  };

  // Effect to fetch data when username changes
  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username, user]);

  return {
    // Data
    profile,
    strategies,
    isLoading,
    error,
    isFollowing,
    followerCount,
    isFollowLoading,

    // Actions
    followCreator,
    unfollowCreator,
    loadMoreStrategies,
    refreshProfile
  };
};